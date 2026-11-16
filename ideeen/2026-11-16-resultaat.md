# Resultaat bouw 16 november 2026 (nieuwtje 0.171)

Thema: Sinterklaas, speculaas bakken met mama.

## Gebouwd
- **Verhaal** "Pip bakt speculaas" (nr 84, reeks kleine-oortjes, 4 jaar, ± 324 woorden), meteen beschikbaar. **Afwijking:** de reeks Kleine oortjes laat hoogstens 4 bladzijden toe (`verhalen.test.ts`), dus staat het plan van 8 bladzijden samengevoegd tot 4 (twee delen per bladzijde, zelfde tekst).
- **Kleurplaat** `koekjesplaat` "De koekjesplaat" (14 vlakken, ingekleurd voorbeeld), meteen beschikbaar.
- **Spelletje Rode en groene pakjes** (`pakjesrij`, **30 sterren**, niet vrijgegeven): een takuzu. Logica `src/lib/spelletjes/pakjesrij.ts` (oplosser met afleidingsregels en terugkeren; elk bord heeft precies één oplossing, nagerekend: het aantal borden van 4 × 4 klopt met alle 65536 mogelijkheden), data `src/data/pakjesrij.ts`, scherm `src/schermen/Pakjesrij.tsx` + `prij.css`.
  - Makkelijk: 4 × 4 en 6 × 6, vijf rondes, bijna de helft ingevuld, een pakje dat niet past wiebelt weg, doorzichtig hulppakje na tien seconden.
  - Middel: 6 × 6 en 8 × 8, zes rondes, overtredingen krijgen een rood randje, drie tips, Terug.
  - Moeilijk: 8 × 8 en 10 × 10, 24 tot 30 % ingevuld, extra regel (geen gelijke rijen of kolommen), geen hulp, geen waarschuwingen, controle pas bij een vol bord, pluimen 3/2/1. Moeilijke borden zijn niet met de eenvoudige regels alleen af te werken (test: minstens de helft).
  - Tests: 12 stuks; plus een e2e-test.
- **Zes stukken** (niet vrijgegeven): koekjeskroon (hoofd 15), badjas (shirt 20), ovenwant (extra 15), sleetje met pakje (tuin 25), wensster op een paal (tuin 20), kaars in het raam (huisextra 15). Migratie `20261116000100_pakjesrij.sql`.
- **Springland**: derde level van De Speeldoos, `trommelrol` "De trommelrol" (pittig, stijl bos, vijf vogels met snelheid 1,3, gaten 3/2/2/3, muurtje van twee, springveer met hoog plankje, twee vlaggetjes). Het robotje haalt het in Vanzelf lopen en Zelf lopen. docs/springland.md bijgewerkt.
- Geen gebouw in De wereld en geen weekthema's (maandag).

## Afwijkingen van het plan
- Het gat van 4 werd een gat van 3 (en de vogels staan iets verder van de gaten, het eerste vlaggetje op kolom 34): met de plaatsing uit het plan viel het robotje meermaals in een gat. Het level blijft pittig door de twee gaten van 2 vlak na elkaar en de snelle vogels.
- De vakjes van het bord zijn op 10 × 10 kleiner dan 64 px (met opzet, zie het plan).
