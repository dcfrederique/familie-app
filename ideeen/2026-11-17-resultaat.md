# Resultaat 17 november 2026 (nieuwtje 0.173)

Thema: Sinterklaas, een tekening maken voor iemand anders.

## Gebouwd
- **Verhaal 85 "De tekening voor de buurvrouw"** (grote-ogen, 6 jaar, 7 bladzijden, ± 345 woorden), meteen beschikbaar.
- **Kleurplaat "De tekentafel"** (`tekentafel`, 13 vlakken, met voorbeeld), meteen beschikbaar.
- **Spelletje Gelijk plaatje** (`gelijkplaatje`, **25 sterren**, niet vrijgegeven): twee kaarten, één gelijk plaatje. De kaarten komen uit een projectief vlak (p = 2, 3, 5), dus elke twee kaarten delen precies één plaatje (getest voor alle paren).
  - Makkelijk: 3 plaatjes per kaart, 8 rondes, geen tijd, wiebel als hulp na 8 s.
  - Middel: 4 plaatjes per kaart, 10 rondes, geen tijd, licht gedraaid, 3 Tips.
  - Moeilijk: 6 plaatjes per kaart, 31 plaatjes (vorm × kleur, lokvogels), gedraaid en in wisselende grootte (0,6 tot 1,3), 15 rondes in 3 blokken met 8, 6,5 en 5 s, een foute tik kost 2 s, geen hulp of Tip, pluimen per blok (hoogstens 9).
  - Logica `src/lib/spelletjes/gelijkplaatje.ts` + 13 tests (ook dat moeilijk merkbaar zwaarder is), scherm `Gelijkplaatje.tsx`, css `twin.css`.
- **Zes stukken** (niet vrijgegeven): papieren mijter (hoofd 15), shirt met brieven (shirt 20), tekenrol (extra 15), schoenenrek (tuin 25), mandarijnboompje (tuin 20), kaartenslinger (huisextra 15). Migratie `20261117000100_gelijkplaatje.sql`.
- **Springland, De Speeldoos level 4 "Het ballerinapad"** (zacht, sneeuw, 4 slakken, gaten 2, 2 en 3, 2 vlaggetjes): het robotje haalt het in Vanzelf lopen en Zelf lopen zonder vallen. `docs/springland.md` bijgewerkt.
- Nieuwtje 0.173, e2e-test voor Gelijk plaatje. Geen gebouw in De wereld.

## Controles
- Lint, 865 unit-tests, `scripts/test-db.sh` en build groen.
- Schermcontrole `--scherm gelijkplaatje` op Luca, Yuna en Feline: 20/20 tablets en 2/2 gsm liggend (kaartgrootte op gsm en staande tablet iets verkleind na de eerste meting).

## Open
- Het spelletje en de zes stukken staan klaar om vrij te geven in Kinderen → Winkelaanbod.
