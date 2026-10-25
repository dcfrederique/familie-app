-- Schrijven (docs/schrijven.md): het kind volgt een letter, woord of lijntje in grijs met de vinger.
-- Een afgewerkt rondje van vijf opdrachten levert 3 sterren op, zoals een kleurplaat, zonder goedkeuring
-- (binnen het dagplafond voor activiteiten en het spaarmaximum). Een rondje met minder dan vijf opdrachten niets.

alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'pompoen', 'zelf_gelezen', 'schrijven'));

create or replace function public.activiteit_omschrijving(p_activiteit text, p_inhoud jsonb) returns text
language sql immutable set search_path = '' as $$
  select case p_activiteit
    when 'rekenen' then 'Rekenen: ' || coalesce(p_inhoud ->> 'goed', '0') || ' van '
                        || coalesce(p_inhoud ->> 'sommen', '10') || ' in één keer goed'
    when 'verhaal' then 'Verhaal: ' || coalesce(p_inhoud ->> 'titel', 'uitgelezen')
    when 'zelf_gelezen' then 'Zelf gelezen: ' || coalesce(p_inhoud ->> 'titel', 'verhaal')
                             || coalesce(' (' || (p_inhoud ->> 'goed') || ' van ' || (p_inhoud ->> 'woorden') || ' woorden)', '')
    when 'kleurplaat' then 'Kleurplaat: ' || coalesce(p_inhoud ->> 'titel', 'afgewerkt')
    when 'schrijven' then 'Schrijven'
    when 'memory' then 'Memory'
    when 'penalty_schieten' then 'Penalty''s schieten'
    when 'penalty_keepen' then 'Penalty''s keepen'
    when 'racen' then 'Racen'
    when 'basket' then 'Basket'
    when 'koken' then 'Koken' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'touwspringen' then 'Touwspringen'
    when 'huisdier' then 'Huisdier wassen' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'puzzel' then 'Puzzel' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'pompoen' then 'Pompoenen maken'
    else 'Tekenen'
  end
$$;

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
