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

## Fases

| Fase | Wat | Gevolg voor de kinderen |
| --- | --- | --- |
| 0 | Hotfix: grijze en gloed-gebouwen voorbakken (**klaar**, nieuwtje 0.146, 5 naar 60 beelden per seconde in de demo) | De wereld loopt vlot |
| 1 | Nieuwe tekenaanpak: atlas, adaptieve kwaliteit, prestatietest | Vlot, ook op de zwakste tablet |
| 2 | Glinsters, Schatboek, doen-knop | Elke dag iets te zoeken |
| 3 | Bewoners, Dorpsbord met opdrachtjes, dagschat | Een reden om elke dag te komen |
| 4 | Appels plukken, vissen, huisdier mee | Dingen om te doen buiten de deuren |
| 5 | Stickers en samen-opdracht, gebeurtenissen uit data, rustiger gebouwen | Samen spelen, het dorp verandert |

Elke fase is zelf af, krijgt een nieuwtje en is los terug te draaien.

## Vragen aan Frederique

1. **Dagschat in plaats van sterren.** Ik laat de wereld bewust geen sterren geven (kernregel). Akkoord dat de beloning een gratis stukje voor tuin of figuurtje is?
2. **App-tijd.** Telt de wereld zelf mee als schermtijd? Nu niet (de spelletjes in het Spellenhuis wel). Vissen en plukken lijken me gewoon wereld, dus niet.
3. **Opruimen.** Zes deuren per gebied, de rest in het Spellenhuis: ja of nee?
4. **Welke bewoners** het eerst (visser, boswachter, strandwachter) en blijft Bakker Bram?
5. **Volgorde.** Voorstel: fase 1 en 2 samen, dan 3, dan de rest.
