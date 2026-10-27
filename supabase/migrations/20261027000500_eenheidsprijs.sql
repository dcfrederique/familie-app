-- Boodschappen: de prijs mag ook per eenheid ingegeven worden (docs/boodschappen.md).
-- `prijs` blijft het totaal (eenheidsprijs × aantal, door de app berekend), zodat Uitgaven ongewijzigd optelt.

alter table public.boodschappen
  add column eenheidsprijs numeric(8, 2) check (eenheidsprijs is null or (eenheidsprijs >= 0 and eenheidsprijs < 100000)),
  add column aantal numeric(8, 3) check (aantal is null or (aantal > 0 and aantal < 100000));
