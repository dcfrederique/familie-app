# Onderzoek: de wereld in 2.5D isometrisch

Status: onderzoek van 27 oktober 2026, op vraag van Frederique. Niets gebouwd. Bouwt voort op `docs/wereld.md` (concept en fases) en `docs/straatje.md`.

## De vraag

Kan De wereld (`/kind/:id/wereld`) omgezet of verfijnd worden naar een 2.5D isometrisch beeld, en is het dan beter om Phaser of Three.js te gebruiken, of om bij de huidige aanpak te blijven?

## Hoe het nu zit

- Eigen code op een gewoon 2D-canvas: `src/schermen/Wereld.tsx` (295 regels), `src/lib/wereld/tekenen.ts` (395), `kaart.ts` (191, zuivere logica met test), `live.ts` (149, Realtime). Samen ruim 1000 regels zonder bibliotheek.
- Platte bovenaanzicht-kaart van 56 × 28 tegels (U = 48). Ondergrond wordt één keer getekend, huizen, gebouwen, bomen en speeltoestellen zijn SVG-plaatjes die als bitmap op het canvas gaan, figuurtje met rug-, zij- en voorkant en stappende voeten.
- Lopen = joystick of tikken, BFS over de tegels, botsen met rechthoeken. Die logica zit in `kaart.ts` en weet niets van tekenen.
- Alle huizen, tuinstukken en figuurtjes komen uit dezelfde SVG-code als de rest van de app (`lib/huis/tekenen.ts`, `lib/figuurtje/tekenen.ts`). Dat houdt de stijl gelijk, en kinderen zien hun eigen aanpassingen terug.

## Wat is "2.5D isometrisch" hier precies?

Er zijn twee dingen die mensen zo noemen, en ze kosten niet evenveel:

1. **Echte isometrie** (diamantvormige tegels, 2:1 of 30 graden, zoals Habbo, Pocket Camp, Diablo). De wereld is ruitvormig gedraaid, gebouwen tonen twee zijden en een dak.
2. **Schuin bovenaanzicht** (zoals Pokémon of Zelda): wat we nu hebben, maar met meer diepte in de gebouwen. De tegels blijven vierkant.

Mijn aanname voor dit onderzoek is nummer 1. Dat is ook wat de vraag van Frederique waarschijnlijk bedoelt, maar dat vragen we na (zie onderaan).

## De opties

### A. Huidige aanpak houden, isometrische projectie erbij (aanrader)

Een isometrische kaart is wiskundig een draaiing plus een platdrukking van dezelfde tegelkaart:

- Wereld → scherm: `sx = (x − y) · b`, `sy = (x + y) · h` (2:1 geeft `h = b / 2`). Scherm → wereld is de omgekeerde matrix. Dat zijn twee kleine functies.
- De ondergrond (gras, wegen, vijver, veld) blijft platte tekening die je met één `ctx.transform` ruitvormig zet. Bestaande tekencode voor de ondergrond is dus herbruikbaar.
- Dingen en gebouwen worden gesorteerd van achter naar voor (op `x + y` van hun voet). Dat doet de wereld nu ook op `y`.
- `kaart.ts` (BFS, botsen, bereikbaarheidstest van gebouwen) verandert niet. Alleen de joystick moet een richting omrekenen (omhoog op de joystick = linksboven in de wereld, of we draaien de wereldrichtingen zo dat het intuïtief voelt).
- Live (`live.ts`) verandert niet: positie blijft in wereldcoördinaten.
- Het figuurtje heeft nu vier richtingen (rug, voor, links, rechts). Isometrisch lopen wordt diagonaal: vier nieuwe kijkrichtingen (linksvoor, rechtsvoor, linksachter, rechtsachter). De bestaande zij- en voorkant-overlays kunnen als eerste benadering dienen, een echte versie vraagt 4 nieuwe overlays op het SVG-figuurtje.

**Voordelen:** geen nieuwe bibliotheek, geen extra bundel, werkt op de oudste tablets (nu al getest), dezelfde SVG-stijl, PWA en Capacitor veranderen niet, en alle tests blijven bruikbaar.
**Nadelen:** je moet zelf alles bouwen wat een engine meebrengt (camera-effecten, tweens, deeltjes). Bij ons is dat tot nu toe weinig en het is al gedaan.

### B. Phaser

Een volledig spelraamwerk (scenes, camera, input, animaties, tweens, tilemaps, geluid, deeltjes, physics). Kent isometrische tilemaps (Tiled-import).

- **Bundel gemeten (esbuild, minify, volledige import):** ongeveer 1,4 MB, 369 KB gzip. Dat is bijna het dubbele van de rest van de app samen en alleen voor de wereld. Lazy-laden bij het openen van `/wereld` maakt het draaglijk, maar de eerste keer op wifi kost het wel.
- Elke nieuwe functie van de app wil dan in Phaser-termen (scenes, game objects) en niet meer in React en SVG. Het figuurtje, het huis en de tuinstukken moeten als texturen worden aangeleverd (SVG → bitmap, kan).
- React en Phaser samen werkt (Phaser in een `<div>`, opruimen bij verlaten) maar de overgang naar de schermen eromheen (`?van=wereld`, SpelKader, hub-overgang) wordt meer lijmwerk.
- Wat we ervoor terugkrijgen: handige camera, tweens, deeltjes, tilemap-editor-workflow. Ons probleem is niet dat die ontbreken.

### C. Three.js

Echte 3D, getoond met een orthografische camera onder de isometrische hoek.

- **Bundel gemeten (WebGLRenderer, scène, orthografische camera, mesh):** ongeveer 530 KB, 132 KB gzip. Redelijk, ook zonder verdere tree-shaking.
- Echte voordelen: camera die je kunt draaien of laten zakken, echte schaduwen, dag/nacht via licht, gebouwen die je van elke kant ziet, en soepele zoom.
- Echte nadelen voor déze app: (1) de stijl is platte, getekende SVG; 3D met vlakke kleuren is mogelijk (toon-materialen), maar alle gebouwen, huizen die groeien met de sterren, de tuinstukken en het figuurtje moeten als 3D-model of als vlakke plaatjes (billboards) in een 3D-scène. Dat is veel tekenwerk, en ik kan 3D-modellen niet visueel beoordelen zoals ik nu SVG's beoordeel. (2) De hele bestaande SVG-code voor huis en figuurtje valt dan weg of wordt een tweede, parallelle wereld. (3) Prestaties op de oudste tablets en de WebView in Capacitor: WebGL werkt, maar geheugen en batterij kosten merkbaar meer dan een canvas. (4) Verlies van context bij schermvergrendelen is een extra foutbron.
- Past als de kinderen een echte 3D-wereld willen. Dat is wat Frederique eerder niet vroeg: "3D" was het oude Pokémon-gevoel (zie `docs/straatje.md`).

### D. PixiJS (tussenweg, niet gevraagd)

Een 2D-renderer op WebGL, zonder spelraamwerk eromheen.

- **Bundel gemeten:** ongeveer 528 KB, 153 KB gzip.
- Sneller bij heel veel sprites en filters (gloed, schaduw) dan canvas 2D; handig als de wereld veel groter wordt of veel bewegende dingen krijgt (live met meer mensen, Springland-eiland met veel gebruikers, deeltjes).
- Eerlijk gezegd lossen we nu geen prestatieprobleem op. Niets wijst erop dat canvas 2D niet volstaat (de wereld is 56 × 28 tegels, een handvol bewegende dingen).

## Vergelijking

| | A. Canvas + isometrisch | B. Phaser | C. Three.js | D. PixiJS |
| --- | --- | --- | --- | --- |
| Extra bundel (gzip) | 0 | ~369 KB | ~132 KB | ~153 KB |
| Hergebruik huidige code en SVG | bijna alles | tekenen herschrijven, logica blijft | tekenen en kunst herschrijven | tekenen herschrijven |
| Stijl gelijk aan de app | ja | ja | moeilijk | ja |
| Tablets (oud) | goed (nu al getest) | goed, WebGL | zwaarder | goed, WebGL |
| Camera draaien of zoomen | nee, of beperkt | ja | ja, gratis | ja |
| Echte schaduw en licht | getekend | getekend | echt | filters |
| Werk, grof | klein tot middel | groot | zeer groot | middel |
| Risico | laag | middel | hoog | middel |

## Wat het echte werk is: de kunst, niet de engine

Wat de engine ook is, de dure stap is dat **elk gebouw, huis, tuinstuk en figuurtje opnieuw getekend moet worden** met twee zichtbare zijden en een dak.

- Gebouwen in `data/wereldPrenten.ts` (Winkel, Spellenhuis, Bladerhuisje, bouwplaats) zijn voorgevels. Voor isometrie zijn dat blokken met drie vlakken. Dat kan met een kleine **generator** (breedte, diepte, hoogte, wandkleur, dakvorm, ramen, deur, uithangbord) die SVG teruggeeft, zodat een nieuw spel een rij data is en geen hand getekend plaatje. Dat past bij de nachtelijke bouwer (`gebouwen` in `data/wereld.ts` met `spel`, `pad`, `nieuwSinds`).
- Huizen van de kinderen (`lib/huis/tekenen.ts`) groeien met sterren en tonen aanpassingen. Dat zijn de moeilijkste: er is nu één voorgevel-tekenaar. Een isometrische tweede tekenaar, of een tussenoplossing waarbij het huis in de wereld een **vereenvoudigd blokhuis** is met de echte kleuren, het model en de deur van het kind.
- Tuinstukken en bomen, speeltoestellen: één voor één opnieuw, maar klein en herhaalbaar.
- Figuurtje: vier diagonale kijkrichtingen. Zie hierboven.
- Dag en nacht: nu met een kleurenpalet (`DAG` en `NACHT`). Dat werkt hetzelfde isometrisch.

Een goede inschatting: de projectie en de logica zijn een dag werk, de kunst is een veelvoud daarvan.

## Springland erbij

In `docs/wereld.md` staat dat Springland (kaart met levels) later opgaat in de wereld. Isometrisch maakt dat mooier (eilanden, hellingen), maar ook moeilijker: hoogteverschil vraagt aandacht in de pad- en botslogica (nu alleen 2D-tegels). Voor een eerste isometrische versie: vlak houden, geen hoogtes.

## Mijn advies

1. **Blijf bij de huidige canvas-aanpak** en voeg isometrische projectie toe (optie A). Het levert het gevraagde beeld, houdt alle SVG-code en de stijl, kost geen megabytes, en laat Capacitor en de tablets ongemoeid.
2. **Begin met een proef achter een schakelaar** (bijvoorbeeld `?iso=1`, alleen voor ouders): isometrische ondergrond, twee generatorgebouwen, het figuurtje met diagonale richtingen, joystick, tikken en live. Zo vergelijken we naast elkaar met de huidige wereld, op de echte tablets. Dat is klein genoeg om in één stuk te doen.
3. **Daarna pas beslissen** over de rest van de gebouwen, de kinderhuizen en Springland, met de proef als voorbeeld.
4. Phaser of Three.js alleen heroverwegen als de kinderen **echte 3D** willen (camera die draait, binnen en buiten zonder schermwissel) of als blijkt dat de tablets het niet redden. Dan is Three.js mijn voorkeur boven Phaser: kleiner, en we hebben geen spelraamwerk nodig. PixiJS is de zachte stap als het alleen om snelheid gaat.

Eén kanttekening over mijn eigen advies: ik kan de proef goed bouwen en met schermafbeeldingen controleren, maar of het er mooi uitziet is smaak. Daarom is eerst de stijl nodig (zie hieronder).

## Vragen voor Frederique (te stellen op 27 oktober 2026 in de ochtend)

1. **Welke stijl precies?** Echte isometrie met ruiten, of schuin bovenaanzicht zoals Pokémon maar met meer diepte? Of iets anders?
2. **Voorbeelden:** een paar schermafbeeldingen van spellen of tekeningen waar de wereld op moet lijken (bijvoorbeeld Pocket Camp, Habbo, Monument Valley, Stardew-achtig, Pokémon). Ook welke je **niet** wilt.
3. **Draaien of zoomen:** wil je dat het kind de wereld kan draaien of dichterbij kan halen, of mag de hoek vast staan?
4. **Binnen en buiten:** blijven de binnenschermen zoals nu (winkel, huis met tabs), of moet je ook binnen in 2.5D rondlopen?
5. **Kinderhuizen:** mag het huis in de wereld een vereenvoudigd blokhuis zijn met de kleuren en het model van het kind, terwijl Mijn huis zelf de gedetailleerde voorgevel blijft?
6. **Springland:** nu mee in de proef, of pas later?
7. **Voorkeur voor gewicht:** gaat het vooral om "mooier" of ook om "meer wereld" (hoogteverschil, bergen, water)? Het eerste past in optie A, het tweede vraagt meer.
