-- Tests voor categorieën, prijzen en uitgaven bij de boodschappen: alleen de ouders. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000e01'), ('00000000-0000-0000-0000-000000000e02'),
                              ('00000000-0000-0000-0000-000000000e03'), ('00000000-0000-0000-0000-000000000e04');
set role authenticated;

-- Gezin met een ouder (e01), een tablet (e02) en een buurgezin (e03).
select pg_temp.als('00000000-0000-0000-0000-000000000e01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]') as gezin \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-000000000e02', true);
select public.koppelen(:'code_tablet');

\echo '1. Een nieuw gezin krijgt categorieën'
select pg_temp.als('00000000-0000-0000-0000-000000000e01', false);
select pg_temp.gelijk((select count(*) from public.categorieen), 11::bigint, 'standaardcategorieën');
select id as zuivel from public.categorieen where naam = 'Zuivel en eieren' \gset
select id as colruyt from public.winkels where naam = 'Colruyt' \gset
select pg_temp.fout(format('insert into public.categorieen (gezin_id, naam) values (%L, %L)', :'gezin', ' ANDERE'), 'duplicate key');

\echo '2. Prijs en categorie bij een boodschap'
insert into public.boodschappen (gezin_id, naam, winkel_id, categorie_id, prijs, gekocht_op)
  values (:'gezin', 'Melk', :'colruyt', :'zuivel', 1.29, now());
select pg_temp.gelijk((select sum(prijs) from public.boodschappen where categorie_id = :'zuivel'), 1.29::numeric, 'prijs bewaard');
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam, prijs) values (%L, %L, -1)', :'gezin', 'Gratis'), 'check');
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam, prijs) values (%L, %L, 100000)', :'gezin', 'Te duur'), 'check');
delete from public.categorieen where id = :'zuivel';
select pg_temp.gelijk((select categorie_id from public.boodschappen where naam = 'Melk'), null::uuid, 'categorie weg, artikel blijft');
select pg_temp.gelijk((select prijs from public.boodschappen where naam = 'Melk'), 1.29::numeric, 'prijs blijft');

\echo '3. De tablet ziet niets'
select pg_temp.als('00000000-0000-0000-0000-000000000e02', true);
select pg_temp.gelijk((select count(*) from public.categorieen), 0::bigint, 'tablet ziet geen categorieën');
select pg_temp.fout(format('insert into public.categorieen (gezin_id, naam) values (%L, %L)', :'gezin', 'Stiekem'), 'row-level security');

\echo '4. Een ander gezin kan onze categorie niet gebruiken'
select pg_temp.als('00000000-0000-0000-0000-000000000e01', false);
select id as andere from public.categorieen where naam = 'Andere' \gset
select pg_temp.als('00000000-0000-0000-0000-000000000e03', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]') as buren \gset
select pg_temp.gelijk((select count(*) from public.categorieen), 11::bigint, 'buren hebben eigen categorieën');
select pg_temp.fout(format('insert into public.boodschappen (gezin_id, naam, categorie_id) values (%L, %L, %L)', :'buren', 'Brood', :'andere'), 'row-level security');

reset role;
