# Resultaat bouw 15 november 2026 (nieuwtje 0.166)

Thema: Sinterklaas, de lichtjes aan het huis.

## Gebouwd
- **Verhaal** "De lichtjes in de knoop" (nr 83, reeks avonturiers, 8 jaar, 8 bladzijden, ± 420 woorden), meteen beschikbaar.
- **Kleurplaat** `lichtjeshuis` "Het huis met lichtjes" (15 vlakken, ingekleurd voorbeeld), meteen beschikbaar.
- **Spelletje Draden ontwarren** (`ontwarren`, **30 sterren**, niet vrijgegeven): sleep lampjes tot geen draad nog over een andere ligt.
  Logica `src/lib/spelletjes/ontwarren.ts` (zuiver, met vervangbare Willekeur; borden eerst planair getekend en dan door elkaar gelegd, dus altijd oplosbaar),
  data `src/data/ontwarren.ts`, scherm `src/schermen/Ontwarren.tsx` + `draad.css` (slepen met pointer events).
  - Makkelijk: 5 tot 7 lampjes, 6 tot 10 draden, vijf rondes, wiebelend lampje na tien seconden.
  - Middel: 8 tot 10 lampjes, 12 tot 19 draden, zes rondes, drie tips per ronde (lampje wiebelt en het doel verschijnt).
  - Moeilijk: 16, 18 en 20 lampjes met 32, 36 en 42 draden, 4, 5 en 6 vaste lampjes met slotje, limiet van 18, 20 en 21 sleepbewegingen, geen hulp en geen teller van de kruisingen, pluimen 3/2/1.
  - Tests: 12 stuks (kruisen, 40 zaden × alle rondes van alle niveaus geldig/verbonden/oplosbaar, limiet haalbaar, pluimen, moeilijk merkbaar zwaarder), plus een e2e-test voor het slepen.
- **Zes stukken** (niet vrijgegeven): opapet (hoofd 15), gebreide trui (shirt 20), haspel met touw (extra 15), ladder met lamp (tuin 20), struik met lampjes (tuin 20), raamslinger van sterretjes (huisextra 15). Migratie `20261115000100_ontwarren.sql` (check, omschrijving, `spel_prijzen`, `figuurtje_stukken`, `huis_stukken`).
- **Springland**: tweede level van De Speeldoos, `tandwielpad` "Het tandwielpad" (stijl weide, vier egels, gaten 3/2/3, springveer, twee vlaggetjes). Het robotje haalt het in Vanzelf lopen en Zelf lopen. docs/springland.md bijgewerkt.
- Geen gebouw in De wereld en geen weekthema's (zondag).

## Afwijkingen van het plan
- De hoge plank boven de springveer staat op rij 4 (plan: hoger dan de sprong). Op rij 5 blokkeerde ze in Vanzelf lopen de sprong over het gat van 2 vlak erna.
- Het kleurplaatvoorbeeld heeft kleuren naar eigen keuze; de vlakken volgen de schets van het plan.
