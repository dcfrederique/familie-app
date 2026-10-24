-- Meldingen vanzelf versturen: een trigger op de drie tabellen roept de Edge Function "melding" aan via pg_net.
-- Dit vervangt de drie Database Webhooks die met de hand in Supabase gemaakt moesten worden (docs/meldingen.md).
-- Het adres van de functie en het geheim staan in één afgesloten rij; CI vult het adres in en zet hetzelfde
-- geheim bij de Edge Function (job "meldingen" in ci.yml), dus er is niets met de hand te plakken.

do $$
begin
  -- Op Supabase bestaat pg_net; lokaal (tests) wordt deze stap overgeslagen.
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
end $$;

create table public.melding_instellingen (
  id boolean primary key default true check (id),
  functie_url text,
  geheim text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);
insert into public.melding_instellingen (id) values (true);
alter table public.melding_instellingen enable row level security;
revoke all on public.melding_instellingen from anon, authenticated;

-- Mag nooit het opslaan van een taak of verzoek tegenhouden: elke fout wordt ingeslikt.
create function public.melding_versturen() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v public.melding_instellingen;
begin
  select * into v from public.melding_instellingen;
  if v.functie_url is null or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    return new;
  end if;
  execute 'select net.http_post($1, $2, ''{}''::jsonb, $3, 5000)'
    using v.functie_url,
      jsonb_build_object('type', 'INSERT', 'table', tg_table_name, 'record', jsonb_build_object('id', new.id)),
      jsonb_build_object('content-type', 'application/json', 'x-melding-geheim', v.geheim);
  return new;
exception when others then
  raise warning 'melding versturen mislukt: %', sqlerrm;
  return new;
end $$;
revoke execute on function public.melding_versturen() from public, anon, authenticated;

create trigger melding_versturen after insert on public.inzendingen
  for each row execute function public.melding_versturen();
create trigger melding_versturen after insert on public.tijdverzoeken
  for each row execute function public.melding_versturen();
create trigger melding_versturen after insert on public.activiteitlog
  for each row execute function public.melding_versturen();
