# Resultaat bouw 13 november 2026

Thema: Sinterklaas, de surprise (knutselen en een gedichtje schrijven).

## Gebouwd
- **Verhaal 81 "Het gedicht voor opa"** (avonturiers, 8 jaar, 8 bladzijden, 469 woorden), meteen beschikbaar.
- **Kleurplaat `knutseltafel`** (15 vlakken, voorbeeld met één kleur per vlak), meteen beschikbaar.
- **Spel "Snoepjes ruilen"** (`snoepruilen`, 30 sterren, niet vrijgegeven): drie-op-een-rij met snoepjes in eigen vormen en kleuren.
  Makkelijk 5 × 5, vier soorten, geen limiet, doelen 12 tot 28 snoepjes, wiebelende hulp na 10 s. Middel 6 × 6, vijf soorten, zes rondes met twee doelen en een zettenlimiet, strooizakjes en drie tips.
  Moeilijk 8 × 8, zes soorten, drie rondes met meerdere doelen, ijs en vastgevroren snoepjes, strakke limiet, pluimen, geen tips. Logica en test in `src/lib/spelletjes/snoepruilen.ts`; scherm `Snoepruilen.tsx` + `ruil.css`.
  Een gulzige bot met de tip haalt makkelijk altijd, middel ± 80 % en moeilijk ± 45 % van de rondes (test bewaakt dat moeilijk lager ligt dan middel).
- **Zes stukken** (niet vrijgegeven): krantenhoed (15), knutselschort (20), potlodenpot (15), surprisemand (20), knutseltafeltje (25), gedichtbrief aan de deur (15); migratie `20261113000100_snoepruilen.sql`.
- **Springland: baas Bromschoorsteen** (laatste plek van Dakenstad): schaduwen tonen waar pakjes vallen, daarna is hij moe en kwetsbaar. Het robotje verslaat hem in Vanzelf lopen en Zelf lopen. Dakenstad is nu vol: morgen begint een nieuwe wereld.
- Nieuwtje 0.161.

## Afwijkingen van het plan
- Liggende pakjes van de Bromschoorsteen zijn onschadelijke versiering en geen blokjes waar je op moet springen; ook zijn lijf doet geen pijn, alleen de vallende pakjes.
- Moeilijk ronde 3: de regel "eerste zes zetten dubbel zo duur met een strooizakje" is weggelaten (te verwarrend); de ronde is zwaar genoeg door de drie doelen, ijs en kettingen.
- De doelen van makkelijk en middel zijn na simulatie verhoogd (makkelijk 12, 16, 20, 24, 28; middel limieten 18 tot 15) omdat kettingreacties ze anders te makkelijk maakten.

## Open
- Niets.
