-- Leesoefening "Ik lees zelf" (docs/azure-extra.md, stap 2): het kind leest een verhaal hardop en de app luistert
-- mee met Azure-spraakherkenning. Dat levert evenveel sterren op als een verhaal (na goedkeuring, binnen het
-- dagplafond voor activiteiten). De gratis spraakherkenning (5 uur per maand) delen we eerlijk: elk kind
-- hoogstens spraak_seconden_per_dag. De Edge Function spraak-token geeft alleen een token als er nog tijd over is.

alter table public.gezinnen
  add column spraak_seconden_per_dag int not null default 300 check (spraak_seconden_per_dag between 0 and 3600);

create table public.spraakgebruik (
  kind_id uuid not null references public.gebruikers on delete cascade,
  dag date not null,
  seconden int not null default 0 check (seconden >= 0),
  primary key (kind_id, dag)
);
alter table public.spraakgebruik enable row level security;
revoke all on public.spraakgebruik from anon, authenticated;

-- Telt de gebruikte seconden spraakherkenning bij (hoogstens 120 per keer: de app meldt elke minuut) en geeft
-- terug hoeveel seconden er vandaag nog over zijn.
create function public.spraak_gebruik(p_kind uuid, p_seconden int default 0) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_gezin public.gezinnen;
  v_dag date;
  v_al int;
begin
  select * into v_gezin from public.gezinnen where id = public.mijn_gezin();
  if not found then raise exception 'geen gezin'; end if;
  if not exists (select 1 from public.gebruikers where id = p_kind and gezin_id = v_gezin.id and rol = 'kind') then
    raise exception 'kind niet gevonden';
  end if;
  v_dag := (public.nu() at time zone v_gezin.tijdzone)::date;
  insert into public.spraakgebruik as s (kind_id, dag, seconden)
  values (p_kind, v_dag, least(greatest(coalesce(p_seconden, 0), 0), 120))
  on conflict (kind_id, dag) do update set seconden = s.seconden + excluded.seconden
  returning seconden into v_al;
  return greatest(0, v_gezin.spraak_seconden_per_dag - v_al);
end $$;

alter table public.activiteitlog drop constraint activiteitlog_activiteit_check;
alter table public.activiteitlog add constraint activiteitlog_activiteit_check check (activiteit in
  ('memory', 'penalty_schieten', 'penalty_keepen', 'rekenen', 'verhaal', 'kleurplaat', 'tekenen',
   'racen', 'basket', 'koken', 'touwspringen', 'huisdier', 'puzzel', 'zelf_gelezen'));

create or replace function public.activiteit_omschrijving(p_activiteit text, p_inhoud jsonb) returns text
language sql immutable set search_path = '' as $$
  select case p_activiteit
    when 'rekenen' then 'Rekenen: ' || coalesce(p_inhoud ->> 'goed', '0') || ' van '
                        || coalesce(p_inhoud ->> 'sommen', '10') || ' in één keer goed'
    when 'verhaal' then 'Verhaal: ' || coalesce(p_inhoud ->> 'titel', 'uitgelezen')
    when 'zelf_gelezen' then 'Zelf gelezen: ' || coalesce(p_inhoud ->> 'titel', 'verhaal')
                             || coalesce(' (' || (p_inhoud ->> 'goed') || ' van ' || (p_inhoud ->> 'woorden') || ' woorden)', '')
    when 'kleurplaat' then 'Kleurplaat: ' || coalesce(p_inhoud ->> 'titel', 'afgewerkt')
    when 'memory' then 'Memory'
    when 'penalty_schieten' then 'Penalty''s schieten'
    when 'penalty_keepen' then 'Penalty''s keepen'
    when 'racen' then 'Racen'
    when 'basket' then 'Basket'
    when 'koken' then 'Koken' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'touwspringen' then 'Touwspringen'
    when 'huisdier' then 'Huisdier wassen' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
    when 'puzzel' then 'Puzzel' || coalesce(': ' || (p_inhoud ->> 'titel'), '')
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

revoke execute on function public.spraak_gebruik(uuid, int) from public, anon;
grant execute on function public.spraak_gebruik(uuid, int) to authenticated;
grant update (spraak_seconden_per_dag) on public.gezinnen to authenticated;
