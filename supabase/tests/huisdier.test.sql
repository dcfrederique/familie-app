-- Tests voor Mijn huisdier. Draaien met scripts/test-db.sh.
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

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000008aa', 'Huisdier');
insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen, vraagt_zelf_tijd) values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008aa', 'Mama', 'ouder', true, true),
  ('00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-0000000008aa', 'Luca', 'kind', true, true);
insert into public.ouder_pins values
  ('00000000-0000-0000-0000-0000000008a1', extensions.crypt('1234', extensions.gen_salt('bf')));
insert into auth.users values ('00000000-0000-0000-0000-0000000008f1');
insert into public.accounts values
  ('00000000-0000-0000-0000-0000000008f1', '00000000-0000-0000-0000-0000000008aa', 'ouder', '00000000-0000-0000-0000-0000000008a1');
\set luca '''00000000-0000-0000-0000-0000000008a2'''
select set_config('app.nu', '2026-11-07 10:00+01', false);

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000008f1', false);
select public.sterren_aanpassen(:luca, 20, 'start');

\echo '1. Zonder ouder geen huisdier'
select pg_temp.fout(format('select public.huisdier_kiezen(%L, ''dino'', ''Rokko'')', :luca), 'staat uit');
select pg_temp.gelijk(public.huisdier_instellen(:luca, true, '0000'), 'pincode_fout', 'pincode');
select pg_temp.gelijk(public.huisdier_instellen(:luca, true, '1234'), 'ingesteld', 'aanzetten');

\echo '2. Een ei kiezen'
select pg_temp.fout(format('select public.huisdier_kiezen(%L, ''draak'', ''Rokko'')', :luca), 'niet toegelaten');
select pg_temp.fout(format('select public.huisdier_kiezen(%L, ''dino'', '' '')', :luca), 'naam');
select public.huisdier_kiezen(:luca, 'dino', ' Rokko ');
select pg_temp.fout(format('select public.huisdier_kiezen(%L, ''kat'', ''Mimi'')', :luca), 'al een huisdier');
select pg_temp.gelijk((public.huisdier_overzicht() -> 'kinderen' -> '00000000-0000-0000-0000-0000000008a2' ->> 'naam'), 'Rokko', 'naam');
select pg_temp.fout(format('select public.huisdier_verzorgen(%L, ''eten'')', :luca), 'nog niet uitgekomen');

\echo '3. Taken laten het huisdier groeien'
reset role;
insert into public.taken (id, gezin_id, titel, sterren, herhaling, actief) values
  ('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008aa', 'Tafel dekken', 3, 'elke_dag', true)
  on conflict do nothing;
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag, status, beoordeeld_op)
select '00000000-0000-0000-0000-0000000008aa', '00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-0000000008b1',
       '2026-11-07 09:00+01', ('2026-11-0' || n)::date, 'goedgekeurd', '2026-11-08 09:00+01'
from generate_series(1, 3) n;
-- een afgekeurde telt niet mee
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag, status, beoordeeld_op) values
  ('00000000-0000-0000-0000-0000000008aa', '00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-0000000008b1',
   '2026-11-07 09:00+01', '2026-11-05', 'afgekeurd', '2026-11-08 09:00+01');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000008f1', false);
select set_config('app.nu', '2026-11-08 10:00+01', false);
select pg_temp.gelijk((public.huisdier_overzicht() -> 'kinderen' -> '00000000-0000-0000-0000-0000000008a2' ->> 'pootjes')::int, 3, 'pootjes');

\echo '4. Verzorgen kost sterren, een keer per periode'
select pg_temp.gelijk(public.huisdier_verzorgen(:luca, 'eten'), 18, 'eten kost 2');
select pg_temp.fout(format('select public.huisdier_verzorgen(%L, ''eten'')', :luca), 'al vol');
select pg_temp.gelijk(public.huisdier_verzorgen(:luca, 'knuffel'), 18, 'knuffelen is gratis');
select pg_temp.fout(format('select public.huisdier_verzorgen(%L, ''knuffel'')', :luca), 'al helemaal blij');
select set_config('app.nu', '2026-11-08 13:30+01', false);
select pg_temp.gelijk(public.huisdier_verzorgen(:luca, 'eten'), 16, 'opnieuw eten na 3 uur');
select pg_temp.gelijk(public.huisdier_verzorgen(:luca, 'wassen'), 15, 'wassen kost 1');
select pg_temp.gelijk((select delta from public.puntenlog where bron = 'huisdier' order by id desc limit 1), -1, 'log');
select pg_temp.gelijk((select reden from public.puntenlog where bron = 'huisdier' order by id desc limit 1), 'Huisdier: wassen (Rokko)', 'reden');

\echo '5. Daglimiet'
select public.huisdier_regels_bewaren(3, 8, 15, 2, 1, 5, array['hond', 'dino'], '1234');
select set_config('app.nu', '2026-11-08 17:00+01', false);
select pg_temp.fout(format('select public.huisdier_verzorgen(%L, ''eten'')', :luca), 'daglimiet');
select set_config('app.nu', '2026-11-09 08:00+01', false);
select pg_temp.gelijk(public.huisdier_verzorgen(:luca, 'eten'), 13, 'nieuwe dag, nieuwe limiet');
select pg_temp.fout('select public.huisdier_regels_bewaren(8, 8, 15, 2, 1, 5, array[''hond''], ''1234'')', 'oplopen');

\echo '6. Te weinig vrije sterren'
select public.sterren_aanpassen(:luca, -12, 'weg');
select set_config('app.nu', '2026-11-10 08:00+01', false);
select pg_temp.fout(format('select public.huisdier_verzorgen(%L, ''eten'')', :luca), 'niet genoeg vrije sterren');

\echo 'Huisdier: ok'
