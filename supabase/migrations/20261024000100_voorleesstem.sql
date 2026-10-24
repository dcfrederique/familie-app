-- Voorleesstem per kind (docs/voorleesstem.md): de Vlaamse stemmen Dena en Arnaud afwisselend per verhaal,
-- altijd dezelfde, of de stem van de tablet. Een ouder kiest bij Kinderen (policy "ouder past profielen aan").

alter table public.gebruikers
  add column voorleesstem text not null default 'afwisselend'
    check (voorleesstem in ('afwisselend', 'dena', 'arnaud', 'tablet'));

grant update (voorleesstem) on public.gebruikers to authenticated;
