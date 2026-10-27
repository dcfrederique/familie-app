# Concept: de wereld in 2.5D (schuin bovenaanzicht)

Status: concept met speelbare proef van 27 oktober 2026, op vraag van Frederique. **Een werkbare versie zit in de app (nieuwtje 0.48)** als schakelaar Plat / 2.5D schuin in Instellingen → Wereldinstellingen, met dezelfde opties als de proef plus loopsnelheid; standaard blijft de wereld plat. Hieronder staat het oorspronkelijke concept; de app-versie wijkt op een punt af: de kinderhuizen en gebouwen blijven hun bestaande tekening, die naar achteren wordt uitgetrokken (zijkant en dak per rij gekleurd, schaduw op de grond), in plaats van opnieuw als vlakken getekend te worden.

**In de app:** `src/lib/wereld/camera.ts` (projectie, getest), `weergave.ts` (instellingen), `tekenen25.ts` (`Tekenaar25 extends Tekenaar`, `teken25`), opslag in `gezinnen.wereld_instellingen` (migratie 20261027000300), scherm `src/schermen/WereldInstellingen.tsx`; een ouder kan in De wereld in (tandwiel) live proberen. Loopsnelheid werkt ook in de platte wereld.

**Nog niet:** de 2.5D-wereld is niet op echte tablets getest; Springland verandert niet. Proef: `prototypes/wereld-25d/` (bouwen met `sh prototypes/wereld-25d/bouw.sh <uitvoer.html>`), beelden in de projectmap `schermen/wereld-25d/`.

**Geen Three.js, geen WebGL, geen spelraamwerk.** Het blijft het gewone 2D-canvas van `src/lib/wereld/`. Het verschil met vroeger: de camera kijkt schuin, en huizen en hekjes krijgen een zijkant en een dak (vlakken met een tekening erop). Dat is een andere look dan "de stijl van nu" uit `CLAUDE.md`; Frederique beslist of dat mag voor het in de app komt.

Wat blijft: tegel voor tegel lopen (0.44), het chibi-figuurtje met rand (0.45), kinderhuizen zijn hun eigen Mijn huis, kleuren en vormen van de app (gras, grindpad, rode daken, appelbomen, houten naambordjes, wit hek om de zandbak).

## Wat er in de proef zit

- Drie huizen (Luca, Mama, Yuna) met rood dak, schoorsteen met rook, raam, deur en een trede. Appelbomen, lantaarns, naambordjes van hout, brievenbussen, zandbak met wit hek, zandkasteel en emmer.
- Drie poppetjes met het echte `tekenChibi`: Luca is speelbaar (pijltjes, WASD, knoppen, tikken op de grond), Yuna staat, Feline dwaalt rond.
- Camera met draaien en kantelen, drie voorkeuzes, dag en nacht, schaduwen aan en uit, tegelraster.

## Het perspectief

Eén orthografische camera met twee hoeken: **draaien** (yaw) en **kantelen** (pitch). Een punt (x, y op de grond, z omhoog, in tegels) wordt:

```
X = x·cos(yaw) − y·sin(yaw)      Y = x·sin(yaw) + y·cos(yaw)
scherm.x = X · T                 scherm.y = (Y · sin(pitch) − z · cos(pitch) · 1,45) · T
```

`T` = 48 (de tegelmaat van nu); de 1,45 maakt gebouwen wat hoger dan de wiskunde, zoals bijna elk 2.5D-spel. Terugrekenen (tikken op de grond) is dezelfde formule omgekeerd voor z = 0.

| Keuze | Draaien / kantelen | Wat je ziet | Opmerking |
| --- | --- | --- | --- |
| 3/4 recht | 0° / 52° | Voorkant en dak, geen zijkant | Pokémon- of Paper Mario-gevoel. Joystick en tegels blijven precies zoals nu. Goedkoopste stap. |
| **3/4 licht gedraaid (voorstel)** | 18° / 48° | Voorkant, één zijgevel, dak | Geeft de zijgevel die Frederique wil, met een bijna gewone joystick. |
| Isometrisch | 45° / 30° | Diamanttegels, twee zijden | Habbo. Lopen gaat diagonaal op het scherm; voor Feline (4) minder geschikt. |

De schuiven in de proef zijn om te kiezen. In de app komt één vaste hoek (of eventueel per thema).

## Hoe diepte ontstaat

1. **Huizen zijn vlakken.** Voorkant, twee zijkanten, twee gevels, twee dakhellingen, dakrand met dikte en nokkap. Alleen vlakken die naar de camera kijken worden getekend, links is lichter dan rechts. Raam, deur, vensterbank en dakpannen worden op het vlak getekend met een `transform` per vlak, dus ze draaien vanzelf mee met de hoek.
2. **Rechtopstaande prenten.** Bomen, lantaarns, bordjes en brievenbussen blijven prenten die altijd naar het scherm kijken (zoals Paper Mario). Ze krijgen een lichtverloop in de kruin, een donkerdere kant en een schaduw op de grond.
3. **Volgorde.** Alles gaat in één lijst en wordt gesorteerd op `Y` van de voet. Daardoor loop je achter een boom of huis langs en vóór het hek van de zandbak.
4. **Schaduw.** Eén zwarte laag met het grondvlak van elk ding, verschoven naar de zon, daarna één keer met 24% over de grond. Gras, pad en zand blijven plat; de grindpadrand blijft plat (Frederique wilde die niet verhoogd).
5. **Poppetje.** Het bestaande chibi-figuurtje; de kijkrichting volgt de **schermrichting** van de stap (links, rechts, omlaag, omhoog), dus de vier bestaande standen volstaan ook bij een gedraaide camera.
6. **Nacht.** Dezelfde multiply-laag als de dag/nacht van 0.46, plus gloed bij lantaarns. Weer (regen, sneeuw) blijft een laag op het scherm.

## Assets en code (tips)

- **Geen nieuwe afbeeldingen nodig.** Alles is code. Vermijd bitmaps per hoek; vlakken en prenten werken bij elke hoek.
- **Kinderhuizen = Mijn huis.** `HUIS_MAAT` (links, rechts, deur) en de groei (hutje, huisje, verdieping, groot, toren) worden breedte × diepte × hoogte. De voorkant is de bestaande tekening van het huis (muur, raam, deur, kleur van het kind), geplakt op het voorvlak met dezelfde `transform`; zijkant, dak en schoorsteen worden erbij gegenereerd uit de dakkleur en muurkleur van het huis. Nog uitzoeken: de SVG van `tekenHuis` bevat nu ook het driehoekige dak; dat moet los van de muur (de uitsnede in `huisUitsnede` is het beginpunt).
- **Eén functie per vorm.** `huis(w, d, h, kleuren)`, `doos(...)`, `prent(x, y, tekening)`. Een nieuw gebouw is dan data: plek, maat, kleuren, deur en eventueel een `tekening` voor een prent.
- **Botsen en bereikbaarheid blijven in `kaart.ts`.** Alles wat daar op tegels werkt (BFS, botsvlakken, `kaart.test.ts`) verandert niet; alleen `tekenen.ts` en het omrekenen van tikken en joystick naar wereldrichting (kies de wereldas die het best past bij de schermrichting) veranderen.
- **Ondergrond.** Bij 0° draaien is de ondergrond één keer tekenen en `scale(1, sin(pitch))`. Bij een draai worden tegels per beeld getekend (in de proef ±1200 vlakken, vloeiend op een laptop; **niet getest op de echte tablets**, eerst meten op de oudste).
- **Hoogte-overdrijving** (1,45) en lichtrichting zijn twee getallen; spelen ermee is genoeg om de sfeer te sturen.
- Test: `tekenen.ts` blijft op zichzelf staand; de schermcontrole en `e2e/schermen.spec.ts` meten het canvas als geheel, dus die blijven werken.

## Fases (voorstel)

1. Camera, ondergrond, sorteren, schaduwen, poppetje en prenten (bomen, lantaarns, bordjes) met de bestaande gebouwtekeningen nog plat.
2. Huizen en gebouwen als vlakken (winkel, spellenhuis, kinderhuizen met hun Mijn huis).
3. Zandbak, hekwerk, speeltoestellen (schommel, glijbaan) als vlakken en prenten, bal met schaduw.
4. Afwerking: rook, nacht met lichtjes in de ramen, regen en sneeuw.

Per fase één nieuwtje (volgend versienummer).

## Wat dit betekent voor de levendige wereld en de nachtroutine

Het plan `docs/wereld-levendig.md` (dag/nacht, weer, speeltoestellen, bal, huizen spreiden, stad uitbouwen) blijft geldig; de data (plekken en botsvlakken) wordt hergebruikt.

- **Weer en dag/nacht**: werken op schermlagen en blijven onveranderd.
- **Speeltoestellen en bal**: de logica in `speel.ts` blijft; alleen de tekening wordt een prent of een paar vlakken met schaduw.
- **Huizen spreiden (stap 5)**: gemakkelijker, want met sorteren op diepte mogen ze overal staan.
- **Nachtroutine 06:07 (stad bouwen)**: vanaf de overstap moet elk nieuw stuk ook een **maat** (breedte × diepte × hoogte) en een **vorm** (huis, doos, prent) krijgen in de data, niet alleen een platte tekening. Voor de overstap bouwt de routine plat. Twee mogelijkheden: de routine pauzeren tot fase 2 klaar is, of nu al door laten gaan met erbij gezette `maat` en `vorm` in de data (dan hoeft er later niets omgebouwd). Voorstel: doorgaan en de maat al noteren; de backlog-items (bakker, café, bibliotheek, brandweer) zijn gebouwen, dus dozen met een dak.

## Open vragen voor Frederique

1. Welke hoek: 3/4 recht, licht gedraaid (voorstel) of isometrisch?
2. Mag dit de look "van nu" vervangen (past niet bij de zin in `CLAUDE.md` en `docs/wereld.md`)? Dan pas ik die tekst aan.
3. Mag de nachtroutine vast `maat` en `vorm` noteren?
4. Op een liggende gsm zijn de tegels dan kleiner; schalen met de schermhoogte zoals de andere kindschermen.
