-- Trackd (Android) stuurt lopen met bron 'android' en externe_id = UUID van de loop.
alter table public.loopsessies drop constraint loopsessies_bron_check;
alter table public.loopsessies add constraint loopsessies_bron_check
  check (bron in ('manueel', 'strava', 'horloge', 'android'));

-- De app stuurt geen eigenaar of gezin mee; de databank vult ze in voor de ingelogde ouder.
alter table public.loopsessies alter column eigenaar set default public.mijn_ouder();
alter table public.loopsessies alter column gezin_id set default public.mijn_gezin();
