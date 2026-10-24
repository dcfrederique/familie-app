-- Tests voor het weekmenu: het gezin leest, alleen een ouder schrijft. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000601'), ('00000000-0000-0000-0000-000000000602'),
                              ('00000000-0000-0000-0000-000000000603');
select set_config('app.nu', '2026-10-24 16:00+02', false);
set role authenticated;

select pg_temp.als('00000000-0000-0000-0000-000000000601', false);
select public.gezin_aanmaken('Menu', 'Ouder', '[{"naam": "Lies"}]') as gezin \gset
select public.koppelcode_maken('tablet') as code \gset
select pg_temp.als('00000000-0000-0000-0000-000000000602', true);
select public.koppelen(:'code');

\echo '1. Een ouder vult het weekmenu in en past het aan'
select pg_temp.als('00000000-0000-0000-0000-000000000601', false);
insert into public.weekmenu (gezin_id, dag, gerecht) values (:'gezin', '2026-10-24', 'Spaghetti');
insert into public.weekmenu (gezin_id, dag, gerecht, prentje) values (:'gezin', '2026-10-24', 'Frietjes met vis', 'vis')
  on conflict (gezin_id, dag) do update set gerecht = excluded.gerecht, prentje = excluded.prentje;
select pg_temp.gelijk((select gerecht from public.weekmenu where dag = '2026-10-24'), 'Frietjes met vis', 'aangepast');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, gerecht) values (%L, %L, %L)', :'gezin', '2026-10-25', '  '), 'check');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, gerecht, prentje) values (%L, %L, %L, %L)', :'gezin', '2026-10-25', 'Soep', 'X;'), 'check');

\echo '2. De tablet leest, maar schrijft niet'
select pg_temp.als('00000000-0000-0000-0000-000000000602', true);
select pg_temp.gelijk((select gerecht from public.weekmenu where dag = '2026-10-24'), 'Frietjes met vis', 'tablet leest');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, gerecht) values (%L, %L, %L)', :'gezin', '2026-10-26', 'Pizza'), 'row-level security');
update public.weekmenu set gerecht = 'Pizza' where dag = '2026-10-24';
delete from public.weekmenu where dag = '2026-10-24';
select pg_temp.gelijk((select gerecht from public.weekmenu where dag = '2026-10-24'), 'Frietjes met vis', 'tablet past niets aan');

\echo '3. Een ander gezin ziet het menu niet'
select pg_temp.als('00000000-0000-0000-0000-000000000603', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]');
select pg_temp.gelijk((select count(*) from public.weekmenu), 0::bigint, 'ander gezin');
select pg_temp.fout(format('insert into public.weekmenu (gezin_id, dag, gerecht) values (%L, %L, %L)', :'gezin', '2026-10-26', 'Pizza'), 'row-level security');

reset role;
