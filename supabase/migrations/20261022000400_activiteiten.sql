-- Activiteiten: elk afgewerkt spelletje of verhaal komt in het activiteitlog.
-- Lerende activiteiten (rekenen, verhalen, kleurplaten) leveren sterren op, maar pas
-- als een ouder ze goedkeurt. Spelletjes (memory, penalty's) leveren niets op.

-- Hoeveel sterren activiteiten per kind per dag hoogstens opleveren (voorstel).
alter table public.gezinnen
  add column activiteit_sterren_per_dag int not null default 20 check (activiteit_sterren_per_dag between 0 and 120);

create table public.activiteitlog (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen on delete cascade,
  kind_id uuid not null references public.gebruikers on delete cascade,
  activiteit text not null check (activiteit in
    ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen')),
  inhoud jsonb not null default '{}',
  duur_seconden int not null default 0 check (duur_seconden >= 0),
  sterren int not null default 0 check (sterren >= 0),
  -- null als de activiteit geen sterren oplevert
  status public.inzending_status,
  tijdstip timestamptz not null,
  dag date not null,
  beoordeeld_door uuid references public.gebruikers,
  beoordeeld_op timestamptz
);
create index on public.activiteitlog (kind_id, dag);
create index on public.activiteitlog (gezin_id, status);

-- Omschrijving voor het goedkeurscherm en het puntenlog.
create function public.activiteit_omschrijving(p_activiteit text, p_inhoud jsonb) returns text
language sql immutable set search_path = '' as $$
  select case p_activiteit
    when 'rekenen' then 'Rekenen: ' || coalesce(p_inhoud ->> 'goed', '0') || ' van '
                        || coalesce(p_inhoud ->> 'sommen', '10') || ' in één keer goed'
    when 'verhaal' then 'Verhaal: ' || coalesce(p_inhoud ->> 'titel', 'uitgelezen')
    when 'kleurplaat' then 'Kleurplaat: ' || coalesce(p_inhoud ->> 'titel', 'afgewerkt')
    when 'memory' then 'Memory'
    when 'penalty_schieten' then 'Penalty''s schieten'
    when 'penalty_keepen' then 'Penalty''s keepen'
    else 'Tekenen'
  end
$$;

-- Kind werkt een activiteit af. De sterren worden hier berekend, niet door de app,
-- en begrensd per dag. Geeft het aantal sterren terug dat op goedkeuring wacht.
create function public.activiteit_opslaan(p_kind uuid, p_activiteit text, p_inhoud jsonb default '{}',
                                          p_duur_seconden int default 0)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin public.gezinnen;
  v_nu timestamptz := public.nu();
  v_dag date;
  v_sterren int;
  v_al int;
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
    when 'kleurplaat' then 3
    else 0
  end;

  perform 1 from public.gebruikers where id = p_kind for update;
  if v_sterren > 0 then
    select coalesce(sum(sterren), 0) into v_al from public.activiteitlog
    where kind_id = p_kind and dag = v_dag and status in ('ingediend', 'goedgekeurd');
    v_sterren := greatest(0, least(v_sterren, v_gezin.activiteit_sterren_per_dag - v_al));
  end if;

  insert into public.activiteitlog (gezin_id, kind_id, activiteit, inhoud, duur_seconden, sterren, status, tijdstip, dag)
  values (v_gezin.id, p_kind, p_activiteit, coalesce(p_inhoud, '{}'),
          least(greatest(coalesce(p_duur_seconden, 0), 0), 4 * 3600), v_sterren,
          case when v_sterren > 0 then 'ingediend'::public.inzending_status end, v_nu, v_dag);
  return v_sterren;
end $$;

-- Ouder keurt de sterren van een activiteit goed of af, net als bij een taak.
create function public.activiteit_beoordelen(p_activiteit uuid, p_goedkeuren boolean, p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_act public.activiteitlog;
  v_max int;
  v_bij int;
begin
  if v_ouder is null then return 'pincode_fout'; end if;

  select * into v_act from public.activiteitlog
  where id = p_activiteit and gezin_id = public.mijn_gezin()
  for update;
  if not found then raise exception 'activiteit niet gevonden'; end if;
  if v_act.status is distinct from 'ingediend' then raise exception 'activiteit al beoordeeld'; end if;

  if not p_goedkeuren then
    update public.activiteitlog set status = 'afgekeurd', beoordeeld_door = v_ouder, beoordeeld_op = public.nu()
    where id = p_activiteit;
    return 'afgekeurd';
  end if;

  select max_saldo into v_max from public.gezinnen where id = v_act.gezin_id;
  perform 1 from public.gebruikers where id = v_act.kind_id for update;
  v_bij := greatest(0, least(v_act.sterren, v_max - public.saldo(v_act.kind_id)));

  update public.activiteitlog set status = 'goedgekeurd', beoordeeld_door = v_ouder, beoordeeld_op = public.nu()
  where id = p_activiteit;
  if v_bij > 0 then
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip, door)
    values (v_act.gezin_id, v_act.kind_id, v_bij,
            public.activiteit_omschrijving(v_act.activiteit, v_act.inhoud)
              || case when v_bij < v_act.sterren then ' (spaarmaximum bereikt)' else '' end,
            'activiteit', v_act.id, public.nu(), v_ouder);
  end if;
  return 'goedgekeurd';
end $$;

alter table public.activiteitlog enable row level security;
create policy "eigen gezin lezen" on public.activiteitlog for select to authenticated using (gezin_id = public.mijn_gezin());

revoke all on public.activiteitlog from anon, authenticated;
grant select on public.activiteitlog to authenticated;
grant update (activiteit_sterren_per_dag) on public.gezinnen to authenticated;

revoke execute on function public.activiteit_omschrijving(text, jsonb) from public, anon;
revoke execute on function public.activiteit_opslaan(uuid, text, jsonb, int) from public, anon;
revoke execute on function public.activiteit_beoordelen(uuid, boolean, text) from public, anon;
grant execute on function public.activiteit_omschrijving(text, jsonb), public.activiteit_opslaan(uuid, text, jsonb, int),
  public.activiteit_beoordelen(uuid, boolean, text) to authenticated;
