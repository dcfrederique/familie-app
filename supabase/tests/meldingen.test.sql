-- Tests voor de meldingen naar ouders. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000501'), ('00000000-0000-0000-0000-000000000502'),
  ('00000000-0000-0000-0000-000000000503');
select set_config('app.nu', '2026-10-21 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000501', false);
select public.gezin_aanmaken('Melders', 'Ouder', '[{"naam": "Kim"}]') as gezin \gset
select public.pin_instellen('1357');
select id as kim from public.gebruikers where naam = 'Kim' \gset
insert into public.taken (gezin_id, titel, sterren) values (:'gezin', 'Tafel dekken', 5) returning id as taak \gset
insert into public.taak_kinderen values (:'taak', :'kim');
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000502', true);
select public.koppelen(:'code');

\echo '1. Alleen een ouder kan meldingen aanzetten'
select pg_temp.fout('select public.push_abonneren(''https://push.example/t'', ''p'', ''a'')', 'alleen voor ouders');
select pg_temp.als('00000000-0000-0000-0000-000000000501', false);
select pg_temp.fout('select public.push_abonneren(''http://push.example/x'', ''p'', ''a'')', 'ongeldig abonnement');
select public.push_abonneren('https://push.example/ouder', 'p1', 'a1');
select public.push_abonneren('https://push.example/ouder', 'p2', 'a2');
select pg_temp.fout('select * from public.push_abonnementen', 'permission denied');
select pg_temp.fout(format('select * from public.melding_tekst(''inzendingen'', %L)', gen_random_uuid()), 'permission denied');

\echo '2. Een taak die klaar is geeft een melding'
select pg_temp.als('00000000-0000-0000-0000-000000000502', true);
select public.taak_indienen(:'kim', :'taak') as inz \gset
select public.activiteit_opslaan(:'kim', 'verhaal', '{"titel": "Pip gaat naar school"}', 300);
select public.activiteit_opslaan(:'kim', 'memory', '{}', 60);
select id as verhaal from public.activiteitlog where activiteit = 'verhaal' \gset
select id as memory from public.activiteitlog where activiteit = 'memory' \gset
set role service_role;
select pg_temp.gelijk((select tekst from public.melding_tekst('inzendingen', :'inz')), 'Tafel dekken: 5 sterren goedkeuren?', 'taak');
select pg_temp.gelijk((select titel from public.melding_tekst('inzendingen', :'inz')), 'Kim is klaar met een taak', 'titel');

\echo '3. Activiteiten geven geen melding meer: hun sterren komen er meteen bij'
select pg_temp.gelijk((select count(*) from public.melding_tekst('activiteitlog', :'verhaal')), 0::bigint, 'verhaal');
select pg_temp.gelijk((select count(*) from public.melding_tekst('activiteitlog', :'memory')), 0::bigint, 'memory');

\echo '4. Abonnementen per gezin, en opruimen'
select pg_temp.gelijk((select p256dh from public.push_abonnementen_voor(:'gezin')), 'p2', 'bijgewerkt');
select public.push_vervallen('https://push.example/ouder');
select pg_temp.gelijk((select count(*) from public.push_abonnementen_voor(:'gezin')), 0::bigint, 'opgeruimd');
reset role;
\echo 'Alle meldingtests geslaagd.'
