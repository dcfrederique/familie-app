# Dagelijks hoera

Gevraagd door Frederique op 25 oktober 2026: de eerste keer per dag dat een kind de app opent (startscherm `/kind/:id`),
komt er een feestelijke melding (confetti, "Hoera!") met twee dingen:

1. **Nieuw in de winkel**: de spelletjes die de ouders sinds de vorige keer vrijgaven (Kinderen → Winkelaanbod).
   Alleen spelletjes die dit kind te zien krijgt (niet voor dit kind verborgen) en nog niet gekocht heeft.
2. **Een cadeautje**: een willekeurig stuk voor het figuurtje of Mijn huis (geen spelletje, geen huid, niet de grootte
   van het huis) dat in de winkel ligt, het kind nog niet heeft en hoogstens 40 sterren kost (met de prijs die de
   ouders instelden). Het wordt meteen van het kind, gratis (aankoop met prijs 0, er gaan geen sterren af).
   Knop "Meteen aandoen" brengt het kind naar de kleerkast of het huis.

Is er niets nieuws en geen cadeau meer te geven, dan blijft de melding weg. Stukken die de ouders nog niet vrijgaven,
worden nooit cadeau.

## Techniek

- Server: `public.dagelijks_hoera(p_kind, p_kandidaten)` (migratie `20261025000400_dagelijks_hoera.sql`) geeft de eerste
  keer per Belgische dag `{nieuw: [...], cadeau: {soort, sleutel} | null}`, daarna `null`. Tabel `dagelijks_hoera` houdt per
  kind de laatste dag en tijd bij. `aanbod.vrijgegeven_op` (trigger) zegt wanneer iets vrijgegeven werd; een prijswijziging
  telt niet als nieuwe vrijgave. De eerste keer kijkt het 3 dagen terug.
- `p_kandidaten` ('soort:sleutel'): wat het kind te zien krijgt; wie niet leest ziet minder stukken (`src/data/cadeau.ts`).
- App: `src/schermen/DagelijksHoera.tsx` (+ `hoera.css`), aangeroepen in `KindStart.tsx`. Wie niet leest ziet prenten en
  hoort korte zinnen (`zin.hoeraDag`, `hoeraNieuwSpel`, `hoeraCadeau`; opnames via `scripts/maak-stem.ts`, tot dan tabletstem).
- Demo: twee spelletjes (Pompoenen maken, Basket) staan als net vrijgegeven, zodat het hoera meteen te zien is.
- Tests: `supabase/tests/dagelijks_hoera.test.sql`, `src/data/cadeau.test.ts`.
