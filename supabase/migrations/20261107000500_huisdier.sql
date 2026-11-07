-- Mijn huisdier (docs/huisdier.md): een huisdier dat groeit door goedgekeurde taken (elk een pootje) en dat het kind met
-- sterren verzorgt (eten, wassen; knuffelen is gratis). Een ouder zet het per kind aan en kiest de regels.
-- Het huisdier wordt nooit ziek of verdrietig: het heeft hoogstens honger. De sterren gaan van het vrije saldo
-- (puntenlog, bron 'huisdier') en tellen niet mee voor het dagplafond van de schermtijd.

alter table public.puntenlog drop constraint puntenlog_bron_check;
alter table public.puntenlog add constraint puntenlog_bron_check
  check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie', 'welkom', 'aankoop', 'ouder', 'pot', 'huisdier'));

-- Regels per gezin (één rij, aangemaakt bij de eerste keer bewaren; zonder rij gelden de standaardwaarden).
create table public.huisdier_regels (
  gezin_id uuid primary key references public.gezinnen (id) on delete cascade,
  pootjes_baby int not null default 3 check (pootjes_baby between 1 and 100),
  pootjes_kind int not null default 8 check (pootjes_kind between 2 and 200),
  pootjes_groot int not null default 15 check (pootjes_groot between 3 and 300),
  prijs_eten int not null default 2 check (prijs_eten between 0 and 20),
  prijs_wassen int not null default 1 check (prijs_wassen between 0 and 20),
  max_per_dag int not null default 6 check (max_per_dag between 0 and 50),
  soorten text[] not null default array['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn']
    check (cardinality(soorten) >= 1 and soorten <@ array['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn']),
  check (pootjes_baby < pootjes_kind and pootjes_kind < pootjes_groot)
);

create table public.huisdier (
  kind_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  aan boolean not null default false,
  soort text check (soort is null or soort in ('leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn')),
  naam text not null default '' check (char_length(naam) <= 20),
  gekozen_op timestamptz,
  laatst_eten timestamptz,
  laatst_wassen timestamptz,
  laatst_knuffel timestamptz,
  uit_dag date,
  uit_sterren int not null default 0 check (uit_sterren >= 0)
);

-- Hoeveel hartjes (0 tot 5) een meter nog heeft: elke `p_uur` uur verdwijnt er één. Nooit verzorgd = 3.
create function public.huisdier_niveau(p_laatst timestamptz, p_uur numeric) returns int
language sql stable set search_path = '' as $$
  select case when p_laatst is null then 3
    else greatest(0, 5 - floor(extract(epoch from (public.nu() - p_laatst)) / 3600 / p_uur)::int) end
$$;

-- Pootjes = goedgekeurde taken sinds het ei gekozen werd.
create function public.huisdier_pootjes(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select count(*)::int from public.inzendingen i, public.huisdier h
    where h.kind_id = p_kind and i.kind_id = p_kind and i.status = 'goedgekeurd'
      and h.gekozen_op is not null and i.beoordeeld_op >= h.gekozen_op), 0)
$$;

-- Alles in één keer voor het gezin: de regels en per kind wat er staat.
create function public.huisdier_overzicht() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_gezin uuid := public.mijn_gezin();
  v_regels public.huisdier_regels;
  v_dag date;
begin
  select * into v_regels from public.huisdier_regels where gezin_id = v_gezin;
  if not found then v_regels := row(v_gezin, 3, 8, 15, 2, 1, 6, array['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn'])::public.huisdier_regels; end if;
  select (public.nu() at time zone tijdzone)::date into v_dag from public.gezinnen where id = v_gezin;
  return jsonb_build_object(
    'regels', to_jsonb(v_regels) - 'gezin_id',
    'kinderen', coalesce((select jsonb_object_agg(h.kind_id, jsonb_build_object(
        'aan', h.aan, 'soort', h.soort, 'naam', h.naam, 'gekozen_op', h.gekozen_op,
        'laatst_eten', h.laatst_eten, 'laatst_wassen', h.laatst_wassen, 'laatst_knuffel', h.laatst_knuffel,
        'pootjes', public.huisdier_pootjes(h.kind_id),
        'uitgegeven_vandaag', case when h.uit_dag = v_dag then h.uit_sterren else 0 end))
      from public.huisdier h where h.gezin_id = v_gezin), '{}'::jsonb));
end $$;

-- Ouder zet het huisdier voor een kind aan of uit (uit = verborgen; de voortgang blijft bewaard).
create function public.huisdier_instellen(p_kind uuid, p_aan boolean, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind';
  if not found then raise exception 'kind niet gevonden'; end if;
  insert into public.huisdier (kind_id, gezin_id, aan) values (p_kind, v_kind.gezin_id, p_aan)
  on conflict (kind_id) do update set aan = excluded.aan;
  return 'ingesteld';
end $$;

-- Ouder bewaart de regels van het gezin.
create function public.huisdier_regels_bewaren(p_baby int, p_kind int, p_groot int, p_eten int, p_wassen int, p_max int, p_soorten text[],
                                               p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_gezin uuid := public.mijn_gezin();
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  if not (p_baby < p_kind and p_kind < p_groot) then raise exception 'het aantal pootjes moet oplopen'; end if;
  insert into public.huisdier_regels (gezin_id, pootjes_baby, pootjes_kind, pootjes_groot, prijs_eten, prijs_wassen, max_per_dag, soorten)
  values (v_gezin, p_baby, p_kind, p_groot, p_eten, p_wassen, p_max, p_soorten)
  on conflict (gezin_id) do update set pootjes_baby = excluded.pootjes_baby, pootjes_kind = excluded.pootjes_kind,
    pootjes_groot = excluded.pootjes_groot, prijs_eten = excluded.prijs_eten, prijs_wassen = excluded.prijs_wassen,
    max_per_dag = excluded.max_per_dag, soorten = excluded.soorten;
  return 'ingesteld';
end $$;

-- Het kind kiest zijn ei en geeft het een naam (één keer; daarna beslist een ouder via uit en weer aan niet over het ei).
create function public.huisdier_kiezen(p_kind uuid, p_soort text, p_naam text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_h public.huisdier;
  v_soorten text[];
  v_naam text := left(btrim(coalesce(p_naam, '')), 20);
begin
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  select * into v_h from public.huisdier where kind_id = p_kind and aan for update;
  if not found then raise exception 'het huisdier staat uit'; end if;
  if v_h.soort is not null then raise exception 'er is al een huisdier gekozen'; end if;
  select coalesce((select soorten from public.huisdier_regels where gezin_id = v_kind.gezin_id), array['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn'])
    into v_soorten;
  if p_soort is null or not (p_soort = any (v_soorten)) then raise exception 'soort niet toegelaten'; end if;
  if v_naam = '' then raise exception 'geef je huisdier een naam'; end if;
  update public.huisdier set soort = p_soort, naam = v_naam, gekozen_op = public.nu() where kind_id = p_kind;
end $$;

-- Eten (kost sterren), wassen (kost sterren) of knuffelen (gratis). Geeft het vrije saldo terug.
create function public.huisdier_verzorgen(p_kind uuid, p_wat text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_h public.huisdier;
  v_r public.huisdier_regels;
  v_dag date;
  v_prijs int := 0;
  v_gebruikt int;
  v_baby int;
begin
  if p_wat not in ('eten', 'wassen', 'knuffel') then raise exception 'onbekende verzorging'; end if;
  select * into v_kind from public.gebruikers where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  select * into v_h from public.huisdier where kind_id = p_kind and aan for update;
  if not found or v_h.soort is null then raise exception 'geen huisdier'; end if;
  select * into v_r from public.huisdier_regels where gezin_id = v_kind.gezin_id;
  if not found then v_r := row(v_kind.gezin_id, 3, 8, 15, 2, 1, 6, array['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn'])::public.huisdier_regels; end if;
  if public.huisdier_pootjes(p_kind) < v_r.pootjes_baby then raise exception 'het ei is nog niet uitgekomen'; end if;
  select (public.nu() at time zone tijdzone)::date into v_dag from public.gezinnen where id = v_kind.gezin_id;

  if p_wat = 'eten' then
    if public.huisdier_niveau(v_h.laatst_eten, 3) >= 5 then raise exception 'het buikje is al vol'; end if;
    v_prijs := v_r.prijs_eten;
  elsif p_wat = 'wassen' then
    if public.huisdier_niveau(v_h.laatst_wassen, 8) >= 5 then raise exception 'het is al helemaal schoon'; end if;
    v_prijs := v_r.prijs_wassen;
  else
    if public.huisdier_niveau(v_h.laatst_knuffel, 4) >= 5 then raise exception 'het is al helemaal blij'; end if;
  end if;

  if v_prijs > 0 then
    v_gebruikt := case when v_h.uit_dag = v_dag then v_h.uit_sterren else 0 end;
    if v_gebruikt + v_prijs > v_r.max_per_dag then raise exception 'daglimiet voor het huisdier bereikt'; end if;
    if public.saldo(p_kind) - public.gereserveerd(p_kind) < v_prijs then raise exception 'niet genoeg vrije sterren'; end if;
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip)
    values (v_kind.gezin_id, p_kind, -v_prijs, 'Huisdier: ' || p_wat || ' (' || v_h.naam || ')', 'huisdier', null, public.nu());
    update public.huisdier set uit_dag = v_dag, uit_sterren = v_gebruikt + v_prijs where kind_id = p_kind;
  end if;

  if p_wat = 'eten' then update public.huisdier set laatst_eten = public.nu() where kind_id = p_kind;
  elsif p_wat = 'wassen' then update public.huisdier set laatst_wassen = public.nu() where kind_id = p_kind;
  else update public.huisdier set laatst_knuffel = public.nu() where kind_id = p_kind; end if;
  return public.saldo(p_kind) - public.gereserveerd(p_kind);
end $$;

alter table public.huisdier_regels enable row level security;
alter table public.huisdier enable row level security;
revoke all on public.huisdier_regels, public.huisdier from anon, authenticated;
-- Lezen en schrijven gaat enkel via de functies hierboven.

revoke execute on function public.huisdier_niveau(timestamptz, numeric), public.huisdier_pootjes(uuid), public.huisdier_overzicht(),
  public.huisdier_instellen(uuid, boolean, text), public.huisdier_regels_bewaren(int, int, int, int, int, int, text[], text),
  public.huisdier_kiezen(uuid, text, text), public.huisdier_verzorgen(uuid, text) from public, anon;
grant execute on function public.huisdier_niveau(timestamptz, numeric), public.huisdier_overzicht(),
  public.huisdier_instellen(uuid, boolean, text), public.huisdier_regels_bewaren(int, int, int, int, int, int, text[], text),
  public.huisdier_kiezen(uuid, text, text), public.huisdier_verzorgen(uuid, text) to authenticated;
