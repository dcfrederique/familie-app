-- Boodschappen (docs/boodschappen.md, ouderdeel Wij): een lijst per gezin, elk artikel in een winkel.
-- Alleen voor de ouders, zoals Onze taken: alles hangt aan een ouder-account (accounts.soort = 'ouder').

create table public.winkels (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  naam text not null check (length(btrim(naam)) between 1 and 40),
  volgorde int not null default 0,
  aangemaakt_op timestamptz not null default now()
);
create unique index winkels_naam on public.winkels (gezin_id, lower(btrim(naam)));

create table public.boodschappen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  naam text not null check (length(btrim(naam)) between 1 and 80),
  hoeveel text not null default '' check (length(hoeveel) <= 30),
  -- null = nog geen winkel gekozen; een winkel weggooien zet zijn artikels hier.
  winkel_id uuid references public.winkels (id) on delete set null,
  -- Toegevoegd vanuit het weekmenu: voor welke dag en welk gerecht.
  dag date,
  gerecht text check (length(gerecht) <= 80),
  gekocht_op timestamptz,
  gekocht_door uuid references public.gebruikers (id) on delete set null,
  aangemaakt_op timestamptz not null default now()
);
create index boodschappen_gezin on public.boodschappen (gezin_id, gekocht_op);

alter table public.winkels enable row level security;
alter table public.boodschappen enable row level security;
create policy "ouders beheren winkels" on public.winkels for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());
create policy "ouders beheren boodschappen" on public.boodschappen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and (winkel_id is null or exists (select 1 from public.winkels w where w.id = winkel_id and w.gezin_id = public.mijn_gezin())));

-- Elk gezin begint met de winkels waar de ouders nu naartoe gaan; aanpassen kan in Instellingen → Winkels.
create function public.standaard_winkels() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.winkels (gezin_id, naam, volgorde)
  select new.id, w.naam, w.nr from unnest(array['Colruyt', 'Aldi', 'Lidl', 'Albert Heijn']) with ordinality as w (naam, nr);
  return new;
end $$;
create trigger standaard_winkels after insert on public.gezinnen for each row execute function public.standaard_winkels();

insert into public.winkels (gezin_id, naam, volgorde)
select g.id, w.naam, w.nr from public.gezinnen g
cross join unnest(array['Colruyt', 'Aldi', 'Lidl', 'Albert Heijn']) with ordinality as w (naam, nr);

-- Supabase geeft nieuwe tabellen en functies standaard aan iedereen; hier enkel wat hierboven nodig is.
revoke all on public.winkels, public.boodschappen from anon, authenticated;
grant select, insert, update, delete on public.winkels, public.boodschappen to authenticated;
revoke execute on function public.standaard_winkels() from public, anon, authenticated;
