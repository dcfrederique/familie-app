-- Lopen in de wereld per kind: tegel voor tegel (zoals de eerste Pokémon-spellen, standaard) of vrij. Een ouder kiest bij Kinderen
-- (policy "ouder past profielen aan", zoals de voorleesstem).

alter table public.gebruikers
  add column wereld_lopen text not null default 'tegel'
    check (wereld_lopen in ('tegel', 'vrij'));

grant update (wereld_lopen) on public.gebruikers to authenticated;
