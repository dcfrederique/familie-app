# Resultaat 2026-10-30 (herfstvakantie, regendag)

Alles uit het plan (`2026-10-30.md`) is gebouwd. Verhaal en kleurplaat zijn meteen beschikbaar; het spelletje en de zes stukken staan nog niet vrijgegeven (Kinderen → Winkelaanbod). Nieuwtje 0.73.

- **Verhaal 39** "Opa bouwt een doolhof" (Grote ogen, 8 bladzijden, ± 325 woorden).
- **Kleurplaat** `regendag` "Regendag" (15 vlakken, gratis).
- **Spelletje Doolhof van de eekhoorn** (`doolhof`, **20 sterren**): sleep de eekhoorn met één vinger (of tik op een aangrenzend vakje) door een doolhof van bladerhagen naar zijn boom en pak nootjes; 4 doolhoven per spel; makkelijk 5 × 4 (2 nootjes), middel 7 × 5 (3), moeilijk 9 × 6 (4 nootjes, de boom opent pas met alle nootjes); na 6 seconden stilte licht een stukje route op. Logica en tests in `src/lib/spelletjes/doolhof.ts` (diepte-eerst-generator, elk vakje bereikbaar, route via breedte-eerst), scherm `src/schermen/Doolhof.tsx`.
- **Stukken** (migratie `20261030000100_doolhof.sql`): figuurtje Regenhoedje 15, Met paddenstoel 20, Zaklamp 15; Mijn huis Dekentent 30, Regenton 20, Windwijzer 20.
- **Springland**: de **Pepernotenbaas** (`pepernotenbaas`, zesde plekje van Pepernotenland, nieuwe baas-soort `pepernoot` met eigen tekening in `tekenBaas` en op het eilandje van de kaart). Het robotje verslaat hem in beide besturingen; Pepernotenland is nu vol, de volgende nacht begint een nieuwe wereld. `docs/springland.md` noemt de tweede baas.
- **Gebouw** De heggendoolhof in De wereld op (11,5; 11,6), gouden rand en slot (eerste kandidaat uit het plan, de kaarttests slagen).

Gecontroleerd in de browser: het doolhof (slepen, nootjes, hint, alle niveaus, tablet liggend en gsm liggend zonder scrollen), de baas in de arena en op de kaart, en de tekeningen van kleurplaat, gebouw en stukken.
