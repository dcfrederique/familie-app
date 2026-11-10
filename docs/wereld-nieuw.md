# De wereld opnieuw: het dorp leeft (concept en techniek)

Gevraagd door Frederique op 10 november 2026: de kinderen vinden de wereld niet goed genoeg, het beeld haperde te veel en er is niets te doen. Dit document is het nieuwe concept en de nieuwe technische aanpak. Mockup (speelbaar, met echte figuurtjes): `prototypes/wereld-nieuw/` en het artifact in de thread; beelden in de projectmap `schermen/wereld-nieuw/`. De wereld blijft 2D van bovenaf, tegel voor tegel lopen, in de stijl van nu (geen 3D, `CLAUDE.md`). Dit vervangt geen data: gebieden, Kaart bewerken, live lopen en `gezinnen.wereld_kaart` blijven.

## Wat er mis is (gemeten, niet geraden)

**Het haperen.** In de demo op 1024 × 600 haalde de wereld 5 beelden per seconde (de test draait zonder grafische kaart, een echte tablet doet het beter, maar de verhouding telt). Het js-werk was bijna nul (minder dan 1% van de tijd); alles ging naar het tekenen van de pixels. Twee dingen deden dat:

- `g.filter = 'grayscale(...)'` voor elk gebouw met een slotje: een canvas-filter wordt bij elk beeld opnieuw door de processor gerekend. Alleen dit uitzetten: 5 naar 60 beelden per seconde.
- `shadowBlur` voor de gouden rand van elk "nieuw" gebouw, bij elk beeld, op een groot plaatje: alleen dit uitzetten: 5 naar 14.

Bijna alle spelgebouwen zijn nieuw of nog op slot, dus bijna elk beeld betaalde dit tientallen keren. De snelle oplossing is al gedaan (zie Fase 0). Daarna blijft de vraag hoe we de wereld zo bouwen dat dit niet opnieuw kan gebeuren.

**Niets te doen.** De wereld is nu een menu in de vorm van een dorp: 25 deuren naar spelletjes, een grindpad ertussen, en buiten de deuren gebeurt niets. Een kind loopt naar een deur, kijkt naar een slotje en loopt terug. Er is geen reden om in het dorp te blijven of morgen terug te komen.

## Het concept: elke dag een beetje dorpsleven

Eén regel: binnen tien seconden lopen is er iets om naar toe te gaan, en er is niets om te lezen dat een kind van 4 niet in een prentje ziet. Niets hiervan geeft sterren, dus de kernregels (sterren alleen via goedkeuring of lerende spelletjes) blijven kloppen.

1. **Glinsters.** Elke dag liggen er twaalf glinsterende dingetjes in het dorp (bloemen, een paddenstoel, een veer): loop erover en je pakt ze. Ze zijn steeds een andere plek, elke nieuwe dag nieuwe. Een gebied heeft zijn eigen reeks van 6 (dorp: klaproos, boterbloem, viooltje, appel, vliegenzwam, blauwe veer).
2. **Mijn Schatboek.** Elk gebied is een bladzijde met 6 plekjes; wat je vond kleurt in, wat nog niet gevonden is staat als donker schaduwtje. Nieuw gevonden dingen krijgen een gouden randje. Een volle bladzijde geeft een sticker bij Mijn thema. Dat is de reden om de poorten naar het bos, het meer en de rest te nemen.
3. **Het Dorpsbord.** Op het plein hangt een bord met drie opdrachtjes per dag, op het niveau van het kind: Luca "pluk 3 appels, vang 2 vissen, vind 4 glinsters", Yuna korter, Feline "pluk een appel, aai je hondje, vind 2 glinsters", alles met een groot prentje, een luidsprekerknop en bolletjes voor de voortgang. Drie stempels = **de dagschat**: een stuk voor de tuin of het figuurtje (de gouden lantaarn in de mockup), gratis. Het bord geeft een rood uitroepteken zolang er iets open staat. Er zit geen straf in: een gemiste dag verdwijnt gewoon.
4. **Bewoners.** In elk gebied woont iemand (Bakker Bram in het dorp, later een visser, een boswachter, een strandwachter) die iets vraagt, een grapje maakt en voorleest via de luidspreker. Eigen ontwerpen, geen merken. Bram toont de opdrachtjes als prentjes met een teller.
5. **Doen-plekken.** Vlak bij de plek verschijnt één grote ronde knop met een prentje (Pluk, Vis, Praat, Aai, Bord). Geen menu's. Eerst drie: **appels plukken** (elke boom heeft er vier, daarna is hij leeg tot morgen), **vissen** in de vijver (dobber, tik als hij zakt; bij Feline een langere tijd en geen tekst), en het **hondje aaien**. Daarbovenop wat er al is: schommel, glijbaan, bal schieten.
6. **Het huisdier loopt mee.** Het huisdier uit Mijn huisdier volgt het kind door de wereld, snuffelt aan een glinster en laat zich aaien. Zo krijgt het huisdier een plek buiten het huisdierscherm.
7. **Samen.** De anderen uit het gezin zijn al live te zien. Erbij komen: zes stickers om te zwaaien (hartje, ster, lach, hoera, hallo, vraagteken) en een Dorpsbord-opdracht voor twee ("sta samen op het plein").
8. **Gebeurtenissen uit data.** Sinterklaas komt aan op het plein, het sneeuwt in december, er is een bloemenmarkt in mei. Een gebeurtenis is een rij in `src/data/dorpsleven.ts` (datums, wat er verschijnt, een opdrachtje). Dit is wat de nachtroutine kan bouwen in plaats van een gebouw per spelletje.

### Opruimen: minder deuren

De nacht plaatst al geen gebouw meer (beslist 9 november). Wat er staat blijft werken, maar de tekening wordt rustiger: een gebouw dat nog op slot is, wordt een grijs gebouwtje zonder gloed; "nieuw" wordt een klein sterretje dat op en neer springt in plaats van een gouden rand. Een gebied toont hooguit zes deuren tegelijk, de rest staat in het Spellenhuis (de spelletjes zelf verhuizen niet). Dit staat open voor Frederique, zie Vragen.

## Hoe het eruit moet zien (10 november, na de eerste mockup)

Frederique: het idee is goed, maar het moet mooier en professioneler; nu is het leeg of staan dingen wanordelijk. De mockup is daarom opnieuw getekend met zeven vaste regels. Ze gelden voor elk gebied en voor alles wat de nacht later bijmaakt.

1. **Een ontworpen plattegrond, geen strooisel.** Elk gebied heeft één duidelijk midden (in het dorp het ronde plein met de fontein), symmetrie eromheen (twee banken, twee bloembakken, vier lantaarns op de hoeken) en alles staat op het raster. Niets wordt met toeval geplaatst.
2. **Een kader.** Rondom staat een dichte bosrand in twee rijen en onderaan een haag. De wereld houdt nergens zomaar op en er is geen lege rand meer.
3. **Zones met een eigen karakter.** Boven de straat met gebouwen aan een wandelpad, in het midden het plein, linksonder de boomgaard in een wit hekje, rechtsonder de vijver met zandrand en steiger. Lege stukken gras bestaan niet: het is een pad, een perk, een bloemenwei of een zone.
4. **Eén tekenstijl.** Alles heeft dezelfde donkere inktlijn als het figuurtje, dezelfde ronde hoeken en een klein palet. Huizen, bomen en bankjes horen daardoor bij elkaar en bij het manneke.
5. **Licht van linksboven.** Elke kruin en elk dak heeft links een lichte kant en rechts een donkere, en elke schaduw valt naar rechts op de grond. Dat geeft diepte zonder 3D.
6. **Afwerking.** Daken met pannen, ramen met luiken en bloembakken, een luifel bij de bakker, vlaggetjes aan het Spellenhuis, kasseien in ringen rond de fontein, paden met een rand, bloemen in groepjes in plaats van overal.
7. **Rustige grond.** Warm grind en een zacht dambord in het gras in plaats van vlekken, zodat de dingen erop opvallen.

Dit kost niets aan snelheid: de hele grond met bosrand, schaduwen, perken en plein is één gebakken beeld.

## Alle gebieden: even vol, even getekend, overal iets te doen

Frederique (10 november): de navigatie naar de andere delen blijft, en elk deel moet even bevolkt en getekend zijn, met dingen om te doen zoals fietsen. De poorten blijven dus (loop van het pad het bos in, een wegwijzer toont waar je heen gaat) en elk gebied krijgt dezelfde vaste inhoud:

- één duidelijk midden en de zeven tekenregels van hierboven;
- één bewoner met een naam en een praatje;
- één ding om **mee te bewegen** (fiets, step, bootje, slee) en één ding om **te verzorgen of te verzamelen**;
- zes eigen glinsters voor het Schatboek en een opdrachtje voor het Dorpsbord.

| Gebied | Midden | Bewoner | Bewegen | Doen |
| --- | --- | --- | --- | --- |
| Dorp | plein met fontein | Bakker Bram | wandelen | appels plukken, vissen, kraam, huizen binnen |
| Platteland (in de mockup) | fietslus rond de wei | Boerin Roos | **fietsen**: rondje langs vier vlaggen | schapen aaien, moestuin water geven, molen |
| Bos | open plek met kampvuur | Boswachter Jef | step over het bospad | paddenstoelen en eikels zoeken, eekhoorn voeren, hut bouwen |
| Meer | steiger met bootjes | Visser Fien | roeibootje naar het eilandje | vissen, eendjes voeren, keilen |
| Berg | uitkijktoren | Herder Lowie | slee of kabelbaan naar beneden | vlieger oplaten, geitjes, kristallen zoeken |
| Strand en haven | vuurtoren | Strandwachter Nora | gocart op de dijk | schelpen graven, zandkasteel bouwen, krabben vangen |
| Sportpark | voetbalveld | Trainer Sam | skateboard op de baan | penalty's, basket, hindernisbaan met tijd |
| Stadje | marktplein | Marktvrouw Mia | tram of bus als snelreis | kraampjes, ijsje halen, duiven voeren |

Fietsen werkt zo in de mockup: bij het rek neem je een fiets, je rijdt dubbel zo snel, en elk van de vier vlaggen licht op als je erlangs komt. Bij Feline (Vanzelf lopen) volgt de fiets het pad vanzelf als ze op een vlag tikt.

De nachtroutine kan hieraan meebouwen zonder een gebouw te plaatsen: een nieuwe glinsterreeks, een opdrachtje, een dier of een gebeurtenis is telkens één rij data.

## In de huizen (gevraagd door Frederique)

Elk kind kan zijn huis binnenlopen: de deur opent een eigen kamer met dezelfde besturing. De kamer is de plek voor alles wat van het kind zelf is, en elk meubel is een ingang naar iets dat al bestaat:

| Meubel | Opent |
| --- | --- |
| Bed | Mijn dag (dagboek) |
| Kleerkast | Kleerkast van het figuurtje |
| Boekenkast | Mijn Schatboek |
| Mandje | Mijn huisdier verzorgen |
| Tekentafel | Kleurplaten en Zelf tekenen |
| Speelgoedkist | De dagschatten en cadeautjes |

Later: de kamer inrichten met stukken uit de winkel (behang, tapijt, bed), bij broer of zus op bezoek gaan (kijken, niet verplaatsen), en bij Bakker Bram of in het Spellenhuis naar binnen. Behang en beddengoed volgen de themakleur van het kind. Mijn huis (de buitenkant) blijft zoals het is.

## Twee totaal andere concepten

Frederique liet de vrijheid om iets heel anders voor te stellen. Deze twee zijn eerlijke alternatieven, geen varianten.

**B. De prentenkaart (geen vrij lopen).** Eén mooi getekende kaart zoals die van Springland. Het kind tikt op een plek, het figuurtje wandelt er zelf naartoe, en de plek opent als een groot kijkdoosbeeld (de bakkerij, de vijver, het bos) met vier of vijf dingen om op te tikken. Sterk: Feline kan alles, elk beeld kan echt prachtig zijn omdat het één tekening is, het hapert nooit en de nacht kan elke week een nieuw beeld maken. Zwak: geen joystick, dus minder het gevoel van zelf rondlopen en elkaar tegenkomen.

**C. Mijn eiland (zelf bouwen met taken).** Geen vast dorp: elk kind heeft een eigen eilandje dat groeit. Een goedgekeurde taak geeft een bouwsteen, en daarmee zet het kind zelf een boom, een schuurtje, een dier of een brug. Broer en zus komen op bezoek. Sterk: de wereld hangt aan de taken, dus helpen in huis maakt je eiland mooier, en het is nooit af. Zwak: de grootste bouw, en bouwstenen zijn een tweede beloning naast sterren, waarover jullie moeten beslissen.

**Mijn advies:** A (het dorp leeft, in de nieuwe tekenstijl, met de huizen van binnen) als basis, omdat het voortbouwt op wat de kinderen kennen en het snelst bij hen is. Uit C zou ik later één ding lenen: het dorp groeit zichtbaar mee met goedgekeurde taken (een nieuw perk, een vlaggetje, een eend in de vijver). Wil je B of C toch zien, dan maak ik er een mockup van.

## Technische aanpak

### Principe: bak wat stilstaat, teken alleen wat beweegt

| Laag | Wat | Hoe vaak |
| --- | --- | --- |
| Grond | gras, grind, kasseien, water, bloemetjes | één keer per gebied en dag/nacht, één `drawImage` per beeld |
| Vaste dingen | huizen, gebouwen, bomen, lantaarns, banken | elk soort of variant één keer naar een `ImageBitmap` of canvas (atlas); per beeld een `drawImage`, gesorteerd op diepte |
| Variaties | grijs (op slot), gouden gloed, appelboom met 0 tot 4 appels | één keer voorgebakken per variant, nooit een filter per beeld |
| Bewegend | figuurtjes, huisdier, glinsters, fonteinwater, rook | per beeld, alleen wat in beeld is |
| Dag en nacht | tint over het hele beeld | een gewone `div` met `mix-blend-mode: multiply` (de browser doet het), lantaarnlicht als voorgebakken plaatje |
| Knoppen en teksten | joystick, doen-knop, Dorpsbord, Schatboek | html boven het canvas, geen canvas-tekst |

In de mockup kost een beeld ±1 ms js, 34 dingen per beeld, en haalt 60 beelden per seconde in dezelfde test waarin de huidige wereld 5 haalde.

### Regels die het haperen buiten houden

1. Geen `ctx.filter`, geen `shadowBlur` en geen `getImageData` in de beeldlus. Varianten worden vooraf gebakken.
2. SVG-plaatjes gaan eerst één keer naar een canvas of `ImageBitmap` en worden daarna gebruikt (nu tekent de browser een `<img>` met SVG telkens opnieuw als de maat wisselt).
3. Canvas-resolutie begrensd (Q = 1 op schermen tot 1280 breed, hoogstens 1,5), grondbitmap hoogstens 2688 × 1344 en in stukken bij grotere gebieden.
4. Het beeld past zich aan: meet de gemiddelde beeldtijd; boven 24 ms eerst Q naar 1, dan vlinders en weer uit, dan 30 beelden per seconde. Een kind merkt dat niet, een traag toestel wel.
5. Staat alles stil (niet lopen, niets beweegt in beeld), dan 10 beelden per seconde; `visibilitychange` pauzeert.
6. Gebieden laden achter de overgang (bestaande iris) in stukjes van een paar milliseconden, de oude grond gaat weg.
7. Realtime blijft zoals nu (`live.ts`: pas openen als er iemand anders is).

### Een test die het bewaakt

Een Playwright-test in `e2e/` laadt De wereld, laat 3 seconden lopen zonder grafische kaart (vertraging 4×, 1024 × 600) en eist minstens 30 beelden per seconde, plus een controle dat `filter` en `shadowBlur` niet in `src/lib/wereld/` voorkomen. Zo komt een nieuw gebouw nooit meer langzaam online zonder dat de nacht het merkt.

### Gegevens

- `src/data/dorpsleven.ts`: glinsters per gebied (soort, prentje, naam), opdracht-sjablonen per niveau (kind en leeftijd), bewoners, gebeurtenissen. Alles data, geen tekst in componenten.
- Tabel `wereld_voortgang` (kind, dag, verzameld, opdrachten, schatboek, dagschat gehaald). Een functie `wereld_glinster_pakken` en `wereld_opdracht_afronden` op de server: maximaal 12 glinsters en 3 opdrachten per dag, de dagschat één keer per dag. Geen sterren, dus de puntenlog blijft ongemoeid. Migratie loopt via CI.
- Dagschat: een stuk uit de bestaande catalogus (`figuurtje_stukken`, `huis_stukken`) dat gratis in het bezit komt, net als het cadeautje in `docs/dagelijks-hoera.md`. Ouders kunnen het uitzetten bij Kinderen → Winkelaanbod.
- Proberen: nieuwe schrijfacties komen in `GEBLOKKEERD` in `src/lib/proef.tsx`.

## Zo zit het in de app (10 november 2026)

- `src/lib/dorp/kaart.ts`: de plattegrond van het dorp (36 × 26 tegels) en de kamer (12 × 8), deuren, poorten, glinsters (vast toeval per kind en dag), zuivere logica met tests (`kaart.test.ts`).
- `src/lib/dorp/stijl.ts` en `tekenen.ts`: de tekenstijl (inktlijn, licht van linksboven) en `DorpTekenaar`: grond één keer gebakken, plaatjes per ding, per beeld alleen wat beweegt. Nacht, schemer en weer met één vlak in vermenigvuldig-modus; nooit `filter` of `shadowBlur`.
- `src/lib/dorp/voortgang.ts`: glinsters en appels van vandaag en het Schatboek, op het toestel (geen sterren, dus geen server nodig). Fase 3 zet dit op de server samen met het Dorpsbord.
- `src/schermen/Dorp.tsx`: het scherm, door `Wereld.tsx` getoond voor het gebied `dorp` zolang Wereldinstellingen → Dorp op Nieuw staat (standaard). De andere gebieden en het dorp van vroeger gebruiken nog de oude tekenaar.
- Een ouder (`/ouder/wereld`) loopt bij elk kind binnen (de kamer van dat kind, meubels alleen bekijken) en gaat door alle poorten; de poort naar Springland opent `/ouder/springland` (nieuwtje 0.149).
- Fase 3 en 4 (nieuwtje 0.150): Bakker Bram (`bram` in `kaart.ts`, getekend als figuurtje met bakkersmuts), het Dorpsbord (`src/lib/dorp/opdrachten.ts`: drie opdrachtjes per dag, niveau volgens leeftijd, vast toeval per kind en dag; `src/schermen/DorpBord.tsx`), de dagschat op de server (`wereld_dagschat`, migratie 20261110000600: één gratis stuk per dag, zelfde keuze als het cadeautje van het hoera), vissen aan de steiger (`src/schermen/DorpVissen.tsx`, visje en goudvis in het Schatboek) en het huisdier dat meeloopt (plaatje uit `dierSvg`, aaien = gratis knuffel). De opdrachtjes zelf tellen op de tablet (`voortgang.ts`), want ze leveren niets op wat de server moet bewaken.
- Fase 4b, Platteland (nieuwtje 0.151): `src/lib/dorp/land.ts` (plattegrond 34 × 23, fietslus, vlaggen, wei) en `landTekenen.ts` (schuur, molen, hooi, rek, groentebak, gebakken grond). `Dorp.tsx` speelt elk gebied in de nieuwe stijl (`gebied`, lijst `NIEUWE_GEBIEDEN`); poorten en aankomst staan per scène in de data (`Scene.poorten`), glinsters per gebied (`Scene.schatten`), het Schatboek heeft een blad per gebied (`SCHATBOEK_BLADEN`). Een nieuw gebied: maker + bakfunctie + rij in `NIEUWE_GEBIEDEN` en `SCHATBOEK_BLADEN`.
- Lopen gaat in het dorp altijd tegel voor tegel. De gebouwen van de spelletjes staan niet in het nieuwe dorp (ze zitten in het Spellenhuis); Kaart bewerken werkt alleen nog voor de andere gebieden (een kindhuis dat in een ander gebied staat, verschijnt niet in het dorp).

## Fases

| Fase | Wat | Gevolg voor de kinderen |
| --- | --- | --- |
| 0 | Hotfix: grijze en gloed-gebouwen voorbakken (**klaar**, nieuwtje 0.146, 5 naar 60 beelden per seconde in de demo) | De wereld loopt vlot |
| 1 | Nieuwe tekenaanpak: atlas, adaptieve kwaliteit, prestatietest (**klaar voor het dorp**, `src/lib/dorp/tekenen.ts`, 60 beelden per seconde) | Vlot, ook op de zwakste tablet |
| 2 | Het dorp opnieuw getekend volgens de zeven regels, glinsters, Schatboek, doen-knop, appels plukken (**klaar**, nieuwtje 0.148) | Een mooi dorp met elke dag iets te zoeken |
| 2b | Huizen binnenlopen: eigen kamer met ingangen naar Kleerkast, Mijn dag, huisdier, Schatboek (**klaar**, nieuwtje 0.148) | In je eigen huis kunnen |
| 3 | Bewoners, Dorpsbord met opdrachtjes, dagschat (**klaar voor het dorp**, nieuwtje 0.150) | Een reden om elke dag te komen |
| 4 | Appels plukken, vissen, huisdier mee (**klaar**, nieuwtje 0.150) | Dingen om te doen buiten de deuren |
| 4b | De andere zeven gebieden één voor één hertekenen en bevolken (Platteland met fietsen eerst; **Platteland klaar**, nieuwtje 0.151) | Overal iets te doen |
| 5 | Stickers en samen-opdracht, gebeurtenissen uit data, rustiger gebouwen | Samen spelen, het dorp verandert |

Elke fase is zelf af, krijgt een nieuwtje en is los terug te draaien.

## Vragen aan Frederique

1. **Dagschat in plaats van sterren.** Ik laat de wereld bewust geen sterren geven (kernregel). Akkoord dat de beloning een gratis stukje voor tuin of figuurtje is?
2. **App-tijd.** Telt de wereld zelf mee als schermtijd? Nu niet (de spelletjes in het Spellenhuis wel). Vissen en plukken lijken me gewoon wereld, dus niet.
3. **Opruimen.** Zes deuren per gebied, de rest in het Spellenhuis: ja of nee?
4. **Welke bewoners** het eerst (visser, boswachter, strandwachter) en blijft Bakker Bram?
5. **Volgorde.** Voorstel: fase 1 en 2 samen, dan 2b en 3, dan de rest.
6. **Tekenstijl.** Akkoord met de nieuwe look (inktlijn, warm grind, bosrand)? Dan worden de acht bestaande gebieden zo hertekend.
7. **Concept.** A zoals voorgesteld, of eerst B of C als mockup zien?
