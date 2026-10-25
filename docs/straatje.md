# Use case: Ons straatje

Status: idee van de kinderen (25 oktober 2026), nog niet in de app gebouwd. Alleen een ontwerp en een klikbaar prototype: `prototypes/straatje.html` (ook online: https://claude.ai/artifact/8yr9BdZx2BcZFZoSvmWiD8). Screenshots staan in de projectmap onder `schermen/straatje/`.

## Doel

De kinderen willen in Mijn huis (`docs/huis.md`) rondlopen en bij elkaar op bezoek gaan. "3D" betekent voor hen niet echt 3D, maar zoals Pokémon vroeger op de Game Boy: een bovenaanzicht met tegels waarin hun eigen figuurtje rondloopt. Ons straatje is dat dorpje: de huizen van Luca, Yuna en Feline naast elkaar, met daaromheen een speelplein, een vijver en een voetbalveldje.

Het is geen spelletje om sterren mee te verdienen. Het is een plek om te zijn, en de reden om het huis en het figuurtje mooi te maken (en daarvoor sterren te sparen).

## Wat het prototype laat zien

| Onderdeel | Hoe het werkt |
| --- | --- |
| Straat | Bovenaanzicht in tegels van 16 px, scherm van 15 × 10 tegels (het canvas is 240 × 160 en wordt scherp vergroot). Wereld van 44 × 26 tegels, camera volgt het figuurtje. |
| Figuurtje | Het eigen figuurtje als pixelfiguurtje met 4 richtingen en een loopanimatie. Huid, haar, shirt, broek en schoenen komen uit de bestaande catalogus (`src/data/figuurtje.ts`). |
| Huizen | Elk huis staat voor zijn eigen deur en wordt getekend uit de echte Mijn huis-keuzes: grootte, dak en kleur, muren, deur, ramen, tuin (links en rechts van het huis) en extra's (schoorsteen met rook, vlag, lichtjes, bloembakken, hekje). Een kind dat zijn huis laat groeien ziet het meteen in de straat veranderen. |
| Besturen | Pijltjes of WASD, richtingknoppen op het scherm, A-knop om iets aan te spreken, of gewoon op de grond tikken (het figuurtje zoekt zelf de weg). Tikken op een deur loopt er heen en gaat naar binnen. |
| Eigen huis binnen | Loop de deur in: een fade naar "Jouw kamer" met bed, boekenkast, raam met uitzicht op de straat en een eigen spulletje. Over de deurmat naar buiten. |
| Bij een ander op bezoek | Eerst "Tok tok!", dan in de kamer van de broer of zus waar die zelf staat en je verwelkomt. Je kunt hun spulletjes bekijken. Niets kan kapot of verplaatst worden. |
| Anderen in de straat | De andere twee kinderen lopen rond als gewone figuurtjes. Aanspreken kan. In de app zou dit echt zijn als een ander kind ook net in Ons straatje is (zie "Later"). |
| Speelplein | Schommel (het figuurtje gaat echt zitten en zwaait hoger), glijbaan, wip ("leuker met z'n tweeën"), zandbak met kasteel. |
| Vijver, bank, voetbalveldje | Vijver met eendjes en lelieblaadjes, een bank, een veldje met twee doelen en een bal. |
| Dag en nacht | 's Nachts krijgt de straat een blauwe gloed, de ramen gaan branden en de lantaarns geven licht. Koppelen aan het donkere thema van het kind. |
| Voor wie niet leest | Praatjes tonen voor Feline een rijtje prentjes in plaats van tekst, met een voorleesknop (zoals elders in de app). |

Wat het prototype **niet** doet: opslaan, echte data, geluid, binnen meubelen veranderen, meer dan twee kamers per huis, ouders in de straat.

## Voorstel voor de app

### Waar

- Op het startscherm van elk kind komt de huisknop (Mijn huis) naast het figuurtje al voor. Daar komt een tweede ingang bij: **Ons straatje**. Uit Mijn huis kom je er ook met "Naar buiten". Je start altijd voor je eigen deur.
- Route `/kind/:id/straatje`, scherm `src/schermen/Straatje.tsx`. Het canvas tekent zelf, zoals Springland (`docs/springland.md`) en Penalty's.

### Besturing

- Tablet liggend (Luca, Yuna, Feline): tikken op de grond is de standaard. Wie liever stuurt, kiest in dezelfde instelling als Springland **Vanzelf lopen** of **Zelf lopen** met een joystick of pijlen plus een A-knop. Dat is de bestaande instelling per kind, die we hergebruiken.
- Gsm van een ouder: dezelfde schermen op `/ouder/straatje`, zoals Springland. Een ouder loopt met het chat-figuurtje, zonder activiteitlog.
- Geen verliezen, geen tijd, geen sterren die op het spel staan. Wie nergens heen wil, staat gewoon stil.

### Wat het kind ziet van elkaar

De huizen komen **altijd** uit de echte gegevens (`gebruikers.huis` en `gebruikers.figuurtje`). Dat vraagt alleen leesrecht van een kind op de huis- en figuurgegevens van de gezinsleden. Dat is nu al zo voor Wie speelt er? (figuurtje); voor het huis moet een RLS-regel of een RPC `straatje_lezen()` die per kind enkel `id, naam, huis, figuurtje` teruggeeft.

Bezoeken is altijd veilig: de binnenkant van een ander huis is **alleen om naar te kijken**. Er wordt niets aangepast, en niets wat een broer of zus bouwde kan kapot.

### Wie is er "thuis" en wie loopt rond

Twee opties; ik stel de eerste voor:

1. **Eerst alleen kijken en bezoeken** (geen live): in elk huis staat het kind gewoon voor de tijd die het in de app is, of altijd. De straat is dan een prentenboek met de huizen en de tuinen. Geen realtime nodig.
2. **Later live**: Supabase Realtime-presence laat zien wie er op dat moment ook in Ons straatje is, met positie. Zo loop je echt langs elkaar. Dat is veel meer werk (verbinding, wegvallen, tablets die slapen) en pas zinvol als de eerste versie bevalt.

### Binnenkant

In het prototype heeft elk huis één kamer met vaste meubels. Voorstel voor de app, in stappen:

1. Eén vaste kamer per huis (zoals het prototype), kleuren van de muren volgen het huis. Een eigen spulletje volgt het thema (voetbal, kroon, knuffel).
2. Later: kamers die meegroeien met het huismodel (een verdieping erbij = een trap), en een **kamer inrichten** met meubels die je met sterren koopt. Dit is dan een uitbreiding van Mijn huis, niet van het straatje.

### Dorpsdingen en ideeën

| Idee | Hoe |
| --- | --- |
| Speelplein | Schommel, glijbaan, wip, zandbak. Voor de wip: samen met een ander kind kan later (live). |
| Vijver met eendjes | Rustig kijken. Eendjes lopen vanzelf rond. |
| Voetbalveldje | Bal wegschieten. Past bij het voetbalthema en bij Penalty's. |
| Brievenbus | Elk huis heeft er een. Idee: een kind legt een tekening of een kort bericht in de brievenbus van een ander (zie `docs/chat.md` voor de moderatie die nodig is). |
| Winkeltje | Een winkel waar het kind de bestaande winkel (`docs/winkel.md`) in loopt, in plaats van een lijst. Een mooie latere stap. |
| Seizoenen | Sneeuw in december, bladeren in oktober. Bij seizoenen van Mijn huis (staat al op de lijst). |
| Weekmenu bij de buren | Wat wordt er vanavond gegeten? Hoort bij `docs/weekmenu.md`, niet nodig. |
| Ouders | Een ouderhuis met de eigen figuren van de ouders, voor de taakbord en de notities. Nu niet. |

### Technisch

- Tekenen op een canvas van 240 × 160 en schalen met `image-rendering: pixelated`, zoals het prototype. Sprites worden met code getekend (huizen, figuurtjes, tuinspullen) en één keer in een cache gezet, met automatische rand. Zo hoeven er geen afbeeldingen mee en volgen alle Mijn huis-stukken vanzelf. Nieuwe huisstukken (zwembadje, dino, …) hebben dan één extra tekenfunctie nodig. Het prototype tekent nu 6 van de 14 tuinspullen en 4 van de 5 groottes; de rest volgt.
- De kaart is één array van tegels plus een lijst met objecten (huizen, bomen, speelplein) die op hun onderkant gesorteerd worden. Botsing komt uit dezelfde kaart.
- Positie wordt niet opgeslagen: je start altijd voor je eigen deur.
- `prefers-reduced-motion`: geen rook, geen vallende bladeren, eendjes blijven stilstaan.
- Tekstvakken: het prototype gebruikt het lettertype Pixelify Sans voor het Game Boy-gevoel. Voor de app kan ook het huidige Baloo/Nunito als dat beter past.
- Tests: robot die van de deur van elk huis naar elke andere deur en terug kan lopen (zoals `springen.test.ts`), en een test dat elk huis dat Mijn huis kan maken, ook in het straatje getekend kan worden.

### Nieuw in de app

Bij de bouw komt er een nieuwtje bij in `src/data/nieuwtjes.ts` (de vaste regel in `CLAUDE.md`), met een stijgende versie.

## Open vragen voor Frederique en de kinderen

1. Eerst alleen kijken en bezoeken (geen live), of meteen live samen rondlopen?
2. Mogen de kinderen elkaars huizen altijd binnen, of moet de eigenaar dat per huis aan of uit kunnen zetten ("ik wil even alleen")?
3. Moet Ons straatje bij het gewone speelaanbod (winkel, prijs) horen of altijd gratis zijn zodra Mijn huis er is? Voorstel: altijd gratis, maar een ouder kan het per kind verbergen in Winkelaanbod.
4. Welke dorpsdingen eerst: speelplein en vijver (zoals prototype) of liever een voetbalveld, winkeltje of brievenbus?
5. Willen de ouders er ook rondlopen?
