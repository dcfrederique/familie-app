-- Sterrenpot (docs/sterrenpot-dagboek.md): een kind spaart sterren in een eigen pot voor een doel van de ouders,
-- en in een gezinspot ("Samen") voor een doel van het hele gezin.
--
-- Sterren in een pot blijven in het puntenlog staan (het saldo verandert niet), maar tellen als niet vrij:
-- `gereserveerd()` omvat nu ook wat in een pot zit, dus winkel, tijdaanvraag en sterren afnemen door een ouder
-- kunnen die sterren niet gebruiken. Pas bij Gedaan (pot_afronden) schrijft een ouder de sterren af.
-- Sterren uit een pot halen kan alleen een ouder (beslist door Frederique, 7 november 2026).

alter table public.puntenlog drop constraint puntenlog_bron_check;
alter table public.puntenlog add constraint puntenlog_bron_check
  check (bron in ('inzending', 'tijdverzoek', 'activiteit', 'correctie', 'welkom', 'aankoop', 'ouder', 'pot'));

-- Eigen pot: één rij per kind.
create table public.sterrenpot (
  kind_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  aan boolean not null default false,
  naam text not null default '' check (char_length(naam) <= 60),
  prent text not null default 'cadeau' check (prent in ('pretpark', 'ijs', 'bios', 'cadeau', 'zwem', 'speelgoed')),
  doel int not null default 50 check (doel between 1 and 2000),
  in_pot int not null default 0 check (in_pot >= 0)
);

-- Gezinspot: één rij per gezin, met wat elk kind gaf.
create table public.gezinspot (
  gezin_id uuid primary key references public.gezinnen (id) on delete cascade,
  aan boolean not null default false,
  naam text not null default '' check (char_length(naam) <= 60),
  prent text not null default 'pretpark' check (prent in ('pretpark', 'ijs', 'bios', 'cadeau', 'zwem', 'speelgoed')),
  doel int not null default 300 check (doel between 1 and 5000),
  max_per_kind int not null default 100 check (max_per_kind between 1 and 5000)
);
create table public.gezinspot_bijdragen (
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  sterren int not null default 0 check (sterren >= 0),
  primary key (gezin_id, kind_id)
);

-- Elke beweging in een pot, om terug te kijken.
create table public.pot_beweging (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  kind_id uuid not null references public.gebruikers (id) on delete cascade,
  pot text not null check (pot in ('kind', 'gezin')),
  delta int not null,
  reden text not null,
  tijdstip timestamptz not null default now(),
  door uuid references public.gebruikers (id)
);
create index on public.pot_beweging (kind_id, tijdstip desc);

-- Saldo's: wat in een pot zit, is niet vrij.
create function public.pot_sterren(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select in_pot from public.sterrenpot where kind_id = p_kind), 0)
       + coalesce((select sum(sterren) from public.gezinspot_bijdragen where kind_id = p_kind), 0)::int
$$;

create function public.tijd_gereserveerd(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(sterren), 0)::int from public.tijdverzoeken
  where kind_id = p_kind and status = 'aangevraagd'
$$;

create or replace function public.gereserveerd(p_kind uuid) returns int
language sql stable security definer set search_path = '' as $$
  select public.tijd_gereserveerd(p_kind) + public.pot_sterren(p_kind)
$$;

drop view public.kind_saldo;
create view public.kind_saldo with (security_invoker = true) as
select g.id as kind_id, g.gezin_id,
       public.saldo(g.id) as saldo,
       public.tijd_gereserveerd(g.id) as gereserveerd,
       public.saldo(g.id) - public.gereserveerd(g.id) as vrij,
       public.pot_sterren(g.id) as in_pot
from public.gebruikers g
where g.rol = 'kind';
grant select on public.kind_saldo to authenticated;

-- ---------------------------------------------------------------------------
-- Eigen pot
-- ---------------------------------------------------------------------------

-- Ouder zet het doel van een kind (of zet de pot uit; wat erin zat gaat terug naar het vrije saldo).
create function public.pot_instellen(p_kind uuid, p_aan boolean, p_naam text, p_prent text, p_doel int, p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
  v_pot public.sterrenpot;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if p_aan and (nullif(btrim(coalesce(p_naam, '')), '') is null) then raise exception 'geef de pot een doel'; end if;

  insert into public.sterrenpot (kind_id, gezin_id) values (p_kind, v_kind.gezin_id) on conflict do nothing;
  select * into v_pot from public.sterrenpot where kind_id = p_kind for update;

  if not p_aan and v_pot.in_pot > 0 then
    insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
    values (v_kind.gezin_id, p_kind, 'kind', -v_pot.in_pot, 'Pot uitgezet: sterren terug', v_ouder);
    update public.sterrenpot set in_pot = 0 where kind_id = p_kind;
  end if;
  update public.sterrenpot
  set aan = p_aan, naam = left(btrim(coalesce(p_naam, '')), 60), prent = coalesce(p_prent, prent),
      doel = coalesce(p_doel, doel)
  where kind_id = p_kind;
  -- Een lager doel dan wat al in de pot zit: de pot is meteen vol, wat boven het doel zit gaat terug.
  update public.sterrenpot set in_pot = doel where kind_id = p_kind and in_pot > doel;
  return 'ingesteld';
end $$;

-- Kind doet sterren in de eigen pot (van het vrije saldo).
create function public.pot_storten(p_kind uuid, p_aantal int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_pot public.sterrenpot;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if p_aantal is null or p_aantal < 1 or p_aantal > 1000 then raise exception 'aantal sterren ongeldig'; end if;
  select * into v_pot from public.sterrenpot where kind_id = p_kind and aan for update;
  if not found then raise exception 'geen pot ingesteld'; end if;
  if v_pot.in_pot + p_aantal > v_pot.doel then raise exception 'past niet meer in de pot'; end if;
  if public.saldo(p_kind) - public.gereserveerd(p_kind) < p_aantal then raise exception 'niet genoeg vrije sterren'; end if;
  update public.sterrenpot set in_pot = in_pot + p_aantal where kind_id = p_kind;
  insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden)
  values (v_kind.gezin_id, p_kind, 'kind', p_aantal, 'In de pot: ' || v_pot.naam);
  return v_pot.in_pot + p_aantal;
end $$;

-- Alleen een ouder haalt sterren uit de pot (terug naar het vrije saldo).
create function public.pot_halen(p_kind uuid, p_aantal int, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
  v_pot public.sterrenpot;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  select * into v_pot from public.sterrenpot where kind_id = p_kind for update;
  if not found then raise exception 'geen pot ingesteld'; end if;
  if p_aantal is null or p_aantal < 1 or p_aantal > v_pot.in_pot then raise exception 'aantal sterren ongeldig'; end if;
  update public.sterrenpot set in_pot = in_pot - p_aantal where kind_id = p_kind;
  insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
  values (v_kind.gezin_id, p_kind, 'kind', -p_aantal, 'Van mama of papa uit de pot', v_ouder);
  return 'gehaald';
end $$;

-- Ouder tikt op Gedaan: de volle pot wordt afgeschreven en de pot gaat uit tot er een nieuw doel is.
create function public.pot_afronden(p_kind uuid, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_kind public.gebruikers;
  v_pot public.sterrenpot;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  select * into v_pot from public.sterrenpot where kind_id = p_kind and aan for update;
  if not found then raise exception 'geen pot ingesteld'; end if;
  if v_pot.in_pot < v_pot.doel then raise exception 'de pot is nog niet vol'; end if;
  insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip, door)
  values (v_kind.gezin_id, p_kind, -v_pot.in_pot, 'Sterrenpot: ' || left(v_pot.naam, 60), 'pot', public.nu(), v_ouder);
  insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
  values (v_kind.gezin_id, p_kind, 'kind', -v_pot.in_pot, 'Gedaan: ' || v_pot.naam, v_ouder);
  update public.sterrenpot set in_pot = 0, aan = false where kind_id = p_kind;
  return 'afgerond';
end $$;

-- ---------------------------------------------------------------------------
-- Gezinspot
-- ---------------------------------------------------------------------------

create function public.gezinspot_instellen(p_aan boolean, p_naam text, p_prent text, p_doel int, p_max int, p_pin text default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_gezin uuid := public.mijn_gezin();
  v_b record;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  if p_aan and (nullif(btrim(coalesce(p_naam, '')), '') is null) then raise exception 'geef de pot een doel'; end if;
  insert into public.gezinspot (gezin_id) values (v_gezin) on conflict do nothing;
  perform 1 from public.gezinspot where gezin_id = v_gezin for update;
  if not p_aan then
    for v_b in select * from public.gezinspot_bijdragen where gezin_id = v_gezin and sterren > 0 loop
      insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
      values (v_gezin, v_b.kind_id, 'gezin', -v_b.sterren, 'Gezinspot uitgezet: sterren terug', v_ouder);
    end loop;
    update public.gezinspot_bijdragen set sterren = 0 where gezin_id = v_gezin;
  end if;
  update public.gezinspot
  set aan = p_aan, naam = left(btrim(coalesce(p_naam, '')), 60), prent = coalesce(p_prent, prent),
      doel = coalesce(p_doel, doel), max_per_kind = coalesce(p_max, max_per_kind)
  where gezin_id = v_gezin;
  return 'ingesteld';
end $$;

-- Kind geeft sterren aan de gezinspot: niet meer dan het maximum per kind en niet meer dan er nog nodig is.
create function public.gezinspot_storten(p_kind uuid, p_aantal int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_pot public.gezinspot;
  v_totaal int;
  v_eigen int;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind' for update;
  if not found then raise exception 'kind niet gevonden'; end if;
  if p_aantal is null or p_aantal < 1 or p_aantal > 1000 then raise exception 'aantal sterren ongeldig'; end if;
  select * into v_pot from public.gezinspot where gezin_id = v_kind.gezin_id and aan for update;
  if not found then raise exception 'geen gezinspot ingesteld'; end if;
  select coalesce(sum(sterren), 0) into v_totaal from public.gezinspot_bijdragen where gezin_id = v_kind.gezin_id;
  select coalesce(sterren, 0) into v_eigen from public.gezinspot_bijdragen where gezin_id = v_kind.gezin_id and kind_id = p_kind;
  v_eigen := coalesce(v_eigen, 0);
  if v_totaal + p_aantal > v_pot.doel then raise exception 'past niet meer in de pot'; end if;
  if v_eigen + p_aantal > v_pot.max_per_kind then raise exception 'meer dan het maximum per kind'; end if;
  if public.saldo(p_kind) - public.gereserveerd(p_kind) < p_aantal then raise exception 'niet genoeg vrije sterren'; end if;
  insert into public.gezinspot_bijdragen (gezin_id, kind_id, sterren) values (v_kind.gezin_id, p_kind, p_aantal)
  on conflict (gezin_id, kind_id) do update set sterren = public.gezinspot_bijdragen.sterren + p_aantal;
  insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden)
  values (v_kind.gezin_id, p_kind, 'gezin', p_aantal, 'In de gezinspot: ' || v_pot.naam);
  return v_totaal + p_aantal;
end $$;

-- Alleen een ouder haalt sterren van een kind uit de gezinspot.
create function public.gezinspot_halen(p_kind uuid, p_aantal int, p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_gezin uuid := public.mijn_gezin();
  v_eigen int;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select sterren into v_eigen from public.gezinspot_bijdragen
  where gezin_id = v_gezin and kind_id = p_kind for update;
  if v_eigen is null then raise exception 'geen bijdrage van dit kind'; end if;
  if p_aantal is null or p_aantal < 1 or p_aantal > v_eigen then raise exception 'aantal sterren ongeldig'; end if;
  update public.gezinspot_bijdragen set sterren = sterren - p_aantal where gezin_id = v_gezin and kind_id = p_kind;
  insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
  values (v_gezin, p_kind, 'gezin', -p_aantal, 'Van mama of papa uit de gezinspot', v_ouder);
  return 'gehaald';
end $$;

-- Gedaan: bij elk kind worden de gegeven sterren afgeschreven en de gezinspot gaat uit.
create function public.gezinspot_afronden(p_pin text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ouder uuid := public.ouder_controle(p_pin);
  v_gezin uuid := public.mijn_gezin();
  v_pot public.gezinspot;
  v_b record;
begin
  if v_ouder is null then return 'pincode_fout'; end if;
  select * into v_pot from public.gezinspot where gezin_id = v_gezin and aan for update;
  if not found then raise exception 'geen gezinspot ingesteld'; end if;
  if (select coalesce(sum(sterren), 0) from public.gezinspot_bijdragen where gezin_id = v_gezin) < v_pot.doel then
    raise exception 'de gezinspot is nog niet vol';
  end if;
  for v_b in select * from public.gezinspot_bijdragen where gezin_id = v_gezin and sterren > 0 loop
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip, door)
    values (v_gezin, v_b.kind_id, -v_b.sterren, 'Gezinspot: ' || left(v_pot.naam, 60), 'pot', public.nu(), v_ouder);
    insert into public.pot_beweging (gezin_id, kind_id, pot, delta, reden, door)
    values (v_gezin, v_b.kind_id, 'gezin', -v_b.sterren, 'Gedaan: ' || v_pot.naam, v_ouder);
  end loop;
  update public.gezinspot_bijdragen set sterren = 0 where gezin_id = v_gezin;
  update public.gezinspot set aan = false where gezin_id = v_gezin;
  return 'afgerond';
end $$;

-- ---------------------------------------------------------------------------
-- Rechten
-- ---------------------------------------------------------------------------

alter table public.sterrenpot enable row level security;
alter table public.gezinspot enable row level security;
alter table public.gezinspot_bijdragen enable row level security;
alter table public.pot_beweging enable row level security;
create policy "eigen gezin lezen" on public.sterrenpot for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.gezinspot for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.gezinspot_bijdragen for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "eigen gezin lezen" on public.pot_beweging for select to authenticated using (gezin_id = public.mijn_gezin());
revoke all on public.sterrenpot, public.gezinspot, public.gezinspot_bijdragen, public.pot_beweging from anon, authenticated;
grant select on public.sterrenpot, public.gezinspot, public.gezinspot_bijdragen, public.pot_beweging to authenticated;

revoke execute on function
  public.pot_sterren(uuid), public.tijd_gereserveerd(uuid),
  public.pot_instellen(uuid, boolean, text, text, int, text), public.pot_storten(uuid, int),
  public.pot_halen(uuid, int, text), public.pot_afronden(uuid, text),
  public.gezinspot_instellen(boolean, text, text, int, int, text), public.gezinspot_storten(uuid, int),
  public.gezinspot_halen(uuid, int, text), public.gezinspot_afronden(text)
from public, anon;
grant execute on function
  public.pot_sterren(uuid), public.tijd_gereserveerd(uuid),
  public.pot_instellen(uuid, boolean, text, text, int, text), public.pot_storten(uuid, int),
  public.pot_halen(uuid, int, text), public.pot_afronden(uuid, text),
  public.gezinspot_instellen(boolean, text, text, int, int, text), public.gezinspot_storten(uuid, int),
  public.gezinspot_halen(uuid, int, text), public.gezinspot_afronden(text)
to authenticated;
