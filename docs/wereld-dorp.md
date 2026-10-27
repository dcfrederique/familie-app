# Plan: de wereld voller bouwen (dorpsindeling)

Update 27 oktober 2026: Frederique kiest **B, maar groter en open**: het dorp niet omringd door bomen, met stenen paden, kasseien, een paar geparkeerde auto's en grindpaden (routes) naar andere gebieden (Springland enzovoort), "een echte wereld, veel groter". Uitwerking in het deel "Groter geheel" onderaan; mockup `prototypes/wereld-dorp/wereld-groot.html`.

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

## Groter geheel (keuze van Frederique: B, open, veel groter)

Mockup: `prototypes/wereld-dorp/wereld-groot.html` (tabs: de hele wereld, het dorp open aan de randen); beelden in de projectmap `schermen/wereld-dorp/`.

**De hele wereld** is een raster van negen gebieden van elk ongeveer 56 × 28 tegels (samen ±168 × 84): bos, berg, platteland (boven), Springland, dorp, meer (midden), sportpark, strand en haven, stadje (onder). Vier routes (grindpaden, klassiek Pokémon-gevoel, geen autowegen) lopen vanuit het dorp naar buiten, paden verbinden de buitenste gebieden (een rondje om het hele land), een rivier loopt van de berg door het meer naar de zee en wordt met bruggen gekruist. Bushaltes zijn de snelle weg.

**Het dorp zelf** (B): plein en ring zijn kasseien, de buitenring en de uitgaande routes grindpad, in het park een stenen pad, zebrapaden, een paar geparkeerde auto's als decor, een bushalte, wegwijzers naar de andere gebieden, en geen rij bomen meer maar akkers, heggen, een stroompje en bosjes.

### Techniek (voorstel)

- **Gebieden als aparte kaarten.** **Gebieden laden apart bij het binnenlopen; het hoeft geen één geheel te zijn (Frederique, 27 oktober 2026).** Elk gebied is een eigen kaart (`src/data/gebieden.ts`: naam, ondergrondstijl, straten, plekken, poorten naar buurgebieden). Aan de rand brengt een weg of poort je naar het volgende gebied met een korte overgang (zoals de iris bij een gebouw). Zo blijft elke ondergrond een kleine bitmap (nu 2688 × 1344 maal de verfijning) en blijft het vlot op de oude tablets; één reusachtige kaart zou dat niet blijven.
- **Nieuwe ondergronden**: kasseien, stenen pad, grindpad (route), zand en gras als tegelsoorten met eigen kleur en structuur; `wegen()` in `kaart.ts` krijgt een soort per weg.
- **Auto's**: alleen geparkeerd als decor (`Ding` met voet). Er rijdt niets en er zijn geen autowegen.
- **Snel reizen**: bushalte (later fiets of trein) naar een ander gebied, naast de bestaande knop "ga naar". Wandelen blijft een keuze.
- **Live** (`live.ts`): de positie krijgt een gebied erbij; je ziet elkaar alleen in hetzelfde gebied.
- **Springland** blijft zoals het nu is: de poort in het dorp opent gewoon de bestaande wereldkaart (`SpringKaart.tsx`), terug brengt je bij de poort. Het gaat dus niet op in de wereld; de oudere zin daarover in `docs/wereld.md` vervalt.
- **Nachtroutine**: de backlog wordt per gebied. Eerst het dorp af (B), daarna elke paar dagen een nieuw gebied met een eerste kleine versie.
- **2.5D** werkt vanzelf mee (gebouwen en bomen rechtop, wegen en velden gewoon grond).

### Fases

1. `gebieden.ts` en de gebiedsoverdracht (één extra gebied als proef, bv. het bos, met een poort in het dorp).
2. Dorp naar indeling B met kasseien en asfalt, plus de nieuwe tegelsoorten.
3. Geparkeerde auto's en zebrapaden; bushalte met snel reizen.
4. Springland als poort naar de bestaande kaart, dan de andere gebieden één voor één (berg, platteland, meer, strand, sportpark, stadje).

### Open vragen

1. Welke gebieden eerst (voorstel: bos, dan Springland als gebied, dan strand)?
2. Beslist: auto's staan alleen geparkeerd, er rijdt niets.
3. Mag de nachtroutine blijven rusten tot de eerste fases staan?
