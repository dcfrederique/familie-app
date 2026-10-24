-- Tests voor het automatisch versturen van meldingen (trigger + pg_net). Draaien met scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

-- Nep-pg_net: bewaart de aanroepen in plaats van ze te versturen.
create schema net;
create table net.aanroepen (url text, body jsonb, headers jsonb);
create function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
returns bigint language sql as $$ insert into net.aanroepen values (url, body, headers) returning 1::bigint $$;

insert into public.gezinnen (id, naam) values ('00000000-0000-0000-0000-0000000006a1', 'Trigger');
insert into public.gebruikers (id, gezin_id, naam, rol) values ('00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006a1', 'Kim', 'kind');
insert into public.taken (id, gezin_id, titel, sterren) values ('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006a1', 'Tafel dekken', 5);

-- Zonder adres gebeurt er niets, en het opslaan lukt gewoon.
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date);
do $$ begin
  if (select count(*) from net.aanroepen) <> 0 then raise exception 'zonder adres mag er niets verstuurd worden'; end if;
end $$;

-- Met adres gaat er een aanroep met het geheim in de header.
update public.melding_instellingen set functie_url = 'https://voorbeeld.test/functions/v1/melding';
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag, status)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date + 1, 'ingediend');
do $$
declare a net.aanroepen;
begin
  select * into a from net.aanroepen;
  if a.url <> 'https://voorbeeld.test/functions/v1/melding' then raise exception 'verkeerd adres: %', a.url; end if;
  if a.body->>'table' <> 'inzendingen' or a.body->'record'->>'id' is null then raise exception 'verkeerde inhoud: %', a.body; end if;
  if a.headers->>'x-melding-geheim' <> (select geheim from public.melding_instellingen) then raise exception 'geheim ontbreekt'; end if;
end $$;

-- Een kapotte pg_net mag het opslaan nooit tegenhouden.
create or replace function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
returns bigint language plpgsql as $$ begin raise exception 'stuk'; end $$;
insert into public.inzendingen (gezin_id, kind_id, taak_id, tijdstip, dag)
  values ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-0000000006b1', '00000000-0000-0000-0000-0000000006c1', now(), current_date + 2);

-- Testmelding: alleen ouders van het eigen gezin; 0 gsm's = niets versturen.
create or replace function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
returns bigint language sql as $$ insert into net.aanroepen values (url, body, headers) returning 1::bigint $$;
delete from net.aanroepen;
insert into auth.users values ('00000000-0000-0000-0000-000000000611'), ('00000000-0000-0000-0000-000000000612');
insert into public.gebruikers (id, gezin_id, naam, rol) values ('00000000-0000-0000-0000-0000000006b2', '00000000-0000-0000-0000-0000000006a1', 'Jo', 'ouder'),
  ('00000000-0000-0000-0000-0000000006b3', '00000000-0000-0000-0000-0000000006a1', 'Sam', 'ouder');
insert into public.accounts (user_id, gezin_id, soort, ouder_id) values
  ('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-0000000006a1', 'ouder', '00000000-0000-0000-0000-0000000006b2'),
  ('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-0000000006a1', 'ouder', '00000000-0000-0000-0000-0000000006b3');
insert into public.push_abonnementen (endpoint, user_id, gezin_id, p256dh, auth)
  values ('https://push.test/jo', '00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-0000000006a1', 'k', 'a');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000612', false);
grant usage on schema net to authenticated; grant select on net.aanroepen to authenticated;
set role authenticated;
do $$
begin
  if public.melding_testen('00000000-0000-0000-0000-0000000006b2', 'Hoi', 'Test') <> 1 then raise exception 'Jo heeft 1 gsm'; end if;
  if (select count(*) from net.aanroepen) <> 1 then raise exception 'testmelding niet verstuurd'; end if;
  if public.melding_testen('00000000-0000-0000-0000-0000000006b3', 'Hoi', 'Test') <> 0 then raise exception 'Sam heeft geen gsm'; end if;
  if (select count(*) from net.aanroepen) <> 1 then raise exception 'zonder gsm mag er niets verstuurd worden'; end if;
  if (select count(*) from public.melding_ontvangers() where gsms = 1) <> 1 then raise exception 'ontvangers kloppen niet'; end if;
  begin
    perform public.melding_testen('00000000-0000-0000-0000-0000000006b1', 'x', 'y');
    raise exception 'een kind is geen ontvanger';
  exception when others then
    if sqlerrm <> 'onbekende ouder' then raise; end if;
  end;
end $$;
reset role;
drop schema net cascade;
\echo meldingen_trigger: ok
