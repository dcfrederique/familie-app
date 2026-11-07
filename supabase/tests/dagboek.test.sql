-- Tests voor het Dagboek (Mijn dag). Draaien met scripts/test-db.sh.
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
  if echt is distinct from verwacht then raise exception '%: verwachtte %, kreeg %', wat, verwacht, echt; end if;
end $$;

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000007aa', 'Dagboek');
insert into public.gebruikers (id, gezin_id, naam, rol, kan_lezen) values
  ('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-0000000007aa', 'Mama', 'ouder', true),
  ('00000000-0000-0000-0000-0000000007a2', '00000000-0000-0000-0000-0000000007aa', 'Luca', 'kind', true);
insert into public.ouder_pins values ('00000000-0000-0000-0000-0000000007a1', extensions.crypt('1234', extensions.gen_salt('bf')));
insert into auth.users values ('00000000-0000-0000-0000-0000000007f1'), ('00000000-0000-0000-0000-0000000007f2');
insert into public.accounts values
  ('00000000-0000-0000-0000-0000000007f1', '00000000-0000-0000-0000-0000000007aa', 'ouder', '00000000-0000-0000-0000-0000000007a1'),
  ('00000000-0000-0000-0000-0000000007f2', '00000000-0000-0000-0000-0000000007aa', 'tablet', null);
\set luca '''00000000-0000-0000-0000-0000000007a2'''
select set_config('app.nu', '2026-11-07 18:30+01', false);

set role authenticated;

\echo '1. Eerst moet een ouder het dagboek aanzetten'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f2', false);
select pg_temp.fout(format('select public.dagboek_opslaan(%L, ''blij'', ''{}'', '''', null, false)', :luca), 'staat uit');
select pg_temp.gelijk(public.dagboek_instellen(:luca, true), 'pincode_fout', 'tablet zonder pin');
select pg_temp.gelijk(public.dagboek_instellen(:luca, true, '1234'), 'ingesteld', 'tablet met pin');

\echo '2. Het kind bewaart de dag, nog eens bewaren past aan'
select public.dagboek_opslaan(:luca, 'verdrietig', array['school', 'vrienden'], 'Tom wou niet voetballen', '{"lijnen": []}'::jsonb, true);
select public.dagboek_opslaan(:luca, 'blij', array['spelen'], 'Het ging beter', null, false);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f1', false);
select pg_temp.gelijk((select count(*)::int from public.dagboek), 1, 'een rij per dag');
select pg_temp.gelijk((select gevoel || '|' || tekst || '|' || wil_praten from public.dagboek), 'blij|Het ging beter|false', 'aangepast');
select pg_temp.gelijk((select dag from public.dagboek), '2026-11-07'::date, 'dag van vandaag');

\echo '3. Ongeldige invoer'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f2', false);
select pg_temp.fout(format('select public.dagboek_opslaan(%L, ''woedend'', ''{}'', '''', null, false)', :luca), 'check');
select pg_temp.fout(format('select public.dagboek_opslaan(%L, ''blij'', array[''school'',''thuis'',''eten''], '''', null, false)', :luca), 'check');
select pg_temp.fout(format('select public.dagboek_opslaan(%L, ''blij'', array[''pretpark''], '''', null, false)', :luca), 'check');

\echo '4. Een tablet leest het dagboek niet, een ouder wel'
select pg_temp.gelijk((select count(*)::int from public.dagboek), 0, 'tablet ziet niets');
select pg_temp.gelijk((select count(*)::int from public.dagboek_week(:luca)), 1, 'kind ziet eigen week');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f1', false);
select pg_temp.gelijk((select count(*)::int from public.dagboek), 1, 'ouder ziet het');
select public.dagboek_gezien(:luca, '2026-11-07');
select pg_temp.gelijk((select gezien_op is not null from public.dagboek), true, 'gezien');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f2', false);
select pg_temp.fout(format('select public.dagboek_gezien(%L, ''2026-11-07'')', :luca), 'alleen een ouder');

\echo '5. Uitzetten blokkeert nieuw bewaren'
select pg_temp.gelijk(public.dagboek_instellen(:luca, false, '1234'), 'ingesteld', 'uit');
select pg_temp.fout(format('select public.dagboek_opslaan(%L, ''blij'', ''{}'', '''', null, false)', :luca), 'staat uit');

reset role;
\echo 'Alle dagboektests geslaagd.'
