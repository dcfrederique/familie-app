-- Mijn huis (docs/huis.md, het idee van de kinderen zelf; gebouwd op vraag van de ouders op 24 oktober 2026).
-- Naast het figuurtje heeft elk kind een eigen huis: het start als hutje en wordt groter (huisje, verdieping, groot huis
-- met garage, torenhuis), en het kind kleedt het zelf aan (dak, muren, deur, ramen, tuin, extraatjes).
-- Het werkt zoals de winkel (docs/winkel.md): grotere huizen en stukken koopt het kind met sterren van het vrije saldo,
-- wie niet leest betaalt de helft, en "alles vrij" van de ouder geldt ook voor het huis. Wat in de winkel ligt kiezen
-- de ouders (docs/winkelaanbod.md): zoals elk nieuw aanbod ligt het huis pas in de winkel na vrijgave.
-- De catalogus hieronder moet gelijk blijven aan src/data/huis.ts (huis.test.ts controleert dat).

alter table public.gebruikers add column huis jsonb;

-- Elk stuk en elke kleur van het huis, met de prijs in sterren (0 = meteen van jou).
-- 'huis' zijn de groottes, 'huisextra' de extraatjes ('extra' is al van het figuurtje).
create table public.huis_stukken (
  soort text not null check (soort in ('huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra',
                                       'dakkleur', 'muurkleur', 'deurkleur')),
  sleutel text not null,
  prijs int not null default 0 check (prijs >= 0),
  standaard_vrij boolean not null default false,
  primary key (soort, sleutel)
);

insert into public.huis_stukken (soort, sleutel, prijs) values
  ('huis', 'hutje', 0), ('huis', 'huisje', 25), ('huis', 'verdieping', 50), ('huis', 'groot', 80), ('huis', 'toren', 120),
  ('dak', 'punt', 0), ('dak', 'plat', 0), ('dak', 'rond', 15), ('dak', 'trap', 40),
  ('muur', 'effen', 0), ('muur', 'hout', 0), ('muur', 'baksteen', 10), ('muur', 'steen', 30),
  ('deur', 'gewoon', 0), ('deur', 'boog', 0), ('deur', 'rond', 15), ('deur', 'dubbel', 35),
  ('ramen', 'vierkant', 0), ('ramen', 'boog', 0), ('ramen', 'rond', 10), ('ramen', 'luiken', 20),
  ('tuin', 'boom', 0), ('tuin', 'bloemen', 0), ('tuin', 'zandbak', 0), ('tuin', 'schommel', 10), ('tuin', 'doel', 15),
  ('tuin', 'konijnenhok', 20), ('tuin', 'trampoline', 25), ('tuin', 'raceauto', 30), ('tuin', 'moestuin', 30),
  ('tuin', 'hondenhok', 40), ('tuin', 'zwembad', 50), ('tuin', 'dino', 60),
  ('huisextra', 'schoorsteen', 0), ('huisextra', 'bloembakken', 0), ('huisextra', 'hek', 10), ('huisextra', 'brievenbus', 10),
  ('huisextra', 'vlag', 20), ('huisextra', 'lichtjes', 30),
  ('dakkleur', 'rood', 0), ('dakkleur', 'bruin', 0), ('dakkleur', 'antraciet', 0), ('dakkleur', 'blauw', 0),
  ('dakkleur', 'groen', 0), ('dakkleur', 'paars', 0), ('dakkleur', 'roze', 0), ('dakkleur', 'goud', 0),
  ('muurkleur', 'wit', 0), ('muurkleur', 'room', 0), ('muurkleur', 'geel', 0), ('muurkleur', 'oranje', 0),
  ('muurkleur', 'baksteen', 0), ('muurkleur', 'blauw', 0), ('muurkleur', 'groen', 0), ('muurkleur', 'roze', 0),
  ('muurkleur', 'paars', 0),
  ('deurkleur', 'rood', 0), ('deurkleur', 'oranje', 0), ('deurkleur', 'geel', 0), ('deurkleur', 'groen', 0),
  ('deurkleur', 'blauw', 0), ('deurkleur', 'paars', 0), ('deurkleur', 'roze', 0), ('deurkleur', 'bruin', 0),
  ('deurkleur', 'donker', 0);

-- Kopen en het aanbod kennen de soorten van het huis.
alter table public.aankopen drop constraint aankopen_soort_check;
alter table public.aankopen add constraint aankopen_soort_check
  check (soort in ('huid', 'gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));
alter table public.aanbod drop constraint aanbod_soort_check;
alter table public.aanbod add constraint aanbod_soort_check
  check (soort in ('gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));
alter table public.aanbod_verborgen drop constraint aanbod_verborgen_soort_check;
alter table public.aanbod_verborgen add constraint aanbod_verborgen_soort_check
  check (soort in ('gezicht', 'haar', 'hoofd', 'shirt', 'broek', 'schoenen', 'extra', 'spel',
                   'huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra'));

create function public.is_huis_soort(p_soort text) returns boolean
language sql immutable set search_path = '' as $$
  select p_soort in ('huis', 'dak', 'muur', 'deur', 'ramen', 'tuin', 'huisextra')
$$;

create or replace function public.in_aanbod(p_kind uuid, p_soort text, p_sleutel text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
           (select a.vrijgegeven from public.aanbod a join public.gebruikers g on g.gezin_id = a.gezin_id
            where g.id = p_kind and a.soort = p_soort and a.sleutel = p_sleutel),
           case when p_soort = 'spel' then (select standaard_vrij from public.spel_prijzen where sleutel = p_sleutel)
                when public.is_huis_soort(p_soort)
                  then (select standaard_vrij from public.huis_stukken where soort = p_soort and sleutel = p_sleutel)
                else (select standaard_vrij from public.figuurtje_stukken where soort = p_soort and sleutel = p_sleutel) end,
           false)
     and not exists (select 1 from public.aanbod_verborgen
                     where kind_id = p_kind and soort = p_soort and sleutel = p_sleutel)
$$;

-- Kopen zoals voorheen (met de prijs die de ouders instelden, 20261024001600_aanbod_prijs), nu ook stukken van het huis.
create or replace function public.kopen(p_kind uuid, p_soort text, p_sleutel text, p_naam text default null)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_prijs int;
  v_id uuid;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  if p_soort = 'spel' then
    select prijs into v_prijs from public.spel_prijzen where sleutel = p_sleutel;
  elsif public.is_huis_soort(p_soort) then
    select prijs into v_prijs from public.huis_stukken where soort = p_soort and sleutel = p_sleutel;
  else
    select prijs into v_prijs from public.figuurtje_stukken where soort = p_soort and sleutel = p_sleutel;
  end if;
  if v_prijs is null then raise exception 'onbekend stuk: %', p_sleutel; end if;
  v_prijs := public.winkel_prijs(v_kind.gezin_id, p_soort, p_sleutel, v_prijs);
  v_prijs := public.prijs_voor(v_prijs, v_kind.kan_lezen);

  if v_prijs > 0 and not v_kind.figuurtje_alles_vrij
     and not exists (select 1 from public.aankopen where kind_id = p_kind and soort = p_soort and sleutel = p_sleutel) then
    if not public.in_aanbod(p_kind, p_soort, p_sleutel) then
      raise exception 'nog niet in de winkel: %', p_sleutel;
    end if;
    if public.saldo(p_kind) - public.gereserveerd(p_kind) < v_prijs then
      raise exception 'niet genoeg sterren';
    end if;
    insert into public.aankopen (gezin_id, kind_id, soort, sleutel, prijs, tijdstip)
    values (v_kind.gezin_id, p_kind, p_soort, p_sleutel, v_prijs, public.nu())
    returning id into v_id;
    insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, bron_id, tijdstip)
    values (v_kind.gezin_id, p_kind, -v_prijs, 'Gekocht: ' || left(coalesce(nullif(trim(p_naam), ''), p_sleutel), 40),
            'aankoop', v_id, public.nu());
  end if;
  return public.saldo(p_kind) - public.gereserveerd(p_kind);
end $$;

-- Mag dit stuk in het huis van het kind? Gratis (ook als de ouders de prijs op 0 zetten) of gekocht; met "alles vrij" wat in de winkel ligt of wat al in het
-- bewaarde huis stond (een ouder kan iets verbergen dat het kind al gebruikt).
create function public.huis_stuk_mag(p_kind public.gebruikers, p_soort text, p_sleutel text, p_had boolean)
returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  v_prijs int;
begin
  select prijs into v_prijs from public.huis_stukken where soort = p_soort and sleutel = p_sleutel;
  if not found then raise exception 'onbekend stuk: %', p_soort; end if;
  v_prijs := public.winkel_prijs(p_kind.gezin_id, p_soort, p_sleutel, v_prijs);
  if v_prijs > 0
     and not exists (select 1 from public.aankopen where kind_id = p_kind.id and soort = p_soort and sleutel = p_sleutel) then
    if not p_kind.figuurtje_alles_vrij then
      raise exception 'stuk nog niet gekocht: %', p_sleutel;
    end if;
    if not public.in_aanbod(p_kind.id, p_soort, p_sleutel) and not p_had then
      raise exception 'nog niet in de winkel: %', p_sleutel;
    end if;
  end if;
end $$;

-- Mijn huis bewaren (tablet of ouder). null zet het terug naar het hutje.
create function public.huis_bewaren(p_kind uuid, p_huis jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.gebruikers;
  v_veld record;
  v_lijst record;
  v_sleutel text;
begin
  select * into v_kind from public.gebruikers
  where id = p_kind and gezin_id = public.mijn_gezin() and rol = 'kind'
  for update;
  if not found then raise exception 'kind niet gevonden'; end if;

  if p_huis is null then
    update public.gebruikers set huis = null where id = p_kind;
    return;
  end if;

  if jsonb_typeof(p_huis) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_huis)) <> 10 then
    raise exception 'ongeldig huis';
  end if;

  -- Velden met precies één keuze (en de kleuren).
  for v_veld in
    select * from (values ('model', 'huis'), ('dak', 'dak'), ('muur', 'muur'), ('deur', 'deur'), ('ramen', 'ramen'),
                          ('dakKleur', 'dakkleur'), ('muurKleur', 'muurkleur'), ('deurKleur', 'deurkleur')) as t(veld, soort)
  loop
    if jsonb_typeof(p_huis -> v_veld.veld) is distinct from 'string' then raise exception 'ongeldig huis'; end if;
    v_sleutel := p_huis ->> v_veld.veld;
    perform public.huis_stuk_mag(v_kind, v_veld.soort, v_sleutel, (v_kind.huis ->> v_veld.veld) is not distinct from v_sleutel);
  end loop;

  -- Tuin: hoogstens twee verschillende stukken; extra: elk stuk hoogstens één keer.
  for v_lijst in select * from (values ('tuin', 'tuin', 2), ('extra', 'huisextra', 6)) as t(veld, soort, maximum)
  loop
    if jsonb_typeof(p_huis -> v_lijst.veld) is distinct from 'array'
       or jsonb_array_length(p_huis -> v_lijst.veld) > v_lijst.maximum
       or (select count(distinct e) from jsonb_array_elements(p_huis -> v_lijst.veld) e)
          <> jsonb_array_length(p_huis -> v_lijst.veld)
       or exists (select 1 from jsonb_array_elements(p_huis -> v_lijst.veld) e where jsonb_typeof(e) <> 'string') then
      raise exception 'ongeldig huis';
    end if;
    for v_sleutel in select jsonb_array_elements_text(p_huis -> v_lijst.veld)
    loop
      perform public.huis_stuk_mag(v_kind, v_lijst.soort, v_sleutel,
        coalesce(jsonb_typeof(v_kind.huis -> v_lijst.veld) = 'array' and (v_kind.huis -> v_lijst.veld) ? v_sleutel, false));
    end loop;
  end loop;

  update public.gebruikers set huis = p_huis where id = p_kind;
end $$;

-- Een tablet past alleen het huis van zijn eigen kind aan.
create trigger eigen_kind_huis before update of huis on public.gebruikers
  for each row when (new.huis is distinct from old.huis) execute function public.eigen_kind_bewaken('id');

alter table public.huis_stukken enable row level security;
create policy "iedereen leest de catalogus" on public.huis_stukken for select to authenticated using (true);
revoke all on public.huis_stukken from anon, authenticated;
grant select on public.huis_stukken to authenticated;

revoke execute on function public.is_huis_soort(text) from public, anon;
revoke execute on function public.huis_stuk_mag(public.gebruikers, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.huis_bewaren(uuid, jsonb) from public, anon;
grant execute on function public.is_huis_soort(text), public.huis_bewaren(uuid, jsonb) to authenticated;
