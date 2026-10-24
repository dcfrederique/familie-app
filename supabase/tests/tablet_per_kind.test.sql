-- Tests voor tablet per kind en het welkomstpad. Draaien met scripts/test-db.sh.
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

-- Logins: ouder, tablet A, tablet B
insert into auth.users values
  ('00000000-0000-0000-0000-000000000901'), ('00000000-0000-0000-0000-000000000902'),
  ('00000000-0000-0000-0000-000000000903');
select set_config('app.nu', '2026-10-24 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000901', false);
select public.gezin_aanmaken('Tablets', 'Ouder', '[{"naam": "Lowie"}, {"naam": "Mila"}]') as gezin \gset
select public.pin_instellen('1357');
select id as lowie from public.gebruikers where naam = 'Lowie' \gset
select id as mila from public.gebruikers where naam = 'Mila' \gset
select id as tanden from public.taken where titel = 'Tanden poetsen' \gset
select public.koppelcode_maken('tablet') as code_a \gset
select public.koppelcode_maken('tablet') as code_b \gset
select pg_temp.fout(format('select public.tablet_kiezen(%L)', :'lowie'), 'alleen op een tablet');

select pg_temp.als('00000000-0000-0000-0000-000000000902', true);
select public.koppelen(:'code_a');
select pg_temp.als('00000000-0000-0000-0000-000000000903', true);
select public.koppelen(:'code_b');

\echo '1. Een nieuwe tablet hoort nog bij niemand'
select pg_temp.gelijk(public.tablet_kind(), null::uuid, 'nog niemand');
select pg_temp.gelijk((select welkom_klaar from public.gebruikers where id = :'mila'), false, 'welkom nog niet gedaan');

\echo '2. Kind kiest zichzelf'
select pg_temp.als('00000000-0000-0000-0000-000000000902', true);
select pg_temp.gelijk(public.tablet_kiezen(:'lowie'), 'gekozen', 'Lowie kiest');
select pg_temp.gelijk(public.tablet_kind(), :'lowie'::uuid, 'tablet A is van Lowie');
select pg_temp.gelijk(public.tablet_kiezen(:'lowie'), 'gekozen', 'nog eens hetzelfde kind mag');
select pg_temp.fout('select public.tablet_kiezen(''00000000-0000-0000-0000-000000000999'')', 'kind niet gevonden');

\echo '3. Overstappen naar een ander kind vraagt de pincode'
select pg_temp.fout(format('select public.tablet_kiezen(%L)', :'mila'), 'tablet hoort al bij een kind');
select pg_temp.gelijk(public.tablet_kiezen(:'mila', '0000'), 'pincode_fout', 'foute pin');
select pg_temp.gelijk(public.tablet_kind(), :'lowie'::uuid, 'nog steeds Lowie');

\echo '4. Een kind met een tablet kiezen op een andere tablet vraagt de pincode'
select pg_temp.als('00000000-0000-0000-0000-000000000903', true);
select pg_temp.fout(format('select public.tablet_kiezen(%L)', :'lowie'), 'kind heeft al een tablet');
select pg_temp.gelijk(public.tablet_kiezen(:'mila'), 'gekozen', 'Mila kiest');

\echo '5. Een tablet doet niets voor een ander kind'
select pg_temp.fout(format('select public.taak_indienen(%L, %L)', :'lowie', :'tanden'), 'hoort bij een ander kind');
select public.taak_indienen(:'mila', :'tanden');
select pg_temp.fout(format('select public.activiteit_opslaan(%L, %L, %L, 60)', :'lowie', 'rekenen', '{"goed": 10}'),
                    'hoort bij een ander kind');
select pg_temp.fout(format('select public.figuurtje_bewaren(%L, %L)', :'lowie', '{"huid":"bruin","gezicht":"lach","haar":"lang","haarKleur":"zwart","hoofd":"geen","shirt":"tshirt","shirtKleur":"roze","broek":"rok","broekKleur":"jeans","schoenen":"sport","schoenKleur":"wit","extra":"geen"}'),
                    'hoort bij een ander kind');
select pg_temp.fout(format('select public.welkom_afronden(%L)', :'lowie'), 'hoort bij een ander kind');

\echo '6. Welkomstpad met bonus van 10 sterren, maar één keer'
select pg_temp.fout(format('select public.welkom_afronden(%L, null, null, %L)', :'mila', 'regenboog'), 'onbekend thema');
select pg_temp.fout(format('select public.welkom_afronden(%L, null, %L)', :'mila', '2027-01-01'), 'geboortedatum klopt niet');
select pg_temp.fout(format('select public.welkom_afronden(%L, %L)', :'mila', '{"huid":"bruin","gezicht":"lach","haar":"krullen","haarKleur":"zwart","hoofd":"geen","shirt":"tshirt","shirtKleur":"roze","broek":"rok","broekKleur":"jeans","schoenen":"sport","schoenKleur":"wit","extra":"geen"}'),
                    'nog niet gekocht');
select pg_temp.gelijk(public.saldo(:'mila'), 0, 'niets bewaard, geen bonus');
select pg_temp.gelijk(public.welkom_afronden(:'mila',
  '{"huid":"bruin","gezicht":"lach","haar":"lang","haarKleur":"zwart","hoofd":"geen","shirt":"tshirt","shirtKleur":"roze","broek":"rok","broekKleur":"jeans","schoenen":"sport","schoenKleur":"wit","extra":"geen"}',
  '2020-03-14', 'roze'), 10, 'bonus');
select pg_temp.gelijk((select thema || ' ' || geboortedatum || ' ' || welkom_klaar || ' ' || (figuurtje ->> 'haar')
                       from public.gebruikers where id = :'mila'), 'roze 2020-03-14 true lang', 'bewaard');
select pg_temp.gelijk(public.saldo(:'mila'), 10, 'saldo 10');
select pg_temp.gelijk(public.welkom_afronden(:'mila'), 0, 'tweede keer geen bonus');
select pg_temp.gelijk(public.saldo(:'mila'), 10, 'nog steeds 10');
select pg_temp.gelijk((select bron from public.puntenlog where kind_id = :'mila'), 'welkom', 'bron welkom');
-- Het kind kiest later zelf een ander thema (voetbal), alleen voor zichzelf.
select public.thema_kiezen(:'mila', 'gras');
select pg_temp.gelijk((select thema from public.gebruikers where id = :'mila'), 'gras', 'voetbalthema gekozen');
select pg_temp.fout(format('select public.thema_kiezen(%L, %L)', :'mila', 'regenboog'), 'onbekend thema');
select pg_temp.fout(format('select public.thema_kiezen(%L, %L)', :'lowie', 'gras'), 'hoort bij een ander kind');
-- De tablet mag de verjaardag niet rechtstreeks aanpassen.
update public.gebruikers set geboortedatum = '2019-01-01' where id = :'mila';
select pg_temp.gelijk((select geboortedatum from public.gebruikers where id = :'mila'), '2020-03-14'::date, 'tablet past niet aan');
select pg_temp.gelijk((select count(*) from public.tablets()), 0::bigint, 'tablet ziet de lijst niet');

\echo '7. Met de pincode op de tablet een ander kind kiezen'
select pg_temp.gelijk(public.tablet_loskoppelen(null, false, '0000'), 'pincode_fout', 'foute pin');
select pg_temp.gelijk(public.tablet_loskoppelen(null, false, '1357'), 'ok', 'losgekoppeld');
select pg_temp.gelijk(public.tablet_kind(), null::uuid, 'weer niemand');
-- Lowie heeft nog tablet A, dus ook hier de pincode.
select pg_temp.gelijk(public.tablet_kiezen(:'lowie', '1357'), 'gekozen', 'met pincode');
select pg_temp.gelijk(public.tablet_kind(), :'lowie'::uuid, 'tablet B is nu van Lowie');

\echo '8. De ouder ziet de tablets en koppelt los of verwijdert'
select pg_temp.als('00000000-0000-0000-0000-000000000901', false);
select pg_temp.gelijk((select count(*) from public.tablets() where kind_id = :'lowie'), 2::bigint, 'twee tablets voor Lowie');
update public.gebruikers set geboortedatum = '2018-05-02', welkom_klaar = false where id = :'lowie';
select pg_temp.gelijk((select geboortedatum from public.gebruikers where id = :'lowie'), '2018-05-02'::date, 'ouder zet verjaardag');
select pg_temp.gelijk(public.tablet_loskoppelen('00000000-0000-0000-0000-000000000903'), 'ok', 'ouder koppelt los');
select pg_temp.gelijk((select kind_id from public.tablets() where user_id = '00000000-0000-0000-0000-000000000903'),
                      null::uuid, 'tablet B los');
select pg_temp.gelijk(public.tablet_loskoppelen('00000000-0000-0000-0000-000000000902', true), 'ok', 'tablet A weg');
select pg_temp.gelijk((select count(*) from public.tablets()), 1::bigint, 'nog één tablet');
select pg_temp.fout('select public.tablet_loskoppelen(''00000000-0000-0000-0000-000000000901'')', 'tablet niet gevonden');
-- Een ouder mag tijd geven en het figuurtje aanpassen voor elk kind.
select public.figuurtje_bewaren(:'lowie', null);

\echo '9. De verwijderde tablet hoort niet meer bij het gezin'
select pg_temp.als('00000000-0000-0000-0000-000000000902', true);
select pg_temp.gelijk(public.mijn_gezin(), null::uuid, 'geen gezin meer');

reset role;
\echo 'Alle tablet-per-kind-tests geslaagd.'
