-- Gezondheid → Gewicht (docs/gewicht.md): privé per ouder. Alleen de ouder zelf leest en schrijft
-- zijn profiel en wegingen; de partner en de tablets van de kinderen zien niets (public.mijn_ouder() is null op een tablet).

-- Profiel: wat nodig is voor BMI en leeftijd, en het doelgewicht.
create table public.gezondheid_profielen (
  ouder_id uuid primary key references public.gebruikers (id) on delete cascade,
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  geboortedatum date check (geboortedatum between '1900-01-01' and current_date),
  lengte_cm numeric(4, 1) check (lengte_cm between 100 and 250),
  doelgewicht_kg numeric(4, 1) check (doelgewicht_kg between 30 and 300),
  bijgewerkt_op timestamptz not null default now()
);

-- Wegingen: een per dag; opnieuw wegen op dezelfde dag overschrijft.
create table public.wegingen (
  id uuid primary key default gen_random_uuid(),
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  eigenaar uuid not null references public.gebruikers (id) on delete cascade,
  dag date not null,
  gewicht_kg numeric(4, 1) not null check (gewicht_kg between 20 and 350),
  aangemaakt_op timestamptz not null default now(),
  unique (eigenaar, dag)
);

alter table public.gezondheid_profielen enable row level security;
alter table public.wegingen enable row level security;
create policy "ouder beheert eigen gezondheidsprofiel" on public.gezondheid_profielen for all to authenticated
  using (ouder_id = public.mijn_ouder())
  with check (ouder_id = public.mijn_ouder() and gezin_id = public.mijn_gezin());
create policy "ouder beheert eigen wegingen" on public.wegingen for all to authenticated
  using (eigenaar = public.mijn_ouder())
  with check (eigenaar = public.mijn_ouder() and gezin_id = public.mijn_gezin());

-- Supabase geeft nieuwe tabellen standaard aan iedereen; hier enkel wat hierboven nodig is.
revoke all on public.gezondheid_profielen, public.wegingen from anon, authenticated;
grant select, insert, delete on public.gezondheid_profielen, public.wegingen to authenticated;
grant update (geboortedatum, lengte_cm, doelgewicht_kg, bijgewerkt_op) on public.gezondheid_profielen to authenticated;
grant update (gewicht_kg) on public.wegingen to authenticated;
