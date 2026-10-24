-- Tests voor sterren door een ouder aanpassen. Draaien met scripts/test-db.sh.
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

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000005aa', 'Aanpassen');
insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen, vraagt_zelf_tijd) values
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-0000000005aa', 'Mama', 'ouder', true, true),
  ('00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-0000000005aa', 'Kind', 'kind', true, true);
insert into public.ouder_pins values
  ('00000000-0000-0000-0000-0000000005a1', extensions.crypt('1234', extensions.gen_salt('bf')));
insert into auth.users values ('00000000-0000-0000-0000-0000000005f1'), ('00000000-0000-0000-0000-0000000005f2');
insert into public.accounts values
  ('00000000-0000-0000-0000-0000000005f1', '00000000-0000-0000-0000-0000000005aa', 'ouder', '00000000-0000-0000-0000-0000000005a1'),
  ('00000000-0000-0000-0000-0000000005f2', '00000000-0000-0000-0000-0000000005aa', 'tablet', null);
\set kind '''00000000-0000-0000-0000-0000000005a2'''
select set_config('app.nu', '2026-10-24 16:00+02', false);

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005f1', false);

\echo '1. Ouder geeft sterren bij en neemt ze af'
select pg_temp.gelijk(public.sterren_aanpassen(:kind, 30, 'Zwemles'), 'aangepast', 'bijgeven');
select pg_temp.gelijk(public.saldo(:kind), 30, 'saldo 30');
select pg_temp.gelijk((select reden || '|' || bron from public.puntenlog where kind_id = :kind), 'Van mama of papa erbij: Zwemles|ouder', 'log');
select pg_temp.gelijk(public.sterren_aanpassen(:kind, -5), 'aangepast', 'afnemen');
select pg_temp.gelijk(public.saldo(:kind), 25, 'saldo 25');
select pg_temp.fout(format('select public.sterren_aanpassen(%L, 0)', :kind), 'ongeldig');
select pg_temp.fout(format('select public.sterren_aanpassen(%L, 5000)', :kind), 'ongeldig');

\echo '2. Gereserveerde sterren blijven staan'
select public.tijd_aanvragen(:kind, 15) is not null;
select pg_temp.gelijk(public.gereserveerd(:kind), 15, 'gereserveerd');
select pg_temp.fout(format('select public.sterren_aanpassen(%L, -11)', :kind), 'te weinig vrije sterren');
select pg_temp.gelijk(public.sterren_aanpassen(:kind, -10), 'aangepast', 'precies het vrije saldo');
select pg_temp.gelijk(public.saldo(:kind), 15, 'saldo nog 15');

\echo '3. Tablet heeft de pincode nodig'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005f2', false);
select pg_temp.gelijk(public.sterren_aanpassen(:kind, 5), 'pincode_fout', 'zonder pin');
select pg_temp.gelijk(public.sterren_aanpassen(:kind, 5, null, '0000'), 'pincode_fout', 'foute pin');
select pg_temp.gelijk(public.sterren_aanpassen(:kind, 5, null, '1234'), 'aangepast', 'juiste pin');

reset role;
\echo 'Alle sterren-aanpassen-tests geslaagd.'
