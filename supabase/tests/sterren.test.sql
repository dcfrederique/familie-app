-- Tests voor de sterrenlogica. Draaien met scripts/test-db.sh.
-- Elke stap draait als de rol die de app gebruikt (authenticated), met een gesimuleerde login en tijd.
\set ON_ERROR_STOP on
\set QUIET on

-- Hulpjes ------------------------------------------------------------------------------------------

-- Voert sql uit en controleert dat het mislukt met een melding die `verwacht` bevat.
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

-- Testgezin ----------------------------------------------------------------------------------------

insert into public.gezinnen (id, naam) values
  ('00000000-0000-0000-0000-00000000000a', 'De Clercq'),
  ('00000000-0000-0000-0000-00000000000b', 'Buren');

insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen, vraagt_zelf_tijd) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'Papa',   'ouder', true,  true),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'Luca',   'kind',  true,  true),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', 'Yuna',   'kind',  true,  true),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-00000000000a', 'Feline', 'kind',  false, false),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'Buurkind', 'kind', true, true);

insert into public.ouder_pins values
  ('00000000-0000-0000-0000-0000000000a1', extensions.crypt('1234', extensions.gen_salt('bf')));

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000f1'),  -- gsm van papa
  ('00000000-0000-0000-0000-0000000000f2'),  -- tablet
  ('00000000-0000-0000-0000-0000000000f3');  -- tablet van de buren

insert into public.accounts values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'ouder', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000a', 'tablet', null),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-00000000000b', 'tablet', null);

insert into public.taken (id, gezin_id, titel, sterren, herhaling, foto_nodig) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', 'Tafel dekken', 5, 'elke_dag', false),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', 'Kamer opruimen', 10, 'elke_dag', true),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-00000000000a', 'Fiets herstellen', 10, 'eenmalig', false);
insert into public.taak_kinderen values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a2');

-- Afkortingen voor de leesbaarheid
\set luca '''00000000-0000-0000-0000-0000000000a2'''
\set yuna '''00000000-0000-0000-0000-0000000000a3'''
\set feline '''00000000-0000-0000-0000-0000000000a4'''
\set buurkind '''00000000-0000-0000-0000-0000000000b1'''
\set tafel '''00000000-0000-0000-0000-0000000000c1'''
\set kamer '''00000000-0000-0000-0000-0000000000c2'''
\set fiets '''00000000-0000-0000-0000-0000000000c3'''

-- 21 oktober 2026 is zomertijd in Brussel (+02).
select set_config('app.nu', '2026-10-21 16:00+02', false);

\echo '1. Taken indienen en beoordelen'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f2', false);
set role authenticated;

select public.taak_indienen(:luca, :tafel) as inz_tafel \gset
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :luca, :tafel), 'taak al ingediend');
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :luca, :kamer), 'foto nodig');
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :yuna, :tafel), 'taak niet voor dit kind');
select public.taak_indienen(:luca, :kamer, 'foto/kamer.jpg') as inz_kamer \gset
select public.taak_indienen(:luca, :fiets) as inz_fiets \gset

-- Op de tablet is een pincode nodig.
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_tafel', true), 'pincode_fout', 'zonder pin');
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_tafel', true, '0000'), 'pincode_fout', 'foute pin');
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_tafel', true, '1234'), 'goedgekeurd', 'juiste pin');
select pg_temp.gelijk(public.saldo(:luca), 5, 'saldo na goedkeuren');
select pg_temp.fout(format('select public.inzending_beoordelen(%L, true, %L)', :'inz_tafel', '1234'), 'al beoordeeld');

-- Afkeuren kost niets en komt niet in de log.
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_kamer', false, '1234'), 'afgekeurd', 'afkeuren');
select pg_temp.gelijk(public.saldo(:luca), 5, 'saldo na afkeuren');
select pg_temp.gelijk((select count(*) from public.puntenlog where kind_id = :luca), 1::bigint, 'log na afkeuren');

-- Na afkeuren mag dezelfde dag opnieuw ingediend worden; een eenmalige taak niet meer na goedkeuren.
select public.taak_indienen(:luca, :kamer, 'foto/kamer2.jpg') as inz_kamer2 \gset

-- De volgende dag kan een dagelijkse taak opnieuw.
select set_config('app.nu', '2026-10-22 08:00+02', false);
select public.taak_indienen(:luca, :tafel) is not null;
select set_config('app.nu', '2026-10-21 16:00+02', false);

\echo '2. Ouder-gsm beoordeelt zonder pincode'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f1', false);
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_fiets', true), 'goedgekeurd', 'ouder-gsm');
select pg_temp.gelijk(public.saldo(:luca), 15, 'saldo na fiets');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f2', false);
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :luca, :fiets), 'taak al ingediend');

\echo '3. Spaarmaximum'
reset role;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values ('00000000-0000-0000-0000-00000000000a', :luca, 280, 'Startsaldo', 'correctie', public.nu());
set role authenticated;
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_kamer2', true, '1234'), 'goedgekeurd', 'kamer');
select pg_temp.gelijk(public.saldo(:luca), 300, 'saldo afgetopt op 300');
select pg_temp.gelijk((select reden from public.puntenlog where kind_id = :luca order by id desc limit 1),
                      'Taak: Kamer opruimen (spaarmaximum bereikt)', 'reden bij aftoppen');
reset role;
delete from public.puntenlog where kind_id = :luca;
insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
values ('00000000-0000-0000-0000-00000000000a', :luca, 100, 'Startsaldo', 'correctie', public.nu()),
       ('00000000-0000-0000-0000-00000000000a', :yuna, 10, 'Startsaldo', 'correctie', public.nu()),
       ('00000000-0000-0000-0000-00000000000a', :feline, 20, 'Startsaldo', 'correctie', public.nu());
set role authenticated;

\echo '4. Tijd aanvragen, reserveren en dagplafond'
select public.tijd_aanvragen(:luca, 30) as v1 \gset
select pg_temp.gelijk((select array[saldo, gereserveerd, vrij] from public.kind_saldo where kind_id = :luca),
                      array[100, 30, 70], 'saldo na reserveren');
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 45)', :luca), 'blok moet 15, 30 of 60');
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 60)', :luca), 'boven dagplafond');
select public.tijd_aanvragen(:luca, 30) as v2 \gset
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :luca), 'boven dagplafond');

\echo '5. Toegekend en Nu niet'
select pg_temp.gelijk(public.tijdverzoek_behandelen(:'v1', true, null, '1234'), 'toegekend', 'toekennen');
select pg_temp.gelijk((select array[saldo, gereserveerd, vrij] from public.kind_saldo where kind_id = :luca),
                      array[70, 30, 40], 'saldo na toekennen');
select pg_temp.gelijk(public.tijdverzoek_behandelen(:'v2', false, 'We gaan eten', '1234'), 'afgewezen', 'nu niet');
select pg_temp.gelijk((select array[saldo, gereserveerd, vrij] from public.kind_saldo where kind_id = :luca),
                      array[70, 0, 70], 'sterren terug na nu niet');
select pg_temp.gelijk((select reden from public.tijdverzoeken where id = :'v2'), 'We gaan eten', 'reden bewaard');
select pg_temp.fout(format('select public.tijdverzoek_behandelen(%L, true, null, %L)', :'v1', '1234'), 'al behandeld');
select pg_temp.gelijk(public.extra_vandaag(:luca, '2026-10-21'), 30, 'afgewezen telt niet mee voor plafond');

\echo '6. Tijdvenster'
select set_config('app.nu', '2026-10-21 06:59+02', false);
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :luca), 'buiten tijdvenster');
select set_config('app.nu', '2026-10-21 20:00+02', false);
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :luca), 'buiten tijdvenster');

\echo '7. Vervallen'
select set_config('app.nu', '2026-10-21 18:30+02', false);
select public.tijd_aanvragen(:luca, 15) as v3 \gset
select pg_temp.gelijk((select vervalt_op from public.tijdverzoeken where id = :'v3'),
                      '2026-10-21 20:00+02'::timestamptz, 'uiterlijk 20:00');
select set_config('app.nu', '2026-10-21 19:00+02', false);
select public.tijd_aanvragen(:luca, 15) as v4 \gset
select set_config('app.nu', '2026-10-21 20:01+02', false);
select pg_temp.gelijk(public.tijdverzoek_behandelen(:'v4', true, null, '1234'), 'vervallen', 'te laat behandeld');
select pg_temp.fout('select public.verzoeken_laten_vervallen()', 'permission denied');
reset role;
select pg_temp.gelijk(public.verzoeken_laten_vervallen(), 1, 'cron laat v3 vervallen');
select pg_temp.gelijk(public.gereserveerd(:luca), 0, 'niets meer gereserveerd');
select pg_temp.gelijk(public.saldo(:luca), 70, 'vervallen kost geen sterren');
set role authenticated;

\echo '8. Te weinig sterren'
select set_config('app.nu', '2026-10-21 16:00+02', false);
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :yuna), 'te weinig sterren');

\echo '9. Feline vraagt zelf niets; een ouder geeft tijd'
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :feline), 'vraagt zelf geen tijd');
select pg_temp.gelijk(public.tijd_geven(:feline, 15), 'pincode_fout', 'tijd geven zonder pin');
select pg_temp.gelijk(public.tijd_geven(:feline, 15, '1234'), 'toegekend', 'tijd geven');
select pg_temp.gelijk(public.saldo(:feline), 5, 'saldo Feline');
select pg_temp.fout(format('select public.tijd_geven(%L, 15, %L)', :feline, '1234'), 'te weinig sterren');

\echo '10. Gezinnen zijn van elkaar afgeschermd'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f3', false);
select pg_temp.gelijk((select count(*) from public.gebruikers), 1::bigint, 'buren zien alleen eigen gezin');
select pg_temp.gelijk((select count(*) from public.puntenlog), 0::bigint, 'buren zien geen log');
select pg_temp.fout(format('select public.tijd_aanvragen(%L, 15)', :luca), 'kind niet gevonden');
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :luca, :tafel), 'taak niet gevonden');
select pg_temp.gelijk(public.tijd_geven(:luca, 15, '1234'), 'pincode_fout', 'pin van ander gezin');

\echo '11. Rechten van de tablet'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f2', false);
select pg_temp.fout($$insert into public.puntenlog (gezin_id, kind_id, delta, reden, bron, tijdstip)
  values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2', 50, 'vals', 'correctie', now())$$,
  'permission denied');
select pg_temp.fout('select * from public.ouder_pins', 'permission denied');
select pg_temp.fout($$update public.tijdverzoeken set status = 'toegekend'$$, 'permission denied');
select pg_temp.fout($$insert into public.taken (gezin_id, titel, sterren)
  values ('00000000-0000-0000-0000-00000000000a', 'Snoep eten', 50)$$, 'row-level security');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f1', false);
insert into public.taken (gezin_id, titel, sterren) values ('00000000-0000-0000-0000-00000000000a', 'Plantjes water geven', 5);

\echo '12. Pincode blokkeert na 5 fouten in 10 minuten'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f2', false);
select set_config('app.nu', '2026-10-23 16:00+02', false);
select public.taak_indienen(:luca, :tafel) as inz_slot \gset
select public.inzending_beoordelen(:'inz_slot', true, '9999') from generate_series(1, 5);
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_slot', true, '1234'), 'pincode_fout', 'geblokkeerd');
select set_config('app.nu', '2026-10-23 16:11+02', false);
select pg_temp.gelijk(public.inzending_beoordelen(:'inz_slot', true, '1234'), 'goedgekeurd', 'na 10 minuten weer');

reset role;
\echo 'Alle tests geslaagd.'
