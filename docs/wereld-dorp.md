# Plan: de wereld voller bouwen (dorpsindeling)

Status: voorstel van 27 oktober 2026, op vraag van Frederique ("de wereld wat meer vol gebouwd, meer straten en ronddwaalmogelijkheden"). Niets gebouwd. Mockup met drie indelingen: `prototypes/wereld-dorp/dorp.html` (online als artifact), beelden in de projectmap `schermen/wereld-dorp/`. Bouwt voort op `docs/wereld-levendig.md` (stap 5 huizen spreiden en stap 6 stad uitbouwen) en blijft 2D van bovenaf (`docs/wereld.md`, `docs/wereld-25d.md` is de schuine weergave van dezelfde kaart).

## Drie indelingen (zelfde kaart van 56 × 28 tegels)

| | A · Raster | B · Dorpsplein met ringweg (voorstel) | C · Slingerweg met hofjes |
| --- | --- | --- | --- |
| Idee | Hoofdstraat zoals nu, een straat erboven en eronder, vier dwarsstraten | Plein met fontein in het midden, ringweg, vier spaken, buitenring | Eén slingerende weg met zijpaadjes naar hofjes, park met vijver, bosrondje |
| Rondjes om te dwalen | elk blokje, plus één grote lus | plein, buitenring, de vier hoeken | hofjes, parkrondje, bosrondje |
| Voor Feline (4) | heel duidelijk | heel duidelijk ("alles ligt rond het plein") | minder overzichtelijk |
| Bouwen | eenvoudig (straten zijn rechthoeken) | eenvoudig (rechthoeken, hoeken als tekening afgerond) | moeilijker (kromme wegen vragen een tegelkaart) |

Voorstel: **B**. Het is het makkelijkst te onthouden, heeft een duidelijk hart voor gezelligheid, en groeit naar buiten (buitenring uitbreiden). A is de veilige tweede keus.

## Wat er in elke indeling staat

De drie huizen van de kinderen (met hun eigen Mijn huis) en een ouderhuis, de bestaande gebouwen (winkel, spellenhuis, bladerhuisje, eekhoornboom, bouwplaats), speelplein, voetbalveld, vijver en park. Nieuw als decor, in de volgorde van de backlog in `docs/wereld-levendig.md`: bakker, café, bibliotheek, brandweerkazerne, kerkje, marktplein, boerderij, sporthal, bushalte, fontein. Daarnaast zes tot zeven vrije plekken (gestippeld) voor wat de nachtroutine nog bedenkt.

## Fases

1. **Kaartgegevens in één bestand** (`src/data/dorp.ts`): straten als rechthoeken, huisplekken, gebouwplekken, parken en vrije plekken, met per plek een naam en een `wijk`. `wegen()` en `deurVan()` in `kaart.ts` lezen daaruit in plaats van vaste getallen. Platte en 2.5D-weergave lezen hetzelfde. `kaart.test.ts` blijft: alles bereikbaar, niets op een pad.
2. **Verplaatsen wat er staat** (stap 5 van het levendige-wereldplan): de huizen naar hun plek in de gekozen indeling, de wegen erbij, plein en vijver op hun nieuwe plaats.
3. **Eerste uitbreiding**: het plein of park en de eerste winkels als decor met bordje.
4. **Rondjes en kleine dingen**: bankjes, bruggetje over de vijver, bushalte, fontein, zebrapad.
5. **Nachtroutine** vult elke nacht één vrije plek uit de lijst, volgorde: eerst dicht bij het plein.
6. **Snelreizen**: een knop "ga naar" (thuis, winkel, spellenhuis) en een kleine kaart, zodat een groter dorp niet lastig wordt voor Feline.

De kaart blijft 56 × 28 zolang het past. Bij uitbreiding naar buiten (bv. 72 × 40) moet de ondergrond in stukken getekend worden, want de bitmap is nu 2688 × 1344 maal de verfijning.

## Wat dit betekent voor de nachtroutine (06:07)

De routine werkt nu van een vrije lijst in `docs/wereld-levendig.md`. Zolang er geen indeling gekozen is, kan een nieuw stuk op een plek terechtkomen die in de gekozen indeling iets anders wordt. Voorstel: de routine tijdelijk laten rusten tot Frederique kiest, of alleen kleine losse dingen laten bouwen (bankjes, bloemperken). Na de keuze verwijst de backlog naar de vrije plekken van de gekozen indeling.

## Open vragen

1. Welke indeling: A, B of C?
2. Blijft de kaart 56 × 28 of mag hij groter?
3. Mag de nachtroutine tot de keuze rusten?
