-- Tests voor activiteiten en hun sterren. Draaien met scripts/test-db.sh.
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

-- Eigen gezin: ouder (e-mail) en tablet (anoniem)
insert into auth.users values ('00000000-0000-0000-0000-000000000f01'), ('00000000-0000-0000-0000-000000000f02');
select set_config('app.nu', '2026-10-21 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select public.gezin_aanmaken('Spelers', 'Ouder', '[{"naam": "Kim"}, {"naam": "Noor"}]') as gezin \gset
select public.pin_instellen('1357');
select id as kim from public.gebruikers where naam = 'Kim' \gset
select id as noor from public.gebruikers where naam = 'Noor' \gset
select id as ouder from public.gebruikers where naam = 'Ouder' \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select public.koppelen(:'code');


\echo '1. Zonder limiet geldt alleen het dagplafond'
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 60), 3, 'kleurplaat zonder limiet');

\echo '2. Limiet voor het hele gezin'
select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select public.activiteit_limiet_zetten(null, 'kleurplaat', 5);
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 60), 2, 'rest tot limiet 5');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 60), 0, 'limiet bereikt');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'verhaal', '{"titel": "De draak"}', 60), 5, 'ander spelletje blijft vrij');
select pg_temp.gelijk(public.activiteit_opslaan(:'noor', 'kleurplaat', '{}', 60), 3, 'ander kind heeft eigen teller');

\echo '3. Limiet voor één kind gaat voor'
select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select public.activiteit_limiet_zetten(:'noor', 'kleurplaat', 0);
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select pg_temp.gelijk(public.activiteit_opslaan(:'noor', 'kleurplaat', '{}', 60), 0, 'noor: 0 sterren');
select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select public.activiteit_limiet_zetten(:'noor', 'kleurplaat', 20);
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select pg_temp.gelijk(public.activiteit_opslaan(:'noor', 'kleurplaat', '{}', 60), 3, 'noor: ruimer dan het gezin');

\echo '4. Nieuwe dag, nieuwe ruimte; wissen'
select set_config('app.nu', '2026-10-22 09:00+02', false);
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 60), 3, 'nieuwe dag');
select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select public.activiteit_limiet_zetten(null, 'kleurplaat', null);
select pg_temp.gelijk((select count(*)::int from public.activiteit_limiet where kind_id is null), 0, 'gezinslimiet gewist');
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 60), 3, 'zonder limiet weer vrij');
select pg_temp.gelijk((select count(*)::int from public.activiteit_limiet), 1, 'limiet van noor blijft');

\echo '5. Alleen een ouder, alleen eigen gezin'
select pg_temp.als('00000000-0000-0000-0000-000000000f01', false);
select pg_temp.fout('select public.activiteit_limiet_zetten(null, ''memory'', 5)', 'activiteit_limiet_activiteit_check');
select pg_temp.fout('select public.activiteit_limiet_zetten(null, ''rekenen'', 500)', 'activiteit_limiet_max_sterren_check');
select pg_temp.fout(format('select public.activiteit_limiet_zetten(%L, ''rekenen'', 5)', :'ouder'), 'kind niet gevonden');
select pg_temp.als('00000000-0000-0000-0000-000000000f02', true);
select pg_temp.fout('select public.activiteit_limiet_zetten(null, ''rekenen'', 5)', 'alleen een ouder');

\echo 'Alle sterrenlimiettests geslaagd.'
