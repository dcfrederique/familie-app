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
insert into auth.users values ('00000000-0000-0000-0000-000000000201'), ('00000000-0000-0000-0000-000000000202');
select set_config('app.nu', '2026-10-21 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000201', false);
select public.gezin_aanmaken('Spelers', 'Ouder', '[{"naam": "Kim"}, {"naam": "Noor"}]') as gezin \gset
select public.pin_instellen('1357');
select id as kim from public.gebruikers where naam = 'Kim' \gset
select id as noor from public.gebruikers where naam = 'Noor' \gset
select id as ouder from public.gebruikers where naam = 'Ouder' \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000202', true);
select public.koppelen(:'code');

\echo '1. Spelletjes leveren niets op'
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'memory', '{"paren": 6, "beurten": 9}', 120), 0, 'memory');
select pg_temp.gelijk((select status::text from public.activiteitlog where activiteit = 'memory'), null::text, 'geen status');
select pg_temp.fout(format('select public.activiteit_opslaan(%L, ''memory'')', :'ouder'), 'kind niet gevonden');

-- Nieuwe spelletjes leveren ook geen sterren op
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'racen', '{"punten": 120, "niveau": "rustig"}', 90), 0, 'racen');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'koken', '{"titel": "Pizza"}', 60), 0, 'koken');
select pg_temp.gelijk(public.activiteit_omschrijving('koken', '{"titel": "Pizza"}'), 'Koken: Pizza', 'omschrijving koken');
select pg_temp.gelijk(public.activiteit_omschrijving('basket', '{}'), 'Basket', 'omschrijving basket');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'puzzel', '{"titel": "Pip wil ook zwemmen", "stukjes": 12}', 75), 0, 'puzzel');
select pg_temp.gelijk(public.activiteit_omschrijving('puzzel', '{"titel": "Pip wil ook zwemmen"}'), 'Puzzel: Pip wil ook zwemmen', 'omschrijving puzzel');
select pg_temp.fout(format('select public.activiteit_opslaan(%L, ''verstoppertje'')', :'kim'), 'activiteitlog_activiteit_check');
select pg_temp.fout(format('select public.activiteit_opslaan(%L, ''schaken'')', :'kim'), 'activiteitlog_activiteit_check');

\echo '2. Rekenen: 1 ster per 2 sommen in één keer goed, berekend op de server'
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 7, "sommen": 10}', 200), 3, '7 goed');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 99}', 200), 5, 'hoogstens 10 goed');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 1}', 200), 0, '1 goed');
-- Sinds 24 oktober 2026 komen de sterren er meteen bij, zonder goedkeuring.
select pg_temp.gelijk(public.saldo(:'kim'), 8, 'sterren meteen bij');
select pg_temp.gelijk((select reden from public.puntenlog where kind_id = :'kim' order by id limit 1),
                      'Rekenen: 7 van 10 in één keer goed', 'reden in log');

\echo '3. Dagplafond voor activiteiten'
select public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 10}', 200);
select public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 10}', 200);
-- 3 + 5 + 5 + 5 = 18; nog 2 over van 20
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'rekenen', '{"goed": 10}', 200), 2, 'rest tot plafond');
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'verhaal', '{"titel": "De draak"}', 200), 0, 'plafond bereikt');
select pg_temp.gelijk(public.activiteit_opslaan(:'noor', 'verhaal', '{"titel": "De draak"}', 200), 5, 'ander kind');
select set_config('app.nu', '2026-10-22 09:00+02', false);
select pg_temp.gelijk(public.activiteit_opslaan(:'kim', 'kleurplaat', '{}', 200), 3, 'nieuwe dag');
select set_config('app.nu', '2026-10-21 16:30+02', false);

\echo '4. Niets meer goed te keuren'
select pg_temp.gelijk(public.saldo(:'kim'), 23, 'saldo na plafond en nieuwe dag');
select id as eerste from public.activiteitlog where kind_id = :'kim' and sterren = 3 and dag = '2026-10-21' \gset
select pg_temp.gelijk((select status::text from public.activiteitlog where id = :'eerste'), 'goedgekeurd', 'meteen goedgekeurd');
select pg_temp.fout(format('select public.activiteit_beoordelen(%L, true, ''1357'')', :'eerste'), 'al beoordeeld');
select id as tweede from public.activiteitlog where kind_id = :'noor' \gset
select id as memory from public.activiteitlog where activiteit = 'memory' \gset
select pg_temp.fout(format('select public.activiteit_beoordelen(%L, true, ''1357'')', :'memory'), 'al beoordeeld');

\echo '5. Spaarmaximum blijft gelden'
reset role;
update public.gezinnen set max_saldo = 7 where id = :'gezin';
set role authenticated;
select pg_temp.gelijk(public.activiteit_opslaan(:'noor', 'kleurplaat', '{}', 60), 2, 'tot het spaarmaximum');
select pg_temp.gelijk(public.saldo(:'noor'), 7, 'saldo op maximum');
select pg_temp.gelijk((select reden from public.puntenlog where kind_id = :'noor' order by id desc limit 1),
                      'Kleurplaat: afgewerkt (spaarmaximum bereikt)', 'reden spaarmaximum');

\echo '6. Andere gezinnen zien niets'
reset role;
insert into auth.users values ('00000000-0000-0000-0000-000000000203');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-000000000203', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Bo"}]');
select pg_temp.gelijk((select count(*) from public.activiteitlog), 0::bigint, 'activiteitlog afgeschermd');
select pg_temp.fout(format('select public.activiteit_opslaan(%L, ''rekenen'', ''{"goed": 10}'')', :'kim'), 'kind niet gevonden');
select pg_temp.fout(format('select public.activiteit_beoordelen(%L, true)', :'tweede'), 'niet gevonden');
select pg_temp.fout(format('insert into public.activiteitlog (gezin_id, kind_id, activiteit, tijdstip, dag)
                      values (%L, %L, ''rekenen'', now(), current_date)', :'gezin', :'kim'), 'permission denied');

reset role;
\echo 'Alle activiteitentests geslaagd.'
