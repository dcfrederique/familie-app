-- Tests voor de chat van de kinderen naar de ouders. Draaien met scripts/test-db.sh.
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

insert into auth.users values ('00000000-0000-0000-0000-000000000d01'), ('00000000-0000-0000-0000-000000000d02');
set role authenticated;

-- Gezin met een ouder (901) en een tablet (902); twee kinderen, Lies en Tom.
select pg_temp.als('00000000-0000-0000-0000-000000000d01', false);
select public.gezin_aanmaken('Wij', 'An', '[{"naam": "Lies"}, {"naam": "Tom"}]') as gezin \gset
select id as lies from public.gebruikers where naam = 'Lies' \gset
select id as tom from public.gebruikers where naam = 'Tom' \gset
select public.koppelcode_maken('tablet') as code_tablet \gset
select pg_temp.als('00000000-0000-0000-0000-000000000d02', true);
select public.koppelen(:'code_tablet');
select public.tablet_kiezen(:'lies');

\echo '1. Standaard staat de chat uit'
select pg_temp.fout(format('select public.chat_sturen(%L, %L)', :'lies', 'Hallo'), 'chat staat uit');

\echo '2. Een ouder zet de chat aan; het kind schrijft, de ouder ziet het en antwoordt'
select pg_temp.als('00000000-0000-0000-0000-000000000d01', false);
update public.gebruikers set chat_aan = true where id = :'lies';
select pg_temp.als('00000000-0000-0000-0000-000000000d02', true);
select public.chat_sturen(:'lies', 'Mag ik een koekje?');
select public.chat_sturen(:'lies', 'Ik heb honger', 'honger');
select pg_temp.fout(format('select public.chat_sturen(%L, %L)', :'lies', '   '), 'leeg bericht');
select pg_temp.fout(format('select public.chat_sturen(%L, %L, %L)', :'lies', 'x', 'Slecht Ding!'), 'check');
select pg_temp.gelijk((select count(*) from public.chat_berichten(:'lies')), 2::bigint, 'kind ziet eigen berichten');
select pg_temp.gelijk((select ongelezen from public.chat_overzicht() where kind_id = :'lies'), 0, 'kind: eigen berichten zijn niet ongelezen');
select pg_temp.als('00000000-0000-0000-0000-000000000d01', false);
select pg_temp.gelijk((select ongelezen from public.chat_overzicht() where kind_id = :'lies'), 2, 'ouder: 2 ongelezen');
select public.chat_gelezen(:'lies');
select pg_temp.gelijk((select ongelezen from public.chat_overzicht() where kind_id = :'lies'), 0, 'ouder las alles');
select public.chat_sturen(:'lies', 'Na het eten.');
select pg_temp.gelijk((select van from public.chat_berichten(:'lies') order by aangemaakt_op desc limit 1), 'ouder', 'antwoord van ouder');
select pg_temp.als('00000000-0000-0000-0000-000000000d02', true);
select pg_temp.gelijk((select ongelezen from public.chat_overzicht() where kind_id = :'lies'), 1, 'kind: antwoord ongelezen');
select pg_temp.gelijk((select count(*) from public.chat_overzicht()), 1::bigint, 'tablet ziet enkel eigen kind in het overzicht');

\echo '3. Een tablet kan niet in het gesprek van een ander kind'
select pg_temp.fout(format('select public.chat_berichten(%L)', :'tom'), 'ander kind');
select pg_temp.fout(format('select public.chat_sturen(%L, %L)', :'tom', 'Hoi'), 'ander kind');
select pg_temp.fout(format('select * from public.berichten'), 'permission denied');

\echo '4. Chat uit voor een kind: sturen mislukt, lezen blijft kunnen'
select pg_temp.als('00000000-0000-0000-0000-000000000d01', false);
update public.gebruikers set chat_aan = false where id = :'lies';
select pg_temp.als('00000000-0000-0000-0000-000000000d02', true);
select pg_temp.fout(format('select public.chat_sturen(%L, %L)', :'lies', 'Nog iets'), 'chat staat uit');
select pg_temp.gelijk((select count(*) from public.chat_berichten(:'lies')), 3::bigint, 'oude berichten blijven zichtbaar');

\echo '5. Te veel berichten na elkaar'
select pg_temp.als('00000000-0000-0000-0000-000000000d01', false);
update public.gebruikers set chat_aan = true where id = :'lies';
select pg_temp.als('00000000-0000-0000-0000-000000000d02', true);
do $$
declare i int;
begin
  for i in 1..40 loop
    begin
      perform public.chat_sturen((select id from public.gebruikers where naam = 'Lies'), 'spam ' || i);
    exception when others then
      if sqlerrm not like '%te veel berichten%' then raise; end if;
      if i <= 27 then raise exception 'te vroeg geblokkeerd bij %', i; end if;
      return;
    end;
  end loop;
  raise exception 'spam werd niet geblokkeerd';
end $$;
\echo 'Alle chattests geslaagd.'
