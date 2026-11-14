# Resultaat bouw 14 november 2026

Thema: Sinterklaas, het liedje voor de Sint (zingen en durven). Zaterdag: ook drie nieuwe kinderthema's.

## Gebouwd
- **Verhaal 82 "Pip zingt voor de Sint"** (grote-ogen, 6 jaar, 8 bladzijden, 468 woorden), meteen beschikbaar.
- **Kleurplaat `zingendeklas`** (15 vlakken, voorbeeld met één kleur per vlak), meteen beschikbaar.
- **Spel "Lichtstraal"** (`lichtstraal`, 30 sterren, niet vrijgegeven): spiegeltjes draaien tot alle pakjes gloeien.
  Makkelijk 4 × 4, één lantaarn, 1 tot 2 pakjes, 1 tot 3 spiegeltjes, wiebelende hulp na 10 s, geen limiet. Middel 6 × 6, 2 tot 3 pakjes, 3 tot 5 spiegeltjes, steenblokken, zes rondes, drie tips.
  Moeilijk 9 × 9, twee of drie gekleurde lantaarns, 6 tot 8 pakjes, 8 tot 10 draaispiegels plus 3 tot 4 vaste, afleiding en stenen, limiet op tikken, pluimen, geen tips. De kortste oplossing wordt exact berekend (alle standen proberen). Logica + test in `src/lib/spelletjes/lichtstraal.ts`, scherm `Lichtstraal.tsx` + `straal.css`.
- **Zes stukken** (niet vrijgegeven): koorlintje (15), koorjasje (20), notenblad (15), muziekstandaard (15), podiumpje (25), notenkrans (20); migratie `20261114000100_lichtstraal.sql`.
- **Springland: tiende wereld De Speeldoos** (nieuwe wereldstijl `speeldoos`: grond, kaartstukken, kleuren) met het zachte level **De eerste noot** (vlaggetjes op kolom 48 en 80); het robotje haalt het in Vanzelf lopen en Zelf lopen.
- **Drie kinderthema's**: Robotlab (Luca), Toverschool (Yuna), Sneeuwpret (Feline); migratie `20261114000200_themas_robotlab_tover_sneeuwpret.sql`.
- Nieuwtje 0.164.

## Afwijkingen van het plan
- Een pakje laat een straal van zijn eigen kleur **door** (hij gloeit en de straal gaat verder); alleen een pakje van een andere kleur houdt hem tegen. Zo kunnen 2 tot 3 pakjes met één lantaarn.
- Pluimen: de tikkenlimiet is de kortste oplossing plus ruimte (minstens 2, anders 35 %). 3 pluimen met hoogstens een kwart van die ruimte gebruikt, 2 met hoogstens 60 %, anders 1 (de 30 %/10 %-regel uit het plan kon niet bij een limiet van +30 %).
- Terug zet de laatste tik terug en telt die niet meer mee.

## Open
- Zie testresultaat in het bericht aan Frederique; niets bekend dat openstaat.
