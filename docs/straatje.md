# Use case: Ons straatje

Status: idee van de kinderen (25 oktober 2026), nog niet in de app gebouwd. Alleen een ontwerp en een klikbaar prototype: `prototypes/straatje.html` (ook online: https://claude.ai/artifact/8yr9BdZx2BcZFZoSvmWiD8). Screenshots staan in de projectmap onder `schermen/straatje/`.

## Doel

De kinderen willen in Mijn huis (`docs/huis.md`) rondlopen en bij elkaar op bezoek gaan. "3D" betekent voor hen niet echt 3D, maar zoals Pokémon vroeger op de Game Boy: een bovenaanzicht waarin hun eigen figuurtje rondloopt. Ons straatje is dat dorpje: de huizen van Luca, Yuna en Feline naast elkaar, met daaromheen een speelplein, een vijver en een voetbalveldje. De kinderen mogen er zelf dingen neerzetten.

Het is geen spelletje om sterren mee te verdienen. Het is een plek om te zijn, en de reden om het huis en het figuurtje mooi te maken (en daarvoor sterren te sparen).

Feedback van Frederique (25 oktober 2026), verwerkt in het prototype:

- Het camerastandpunt is goed, maar de stijl moet meer die van de app zijn. De eerste versie in pixelstijl is vervangen: huizen, figuurtjes en tuinstukken worden nu getekend met **dezelfde tekencode als Mijn huis** (`src/lib/huis/tekenen.ts`, `src/lib/figuurtje/tekenen.ts`), met dezelfde kleuren, Baloo 2 en Nunito en afgeronde knoppen.
- De kinderen moeten zelf dingen in de wereld kunnen plaatsen (zie "Zelf bouwen").
- Fase 1 is niet live, fase 2 wel.
- Besturen met een **joystick** in plaats van toetsen: dat kennen de kinderen van andere spelletjes.
- Fase 3: de ouders zetten hun eigen huis er ook bij.

## Fases

| Fase | Wat | Wat het vraagt |
| --- | --- | --- |
| 1 | Elk kind loopt alleen door de straat, gaat zijn eigen huis binnen en bezoekt dat van een broer of zus (die staat dan "thuis"). Zelf bouwen. Speelplein, vijver, voetbalveld. Niet live. | Alleen leesrecht op elkaars huis en figuurtje; opslaan van geplaatste dingen. |
| 2 | Live: je ziet elkaar echt rondlopen met naam, en kunt elkaar aanspreken. De wip en de schommel worden leuker met twee. | Supabase Realtime-presence (positie per kind), omgaan met tablets die slapen of wegvallen. |
| 3 | Mama en papa hebben ook een huis, aan het einde van de straat, met een eigen tuin en kamer. | Ouders krijgen een Mijn huis en een figuurtje in de straat (nu hebben alleen kinderen een huis). |

## Wat het prototype laat zien

| Onderdeel | Hoe het werkt |
| --- | --- |
| Straat | Bovenaanzicht, wereld van 56 × 28 tegels, camera volgt het figuurtje. Alles is glad getekend in de vlakke stijl van de app. |
| Figuurtje | Het eigen figuurtje (uit de catalogus) loopt, wiebelt een beetje en spiegelt naar links en rechts. |
| Huizen | Getekend uit de echte Mijn huis-keuzes: grootte (ook groot huis en torenhuis), dak, muren, deur, ramen en extra's (schoorsteen met rook, vlag, lichtjes, bloembakken, hekje). Wie zijn huis laat groeien ziet het meteen in de straat. De keuzes van Luca, Yuna en Feline zijn voorbeelden. |
| Besturen | Joystick: sleep in elke richting, hoe verder hoe sneller. Of tik op de grond, dan loopt het figuurtje zelf de weg. Tik op een deur om binnen te gaan. De A-knop spreekt aan (bank, dino, brievenbus, andere kinderen). Op een computer werken ook pijltjes of WASD. |
| Eigen huis binnen | Een fade naar "Jouw kamer" met bed, boekenkast, raam met uitzicht op de straat, kleed en een eigen spulletje. Over de deurmat naar buiten. |
| Bij een ander op bezoek | Eerst "Tok tok!", dan in de kamer van de broer of zus, waar die staat en je verwelkomt. Je kunt hun spulletjes bekijken. Niets kan kapot of verplaatst worden. |
| Zelf bouwen | Zie het volgende stuk. |
| Speelplein | Schommel (het figuurtje gaat zitten en zwaait hoger), glijbaan, wip, zandbak, trampoline (springen). Dezelfde stukken kan een kind ook zelf neerzetten. |
| Vijver, bank, voetbalveldje | Vijver met eendjes en lelieblaadjes, een bank, een veldje met twee doelen en een bal. |
| Dag en nacht | 's Nachts krijgt de straat een blauwe gloed, de ramen gaan branden en de lantaarns geven licht. Koppelen aan het donkere thema van het kind. |
| Voor wie niet leest | Praatjes tonen voor Feline een rijtje prentjes in plaats van tekst, met een voorleesknop (zoals elders in de app). |
| Fase 2 en 3 | Twee vinkjes bovenaan laten een voorproefje zien: de andere kinderen lopen rond met naam, en de ouders hebben een huis aan het einde van de straat. |

Wat het prototype **niet** doet: opslaan, echte data, geluid, meer dan één kamer per huis, de ouders zelf laten lopen.

## Zelf bouwen

Het kind tikt op **Zelf bouwen**. Onder het scherm verschijnt een lade met stukken; boven in de straat zie je met een stippellijn waar het eigen stuk grond ligt.

- **Welke stukken**: de tuinstukken uit Mijn huis (boom, bloemen, zandbak, schommel, voetbaldoel, konijnenhok, trampoline, raceauto, moestuin, hondenhok, zwembadje, dino, pompoenen, vogelverschrikker). Wat het kind nog niet gekocht heeft, staat op slot met de prijs in sterren, zoals in de winkel (`docs/winkel.md`). Alles wat in Mijn huis in de tuin staat, staat in het straatje al als gewoon verplaatsbaar stuk. Drie nieuwe voorstellen (bank, lantaarn, vogelhuisje) staan er met een "idee"-label.
- **Plaatsen**: een stuk kiezen en op het gras tikken. Het spookbeeld toont groen waar het mag en rood waar niet (op de weg, in het water, op een ander stuk, op de speelplaats van een ander).
- **Verplaatsen** en **Weghalen**: alleen eigen stukken. Wat er altijd staat (bomen, speelplein, lantaarns) kan niet weg.
- **Waar**: in de eigen tuin en op de gewone plekken. Niet in de tuin van een ander (die wordt grijs getoond).
- **Hoeveel**: voorstel 12 plekjes per kind, zodat de straat niet vol raakt.
- Bouwen kan alleen buiten en tijdens het bouwen kun je gewoon blijven lopen met de joystick.

Open ontwerpkeuze: willen we daarnaast ook een gezamenlijke plek (een plein) waar alle kinderen samen bouwen? In het prototype mag het ook op de gewone plekken, maar die plekken zijn nu van niemand.

## Voorstel voor de app

### Waar

- Op het startscherm van elk kind komt de huisknop (Mijn huis) naast het figuurtje al voor. Daar komt een tweede ingang bij: **Ons straatje**. Uit Mijn huis kom je er ook met "Naar buiten". Je start altijd voor je eigen deur.
- Route `/kind/:id/straatje`, scherm `src/schermen/Straatje.tsx`. Het canvas tekent zelf, zoals Springland (`docs/springland.md`) en Penalty's.
- Gsm van een ouder: `/ouder/straatje`, zoals Springland. In fase 3 loopt een ouder met het eigen figuurtje.

### Besturing

- Joystick (in de hoek, met de A-knop aan de andere kant), plus tikken op de grond. Voor Feline mag de joystick groter en trager. De bestaande instelling uit Springland (Vanzelf lopen of Zelf lopen, per kind) kan hier ook gelden: bij Vanzelf lopen alleen tikken.
- Geen verliezen, geen tijd, geen sterren die op het spel staan. Wie nergens heen wil, staat gewoon stil.

### Wat het kind ziet van elkaar

De huizen komen **altijd** uit de echte gegevens (`gebruikers.huis` en `gebruikers.figuurtje`). Dat vraagt leesrecht van een kind op de huis- en figuurgegevens van de gezinsleden. Dat is nu al zo voor Wie speelt er? (figuurtje); voor het huis komt er een RLS-regel of een RPC `straatje_lezen()` die per gezinslid enkel `id, naam, huis, figuurtje` en de geplaatste stukken teruggeeft.

Bezoeken is altijd veilig: de binnenkant van een ander huis is **alleen om naar te kijken**. Er wordt niets aangepast, en niets wat een broer of zus bouwde kan kapot.

### Opslag van het gebouwde

Tabel `straatje_stukken` (`id`, `gebruiker_id`, `stuk`, `x`, `y`, aangemaakt). Alleen de eigenaar schrijft (RPC met de controles: grid, plekken van een ander, maximum, het stuk is gekocht). Alle gezinsleden lezen. Het stuk staat op een raster van een halve tegel, zodat botsingen en de server altijd hetzelfde rekenen. Nieuwe stukken in de winkel verschijnen zo ook in het straatje zonder extra werk.

### Fase 2: live

Supabase Realtime-presence laat per kind de positie zien (x, y, richting), ongeveer vijf keer per seconde, geïnterpoleerd op het scherm. Een kind dat de app sluit of waarvan de tablet slaapt verdwijnt na een paar seconden. Zonder live ziet het kind de anderen "thuis" in hun huis, zoals in fase 1. Het verkeer is klein (drie kinderen), maar de bouwregels en het wegvallen vragen testwerk.

### Fase 3: de ouders

Ouders krijgen hetzelfde huis- en figuurtje-systeem als de kinderen (er is nu alleen een figuurtje in de ouder-chat), met een eigen huis aan het einde van de straat. De kinderen zien hun huis en kunnen op bezoek; de ouders kunnen met hun gsm door de straat. Een ouderkamer kan later het prikbord (taken, notities, weekmenu) tonen. Een open vraag is of het ouderhuis ook door de kinderen ingericht mag worden of alleen door de ouders.

### Binnenkant

In het prototype heeft elk huis één kamer met vaste meubels. Voorstel voor de app, in stappen:

1. Eén vaste kamer per huis (zoals het prototype), kleuren van de muren volgen het huis. Een eigen spulletje volgt het thema (voetbal, kroon, knuffel).
2. Later: kamers die meegroeien met het huismodel (een verdieping erbij = een trap), en een **kamer inrichten** met meubels die je met sterren koopt. Dit is dan een uitbreiding van Mijn huis, niet van het straatje.

### Dorpsdingen en ideeën

| Idee | Hoe |
| --- | --- |
| Speelplein | Schommel, glijbaan, wip, zandbak, trampoline. Voor de wip: samen met een ander kind (fase 2). |
| Vijver met eendjes | Rustig kijken. Eendjes zwemmen vanzelf rond. |
| Voetbalveldje | Bal wegschieten. Past bij het voetbalthema en bij Penalty's. |
| Brievenbus | Elk huis heeft er een. Idee: een kind legt een tekening of een kort bericht in de brievenbus van een ander (zie `docs/chat.md` voor de moderatie die nodig is). |
| Winkeltje | Een winkel waar het kind de bestaande winkel (`docs/winkel.md`) in loopt, in plaats van een lijst. Een mooie latere stap. |
| Seizoenen | Sneeuw in december, bladeren in oktober. Bij seizoenen van Mijn huis (staat al op de lijst). |

### Technisch

- Canvas van 960 × 640 (scherp op 1,5×). De ondergrond (gras, wegen, zand, vijver, bloemetjes) wordt één keer in een groot plaatje getekend en daarna verschoven. Huizen, figuurtjes en tuinstukken komen als SVG uit de bestaande tekenfuncties en worden als plaatje in een cache gezet. Nieuwe huisstukken en kleren verschijnen zo vanzelf in het straatje.
- Het prototype bundelt die tekencode met esbuild (`entry.ts` met `tekenHuis`, `tuinStuk`, `huisUitsnede`, `tekenFiguurtje`, `volledigeUitsnede` en `huisCategorieen`) en plakt de bundel bovenaan `prototypes/straatje.html`. In de app importeert het scherm die functies gewoon.
- Botsing en route: rechthoeken voor huizen en stukken, een ellips voor de vijver, en een raster van 24 px waarop een breedte-eerst-zoekactie het pad vindt bij tikken op de grond.
- Beweging: de joystick geeft een vector (diepte bepaalt de snelheid), toetsen geven een eenheidsvector. Het figuurtje glijdt langs obstakels.
- Positie wordt niet opgeslagen: je start altijd voor je eigen deur.
- `prefers-reduced-motion`: geen rook, eendjes blijven stilstaan.
- Tests: robot die van de deur van elk huis naar elke andere deur en terug kan lopen (zoals `springen.test.ts`), een test dat elk huis dat Mijn huis kan maken ook in het straatje getekend kan worden, en een test op de bouwregels (raster, plekken van een ander, maximum, gekocht).

### Nieuw in de app

Bij de bouw komt er een nieuwtje bij in `src/data/nieuwtjes.ts` (de vaste regel in `CLAUDE.md`), met een stijgende versie.

## Open vragen voor Frederique en de kinderen

1. Bouwen overal buiten de tuin van een ander, of ook een gezamenlijk plein? En is 12 plekjes per kind goed?
2. Mogen de kinderen elkaars huis altijd binnen, of moet de eigenaar dat per huis aan of uit kunnen zetten ("ik wil even alleen")?
3. Moet Ons straatje bij het gewone speelaanbod (winkel, prijs) horen of altijd gratis zijn zodra Mijn huis er is? Voorstel: altijd gratis, maar een ouder kan het per kind verbergen in Winkelaanbod.
4. Welke dorpsdingen eerst: speelplein en vijver zoals nu, of liever winkeltje, voetbalveld of brievenbus?
5. Fase 3: mogen de kinderen het ouderhuis inrichten, of alleen de ouders?
