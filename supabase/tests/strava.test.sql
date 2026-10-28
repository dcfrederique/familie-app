-- Tests voor de Strava-koppeling: de tokens zijn voor de app onzichtbaar. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-0000000009b1'), ('00000000-0000-0000-0000-0000000009b2');
set role authenticated;
select pg_temp.als('00000000-0000-0000-0000-0000000009b1', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}]', 'Bert') as gezin \gset
select public.mijn_ouder() as an \gset

\echo '1. Zonder koppeling'
select pg_temp.gelijk((select gekoppeld from public.strava_status()), false, 'niet gekoppeld');

\echo '2. De app kan de tokens niet lezen of schrijven'
select pg_temp.fout('select * from public.strava_koppelingen', 'permission denied');
select pg_temp.fout(format('insert into public.strava_koppelingen (ouder_id, gezin_id, atleet_id, access_token, refresh_token, verloopt_op) values (%L, %L, 1, %L, %L, now())', :'an', :'gezin', 'a', 'r'), 'permission denied');

\echo '3. Met koppeling (door de service-rol) zie je enkel de status'
reset role;
insert into public.strava_koppelingen (ouder_id, gezin_id, atleet_id, access_token, refresh_token, verloopt_op) values (:'an', :'gezin', 42, 'a', 'r', now());
set role authenticated;
select pg_temp.gelijk((select gekoppeld from public.strava_status()), true, 'gekoppeld');
select pg_temp.als('00000000-0000-0000-0000-0000000009b2', false);
select public.gezin_aanmaken('Buren', 'Buur', '[{"naam": "Tom"}]');
select pg_temp.gelijk((select gekoppeld from public.strava_status()), false, 'een ander ziet jouw koppeling niet');

reset role;
