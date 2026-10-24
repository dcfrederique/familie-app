-- Tests voor Boodschappen en Winkels: alleen de ouders, nooit een tablet. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000b01'), ('00000000-0000-0000-0000-000000000b02'),
                              ('00000000-0000-0000-0000-000000000b03'), ('00000000-0000-0000-0000-000000000b04');
set role authenticated;

-- Gezin met twee ouders (An op b01, Bert op b02) en een tablet (b03).
select pg_temp.als('00000000-0000-0000-0000-000000000b01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select id as bert from public.gebruikers where naam = 'Bert' \gset
select public.koppelcode_maken('ouder', :'bert') as code_bert \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-000000000b02', false);
select public.koppelen(:'code_bert');
select pg_temp.als('00000000-0000-0000-0000-000000000b03', true);
select public.koppelen(:'code_tablet');

\echo '1. Een nieuw gezin krijgt de vier winkels'
select pg_temp.als('00000000-0000-0000-0000-000000000b01', false);
select pg_temp.gelijk((select string_agg(naam, ',' order by volgorde) from public.winkels), 'Colruyt,Aldi,Lidl,Albert Heijn', 'standaardwinkels');
select id as colruyt from public.winkels where naam = 'Colruyt' \gset
insert into public.winkels (gezin_id, naam, volgorde) values (:'gezin', 'Delhaize', 5);
select pg_temp.fout(format('insert into public.winkels (gezin_id, naam) values (%L, %L)', :'gezin', ' aldi'), 'duplicate key');

\echo '2. Boodschappen toevoegen, afvinken, een winkel weggooien'
insert into public.boodschappen (gezin_id, naam, winkel_id, dag, gerecht) values (:'gezin', 'Gehakt', :'colruyt', '2026-10-27', 'Spaghetti bolognese');
insert into public.boodschappen (gezin_id, naam, winkel_id) values (:'gezin', 'Melk', (select id from public.winkels where naam = 'Delhaize'));
update public.boodschappen set gekocht_op = now(), gekocht_door = public.mijn_ouder() where naam = 'Gehakt';
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam) values (%L, %L)', :'gezin', '  '), 'check');
delete from public.winkels where naam = 'Delhaize';
select pg_temp.gelijk((select winkel_id from public.boodschappen where naam = 'Melk'), null::uuid, 'melk zonder winkel');
select pg_temp.als('00000000-0000-0000-0000-000000000b02', false);
select pg_temp.gelijk((select count(*) from public.boodschappen), 2::bigint, 'Bert ziet de lijst');
update public.boodschappen set winkel_id = :'colruyt' where naam = 'Melk';

\echo '3. De tablet ziet niets en kan niets toevoegen'
select pg_temp.als('00000000-0000-0000-0000-000000000b03', true);
select pg_temp.gelijk((select count(*) from public.boodschappen), 0::bigint, 'tablet ziet geen boodschappen');
select pg_temp.gelijk((select count(*) from public.winkels), 0::bigint, 'tablet ziet geen winkels');
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam) values (%L, %L)', :'gezin', 'Snoep'), 'row-level security');

\echo '4. Een ander gezin ziet niets en kan geen winkel van ons gebruiken'
select pg_temp.als('00000000-0000-0000-0000-000000000b04', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]') as buren \gset
select pg_temp.gelijk((select count(*) from public.boodschappen), 0::bigint, 'ander gezin boodschappen');
select pg_temp.gelijk((select count(*) from public.winkels), 4::bigint, 'ander gezin heeft eigen winkels');
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam, winkel_id) values (%L, %L, %L)', :'buren', 'Brood', :'colruyt'), 'row-level security');

reset role;
