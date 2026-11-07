-- Tests voor de Sterrenpot en de gezinspot. Draaien met scripts/test-db.sh.
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

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000006aa', 'Pot');
insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen, vraagt_zelf_tijd) values
  ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006aa', 'Mama', 'ouder', true, true),
  ('00000000-0000-0000-0000-0000000006a2', '00000000-0000-0000-0000-0000000006aa', 'Luca', 'kind', true, true),
  ('00000000-0000-0000-0000-0000000006a3', '00000000-0000-0000-0000-0000000006aa', 'Feline', 'kind', false, false);
insert into public.ouder_pins values
  ('00000000-0000-0000-0000-0000000006a1', extensions.crypt('1234', extensions.gen_salt('bf')));
insert into auth.users values ('00000000-0000-0000-0000-0000000006f1'), ('00000000-0000-0000-0000-0000000006f2');
insert into public.accounts values
  ('00000000-0000-0000-0000-0000000006f1', '00000000-0000-0000-0000-0000000006aa', 'ouder', '00000000-0000-0000-0000-0000000006a1'),
  ('00000000-0000-0000-0000-0000000006f2', '00000000-0000-0000-0000-0000000006aa', 'tablet', null);
\set luca '''00000000-0000-0000-0000-0000000006a2'''
\set feline '''00000000-0000-0000-0000-0000000006a3'''
select set_config('app.nu', '2026-11-07 10:00+01', false);

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006f1', false);
select public.sterren_aanpassen(:luca, 100, 'start');
select public.sterren_aanpassen(:feline, 30, 'start');

\echo '1. Ouder stelt een pot in, het kind stort'
select pg_temp.fout(format('select public.pot_storten(%L, 5)', :luca), 'geen pot');
select pg_temp.fout(format('select public.pot_instellen(%L, true, '''', ''ijs'', 40)', :luca), 'doel');
select pg_temp.gelijk(public.pot_instellen(:luca, true, 'Plopsaland', 'pretpark', 60), 'ingesteld', 'instellen');
select pg_temp.gelijk(public.pot_storten(:luca, 25), 25, 'storten');
select pg_temp.gelijk(public.saldo(:luca), 100, 'saldo blijft');
select pg_temp.gelijk((select vrij from public.kind_saldo where kind_id = :luca), 75, 'vrij');
select pg_temp.gelijk((select in_pot from public.kind_saldo where kind_id = :luca), 25, 'in_pot');
select pg_temp.gelijk((select gereserveerd from public.kind_saldo where kind_id = :luca), 0, 'tijd niet gereserveerd');
select pg_temp.fout(format('select public.pot_storten(%L, 0)', :luca), 'ongeldig');
select pg_temp.fout(format('select public.pot_storten(%L, 36)', :luca), 'past niet meer');

\echo '2. Sterren in de pot zijn niet vrij'
select pg_temp.fout(format('select public.sterren_aanpassen(%L, -80)', :luca), 'te weinig vrije sterren');
select pg_temp.gelijk(public.sterren_aanpassen(:luca, -75), 'aangepast', 'precies het vrije saldo');
select pg_temp.fout(format('select public.pot_storten(%L, 1)', :luca), 'niet genoeg vrije');
select public.sterren_aanpassen(:luca, 75, 'terug');

\echo '3. Alleen een ouder haalt sterren uit de pot'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006f2', false);
select pg_temp.gelijk(public.pot_halen(:luca, 5), 'pincode_fout', 'tablet zonder pin');
select pg_temp.gelijk(public.pot_halen(:luca, 5, '1234'), 'gehaald', 'tablet met pin');
select pg_temp.gelijk((select in_pot from public.sterrenpot where kind_id = :luca), 20, 'nog 20');
select pg_temp.fout(format('select public.pot_halen(%L, 21, ''1234'')', :luca), 'ongeldig');
select pg_temp.gelijk(public.pot_instellen(:luca, true, 'x', 'ijs', 5, '1234'), 'ingesteld', 'lager doel');
select pg_temp.gelijk((select in_pot from public.sterrenpot where kind_id = :luca), 5, 'pot is vol door lager doel');
select pg_temp.gelijk(public.pot_instellen(:luca, true, 'Plopsaland', 'pretpark', 60, '1234'), 'ingesteld', 'weer 60');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006f1', false);

\echo '4. Afronden schrijft af'
select pg_temp.fout(format('select public.pot_afronden(%L)', :luca), 'nog niet vol');
select pg_temp.gelijk(public.pot_storten(:luca, 55), 60, 'vol');
select pg_temp.gelijk(public.pot_afronden(:luca), 'afgerond', 'afronden');
select pg_temp.gelijk(public.saldo(:luca), 100 - 60 + 0, 'saldo min 60');
select pg_temp.gelijk((select reden || '|' || bron from public.puntenlog where kind_id = :luca and bron = 'pot'), 'Sterrenpot: Plopsaland|pot', 'log');
select pg_temp.gelijk((select aan from public.sterrenpot where kind_id = :luca), false, 'pot uit');
select pg_temp.gelijk((select in_pot from public.kind_saldo where kind_id = :luca), 0, 'niets meer in pot');

\echo '5. Pot uitzetten geeft sterren terug'
select public.pot_instellen(:luca, true, 'Ijsje', 'ijs', 40);
select public.pot_storten(:luca, 10);
select pg_temp.gelijk(public.pot_instellen(:luca, false, 'Ijsje', 'ijs', 40), 'ingesteld', 'uitzetten');
select pg_temp.gelijk((select in_pot from public.kind_saldo where kind_id = :luca), 0, 'terug');

\echo '6. Gezinspot: maximum per kind en samen vol'
select pg_temp.fout(format('select public.gezinspot_storten(%L, 5)', :luca), 'geen gezinspot');
select pg_temp.gelijk(public.gezinspot_instellen(true, 'Dagje uit', 'pretpark', 50, 30), 'ingesteld', 'gezinspot');
select pg_temp.gelijk(public.gezinspot_storten(:luca, 30), 30, 'Luca geeft 30');
select pg_temp.fout(format('select public.gezinspot_storten(%L, 1)', :luca), 'maximum per kind');
select pg_temp.fout(format('select public.gezinspot_storten(%L, 25)', :feline), 'past niet meer');
select pg_temp.gelijk((select vrij from public.kind_saldo where kind_id = :luca), 10, 'Luca vrij');
select pg_temp.gelijk(public.gezinspot_storten(:feline, 20), 50, 'Feline geeft 20');
select pg_temp.gelijk(public.gezinspot_halen(:feline, 5), 'gehaald', 'ouder haalt 5');
select pg_temp.fout('select public.gezinspot_afronden()', 'nog niet vol');
select public.gezinspot_storten(:feline, 5);
select pg_temp.gelijk(public.gezinspot_afronden(), 'afgerond', 'gezinspot gedaan');
select pg_temp.gelijk(public.saldo(:luca), 40 - 30, 'Luca min 30');
select pg_temp.gelijk(public.saldo(:feline), 30 - 20, 'Feline min 20');
select pg_temp.gelijk((select aan from public.gezinspot), false, 'uit');

\echo '7. Een kind van een ander gezin kan niet'
reset role;
insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000006cb', 'Ander');
insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen) values
  ('00000000-0000-0000-0000-0000000006c2', '00000000-0000-0000-0000-0000000006cb', 'Vreemd', 'kind', true);
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006f1', false);
select pg_temp.fout($$select public.pot_storten('00000000-0000-0000-0000-0000000006c2', 1)$$, 'kind niet gevonden');

reset role;
\echo 'Alle sterrenpot-tests geslaagd.'
