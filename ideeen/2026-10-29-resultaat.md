# Resultaat 2026-10-29 (Halloween, verkleden)

Alles uit het plan (`2026-10-29.md`) is gebouwd. Verhaal en kleurplaat zijn meteen beschikbaar; het spelletje en de zes stukken staan nog niet vrijgegeven (Kinderen → Winkelaanbod). Nieuwtje 0.69.

- **Verhaal 38** "Lotte kiest een kostuum" (Grote ogen, 8 bladzijden, ± 355 woorden).
- **Kleurplaat** `verkleedfeest` "Verkleedfeestje" (14 vlakken, gratis).
- **Spelletje Verkleedkist** (`verkleed`, **20 sterren**): hoed, mantel en voorwerp aanpassen aan het voorbeeldkaartje; 6 rondes met vijf kostuums (heks, piraat, ridder, koningin, tovenaar); niveaus makkelijk (hoed en mantel, 3 keuzes), middel (met voorwerp), moeilijk (4 keuzes en het voorbeeld verdwijnt na 6 s, oogknop toont het 3 s). Logica en tests in `src/lib/spelletjes/verkleed.ts`, scherm `src/schermen/Verkleed.tsx`.
- **Stukken** (migratie `20261029000100_verkleedkist.sql`): figuurtje Piratenhoed 20, Met vleermuis 20, Heksenbezem 20; Mijn huis Lief spookje 25, Verkleedkist 30, Feestvlaggetjes 15.
- **Springland**: De lampionnenbrug (Pepernotenland, stijl bos, vogel, appel, pittig met `snelheid` 1.4 en twee vlaggetjes: drie smalle plankjes over een gat van 17 vakjes en een gat van 4 met planke). Het robotje speelt hem uit in beide besturingen. Pepernotenland heeft nu vijf van de zes plekjes; de volgende nacht bouwt de baas.
- **Gebouw** De verkleedtent in De wereld op (24; 11,6), gouden rand en slot. Het plan stelde eerst (56,8; 11,6) voor, maar die plek valt buiten de kaarttests; (24; 11,6) is de reserveplek uit het plan en slaagt.

Gecontroleerd in de browser: Verkleedkist op tablet liggend (alle niveaus) en gsm liggend zonder scrollen, de tekeningen van kleurplaat, tent en stukken.
