-- Lopen: analyse, doelen, schoenen en loopschema (docs/loop-analyse.md). Alles privé per ouder, zoals loopsessies.

-- Doelen: een waarde per soort (km per maand, km per jaar, lopen per week).
create table public.loopdoelen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  eigenaar uuid not null references public.gebruikers (id) on delete cascade,
  soort text not null check (soort in ('km_maand', 'km_jaar', 'lopen_week')),
  waarde numeric(7, 1) not null check (waarde > 0 and waarde <= 100000),
  unique (eigenaar, soort)
);

-- Schoenen: kilometers tellen we uit de lopen, met een startstand voor wat er al op zat.
create table public.loopschoenen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  eigenaar uuid not null references public.gebruikers (id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 60),
  start_km integer not null default 0 check (start_km between 0 and 20000),
  max_km integer not null default 700 check (max_km between 100 and 5000),
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);
alter table public.loopsessies add column schoen_id uuid references public.loopschoenen (id) on delete set null;

-- Loopschema: één per ouder. De weken worden in de app uit deze vier waarden berekend, zodat een aanpassing alles meeschuift.
create table public.loopschemas (
  ouder_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  doel_km numeric(4, 1) not null check (doel_km between 3 and 50),
  per_week smallint not null check (per_week between 2 and 4),
  start_dag date not null,
  start_km numeric(4, 1) not null check (start_km between 0.5 and 50),
  aangemaakt_op timestamptz not null default now()
);

alter table public.loopdoelen enable row level security;
alter table public.loopschoenen enable row level security;
alter table public.loopschemas enable row level security;
create policy "ouder beheert eigen loopdoelen" on public.loopdoelen for all to authenticated
  using (eigenaar = public.mijn_ouder()) with check (eigenaar = public.mijn_ouder() and gezin_id = public.mijn_gezin());
create policy "ouder beheert eigen loopschoenen" on public.loopschoenen for all to authenticated
  using (eigenaar = public.mijn_ouder()) with check (eigenaar = public.mijn_ouder() and gezin_id = public.mijn_gezin());
create policy "ouder beheert eigen loopschema" on public.loopschemas for all to authenticated
  using (ouder_id = public.mijn_ouder()) with check (ouder_id = public.mijn_ouder() and gezin_id = public.mijn_gezin());

revoke all on public.loopdoelen, public.loopschoenen, public.loopschemas from anon, authenticated;
grant select, insert, delete on public.loopdoelen, public.loopschoenen, public.loopschemas to authenticated;
grant update (waarde) on public.loopdoelen to authenticated;
grant update (naam, start_km, max_km, actief) on public.loopschoenen to authenticated;
grant update (doel_km, per_week, start_dag, start_km) on public.loopschemas to authenticated;
grant update (schoen_id) on public.loopsessies to authenticated;

-- Een loop mag enkel een schoen van de eigenaar zelf hebben.
create function public.loopsessie_schoen_controle() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.schoen_id is not null
     and not exists (select 1 from public.loopschoenen s where s.id = new.schoen_id and s.eigenaar = new.eigenaar) then
    raise exception 'schoen hoort niet bij deze ouder';
  end if;
  return new;
end $$;
create trigger loopsessie_schoen_controle before insert or update of schoen_id on public.loopsessies
  for each row execute function public.loopsessie_schoen_controle();
