-- Sterrenlimiet per spelletje (gevraagd door de ouders op 25 oktober 2026).
-- Een ouder kan per lerend spelletje instellen hoeveel sterren een kind er per dag hoogstens mee verdient,
-- voor het hele gezin of voor één kind. Zonder rij geldt alleen het gezamenlijke dagplafond voor activiteiten.
create table public.activiteit_limiet (
  gezin_id uuid not null references public.gezinnen on delete cascade,
  -- null = voor alle kinderen; een rij voor één kind gaat voor
  kind_id uuid references public.gebruikers on delete cascade,
  activiteit text not null check (activiteit in ('rekenen', 'verhaal', 'zelf_gelezen', 'kleurplaat', 'schrijven')),
  max_sterren int not null check (max_sterren between 0 and 120),
  gewijzigd_op timestamptz not null default now()
);
create unique index activiteit_limiet_gezin on public.activiteit_limiet (gezin_id, activiteit) where kind_id is null;
create unique index activiteit_limiet_kind on public.activiteit_limiet (kind_id, activiteit) where kind_id is not null;

alter table public.activiteit_limiet enable row level security;
create policy "eigen gezin lezen" on public.activiteit_limiet for select to authenticated using (gezin_id = public.mijn_gezin());
revoke all on public.activiteit_limiet from anon, authenticated;
grant select on public.activiteit_limiet to authenticated;

-- Zet of wis (p_max null) de limiet; alleen vanaf een ouder-account.
create function public.activiteit_limiet_zetten(p_kind uuid, p_activiteit text, p_max int)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin uuid := public.mijn_gezin();
begin
  if v_gezin is null or not public.is_ouder_account() then raise exception 'alleen een ouder'; end if;
  if p_kind is not null and not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_gezin and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;
  delete from public.activiteit_limiet
  where gezin_id = v_gezin and activiteit = p_activiteit and kind_id is not distinct from p_kind;
  if p_max is not null then
    insert into public.activiteit_limiet (gezin_id, kind_id, activiteit, max_sterren) values (v_gezin, p_kind, p_activiteit, p_max);
  end if;
end $$;
revoke execute on function public.activiteit_limiet_zetten(uuid, text, int) from public, anon;
grant execute on function public.activiteit_limiet_zetten(uuid, text, int) to authenticated;

create or replace function public.activiteit_opslaan(p_kind uuid, p_activiteit text, p_inhoud jsonb default '{}',
                                                     p_duur_seconden int default 0)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin public.gezinnen;
  v_nu timestamptz := public.nu();
  v_dag date;
  v_sterren int;
  v_al int;
  v_limiet int;
  v_bij int := 0;
  v_id uuid;
begin
  select * into v_gezin from public.gezinnen where id = public.mijn_gezin();
  if not found then raise exception 'geen gezin'; end if;
  v_dag := (v_nu at time zone v_gezin.tijdzone)::date;
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_gezin.id and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;

  v_sterren := case p_activiteit
    when 'rekenen' then least(10, greatest(0, coalesce((p_inhoud ->> 'goed')::int, 0))) / 2
    when 'verhaal' then 5
    when 'zelf_gelezen' then 5
    when 'kleurplaat' then 3
    when 'schrijven' then case when coalesce((p_inhoud ->> 'items')::int, 0) >= 5 then 3 else 0 end
    else 0
  end;

  perform 1 from public.gebruikers where id = p_kind for update;
  if v_sterren > 0 then
    select coalesce(sum(sterren), 0) into v_al from public.activiteitlog
    where kind_id = p_kind and dag = v_dag and status in ('ingediend', 'goedgekeurd');
    v_sterren := greatest(0, least(v_sterren, v_gezin.activiteit_sterren_per_dag - v_al));
    -- Limiet van de ouders voor dit spelletje: eerst die voor dit kind, anders die voor het gezin.
    select max_sterren into v_limiet from public.activiteit_limiet
    where gezin_id = v_gezin.id and activiteit = p_activiteit and (kind_id = p_kind or kind_id is null)
    order by kind_id nulls last limit 1;
    if v_limiet is not null then
      select coalesce(sum(sterren), 0) into v_al from public.activiteitlog
      where kind_id = p_kind and dag = v_dag and activiteit = p_activiteit and status in ('ingediend', 'goedgekeurd');
      v_sterren := greatest(0, least(v_sterren, v_limiet - v_al));
    end if;
    v_bij := greatest(0, least(v_sterren, v_gezin.max_saldo - public.saldo(p_kind)));
  end if;

  insert into public.activiteitlog (gezin_id, kind_id, activiteit, inhoud, duur_seconden, sterren, status, tijdstip, dag,
                                    beoordeeld_op)
  values (v_gezin.id, p_kind, p_activiteit, coalesce(p_inhoud, '{}'),
          least(greatest(coalesce(p_duur_seconden, 0), 0), 4 * 3600), v_sterren,
          case when v_sterren > 0 then 'goedgekeurd'::public.inzending_status end, v_nu, v_dag,
          case when v_sterren > 0 then v_nu end)
  returning id into v_id;
  if v_bij > 0 then
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip)
    values (v_gezin.id, p_kind, v_bij,
            public.activiteit_omschrijving(p_activiteit, coalesce(p_inhoud, '{}'))
              || case when v_bij < v_sterren then ' (spaarmaximum bereikt)' else '' end,
            'activiteit', v_id, v_nu);
  end if;
  return v_bij;
end $$;
