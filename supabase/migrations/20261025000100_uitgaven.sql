-- Uitgaven (docs/boodschappen.md): na de boodschappen vul je de prijs in en elk artikel krijgt een categorie.
-- Het overzicht per maand, winkel en categorie rekent op wat gekocht is (gekocht_op) en een prijs heeft.
-- Alleen voor de ouders, zoals de rest van de boodschappen.

create table public.categorieen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  naam text not null check (length(btrim(naam)) between 1 and 40),
  volgorde int not null default 0,
  aangemaakt_op timestamptz not null default now()
);
create unique index categorieen_naam on public.categorieen (gezin_id, lower(btrim(naam)));

alter table public.categorieen enable row level security;
create policy "ouders beheren categorieen" on public.categorieen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());

alter table public.boodschappen
  -- Een categorie weggooien zet haar artikels terug op "geen categorie".
  add column categorie_id uuid references public.categorieen (id) on delete set null,
  add column prijs numeric(8, 2) check (prijs is null or (prijs >= 0 and prijs < 100000));
create index boodschappen_gekocht on public.boodschappen (gezin_id, gekocht_op) where gekocht_op is not null;

-- Het artikel mag enkel een categorie van het eigen gezin krijgen.
drop policy "ouders beheren boodschappen" on public.boodschappen;
create policy "ouders beheren boodschappen" on public.boodschappen for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account()
              and (winkel_id is null or exists (select 1 from public.winkels w where w.id = winkel_id and w.gezin_id = public.mijn_gezin()))
              and (categorie_id is null or exists (select 1 from public.categorieen c where c.id = categorie_id and c.gezin_id = public.mijn_gezin())));

-- Elk gezin begint met een lijst categorieën; aanpassen kan in Instellingen → Winkels en categorieën.
create function public.standaard_categorieen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categorieen (gezin_id, naam, volgorde)
  select new.id, c.naam, c.nr from unnest(array[
    'Groenten en fruit', 'Vlees en vis', 'Zuivel en eieren', 'Brood en ontbijt', 'Droge voeding', 'Diepvries',
    'Dranken', 'Snoep en koeken', 'Huishouden', 'Verzorging', 'Andere']) with ordinality as c (naam, nr);
  return new;
end $$;
create trigger standaard_categorieen after insert on public.gezinnen for each row execute function public.standaard_categorieen();

insert into public.categorieen (gezin_id, naam, volgorde)
select g.id, c.naam, c.nr from public.gezinnen g
cross join unnest(array[
  'Groenten en fruit', 'Vlees en vis', 'Zuivel en eieren', 'Brood en ontbijt', 'Droge voeding', 'Diepvries',
  'Dranken', 'Snoep en koeken', 'Huishouden', 'Verzorging', 'Andere']) with ordinality as c (naam, nr);

revoke all on public.categorieen from anon, authenticated;
grant select, insert, update, delete on public.categorieen to authenticated;
revoke execute on function public.standaard_categorieen() from public, anon, authenticated;
