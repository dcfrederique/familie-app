# Resultaat bouw 5 november 2026 (Sinterklaas, het paard van de Sint)

- **Verhaal 45** "Een wortel voor het paard" (355 woorden) en **kleurplaat** "Paard op het dak" (15 vlakken): meteen beschikbaar.
- **Spel Paard op het dak** (25 sterren, niet vrijgegeven): trek een lijn over alle daken, elk dak één keer. Makkelijk: 3 × 3 tot 3 × 4 met oplichtende volgende daken en Terug. Middel: 4 × 4 tot 5 × 5 met 1 tot 3 gaten en Terug. Moeilijk: 32 tot 54 daken (6 × 6 tot 8 × 8 met 4 tot 10 gaten), genummerde schoorstenen in volgorde, ijsdaken (rechtdoor), vast eindstalletje, geen hulp en geen Terug-knop, klokje en pluimen (misstappen en tijd). Levels gemaakt door eerst een pad door alle daken te trekken; logica, oplosser en tests in `src/lib/spelletjes/daken.ts`.
- **Stukken** (niet vrijgegeven): veulenmuts, hoefijzer-shirt, wortelmandje, hooiberg, drinkbak, pakje op het dak; migratie `20261105000100_daken.sql`.
- **Springland**: De sneeuwbaas, zesde plekje van Winterbergen met een nieuw baas-`soort` (`sneeuw`, tekening in `tekenBaas` en op de landkaart); het robotje verslaat hem in beide besturingen. Winterbergen is nu vol: de volgende nacht begint een nieuwe wereld.
- **Wereld**: Dakenstal op (38,5; 21,5) met gouden rand ((55; 21,5), (62; 21,5), (26; 21) en (30; 21,5) vielen af).
