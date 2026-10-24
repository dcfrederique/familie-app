-- Tests voor de leesoefening (spraakherkenning en zelf gelezen). Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.fout(sql text, verwacht text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'verwachtte fout "%" maar het lukte: %', verwacht, sql;
exception when others then
  if sqlerrm not like '%' || verwacht || '%' then
    raise exception 'verwachtte fout "%" maar kreeg "%" bij: %', verwacht, sqlerrm, sql;
  end if;
end $$;

create function pg_temp.gelijk(echt anyelement, verwacht anyelement, wat text) returns void language plpgsql as $$
begin
  if echt is distinct from verwacht then
    raise exception '%: verwachtte %, kreeg %', wat, verwacht, echt;
  end if;
end $$;

create function pg_temp.als(p_user text, p_anoniem boolean) returns void language sql as $$
  select set_config('request.jwt.claim.sub', p_user, false),
         set_config('request.jwt.claims', json_build_object('is_anonymous', p_anoniem)::text, false);
$$;

insert into auth.users values ('00000000-0000-0000-0000-000000000701'), ('00000000-0000-0000-0000-000000000702'),
  ('00000000-0000-0000-0000-000000000703');
select set_config('app.nu', '2026-10-24 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000701', false);
select public.gezin_aanmaken('Lezers', 'Ouder', '[{"naam": "Yu"}]') as gezin \gset
select id as yu from public.gebruikers where naam = 'Yu' \gset
select id as ouder from public.gebruikers where naam = 'Ouder' \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000702', true);
select public.koppelen(:'code');

\echo '1. Elke dag 5 minuten spraakherkenning per kind'
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 0), 300, 'begin');
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 60), 240, 'na een minuut');
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 9999), 120, 'hoogstens 120 per melding');
select pg_temp.gelijk(public.spraak_gebruik(:'yu', -50), 120, 'negatief telt niet');
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 120), 0, 'op');
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 60), 0, 'niet onder nul');

\echo '2. De volgende dag opnieuw'
select set_config('app.nu', '2026-10-25 08:00+01', false);
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 0), 300, 'nieuwe dag');

\echo '3. Geen ouders en geen kinderen van een ander gezin'
select pg_temp.fout(format('select public.spraak_gebruik(%L, 0)', :'ouder'), 'kind niet gevonden');
select pg_temp.als('00000000-0000-0000-0000-000000000703', false);
select public.gezin_aanmaken('Anderen', 'Ander', '[{"naam": "Zo"}]') \gset
select pg_temp.fout(format('select public.spraak_gebruik(%L, 0)', :'yu'), 'kind niet gevonden');

\echo '4. Zelf gelezen levert 5 sterren op, met de woorden in de omschrijving'
select pg_temp.als('00000000-0000-0000-0000-000000000702', true);
select pg_temp.gelijk(public.activiteit_opslaan(:'yu', 'zelf_gelezen', '{"titel": "Pip", "goed": 40, "woorden": 45}', 300), 5, 'sterren');
select pg_temp.gelijk((select public.activiteit_omschrijving(activiteit, inhoud) from public.activiteitlog where kind_id = :'yu'),
  'Zelf gelezen: Pip (40 van 45 woorden)', 'omschrijving');

\echo '5. Een ouder kan het plafond aanpassen'
select pg_temp.als('00000000-0000-0000-0000-000000000701', false);
update public.gezinnen set spraak_seconden_per_dag = 600 where id = :'gezin';
select pg_temp.als('00000000-0000-0000-0000-000000000702', true);
select pg_temp.gelijk(public.spraak_gebruik(:'yu', 0), 600, 'nieuw plafond');

reset role;
