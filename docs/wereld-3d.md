# Plan van aanpak: de wereld in 3D

Status: fase 1 (basisversie achter de schakelaar) gebouwd op 27 oktober 2026, zie "Stand van de bouw" onderaan. Proef: `prototypes/wereld-3d/`; onderzoek en besluit: `docs/wereld-isometrisch.md`. Opdrachtgever: Frederique. Bouwt voort op `docs/wereld.md` (concept, fases, live) en `docs/huis.md`.

## Doel

De wereld krijgt het gevoel van een Pokémon-achtige MMO: een schuine perspectiefcamera, kleine chibi-figuurtjes met naamlabel, afgeronde 3D-gebouwen met schaduw, tegelvloer, en een scherm eromheen (profiel, opdracht, minikaart, menu). De kinderhuizen zijn een 3D-versie van hun Mijn huis, het figuurtje van het kind is een 3D-versie van zijn figuurtje. Wat de kinderen aanpassen (Kleerkast, Mijn huis) blijft 2D; alleen de wereld toont het in 3D.

## Uitgangspunten

1. **Achter een schakelaar, naast de bestaande wereld.** De huidige canvas-wereld blijft de standaard tot de 3D-wereld klaar en getest is. Schakelaar: in het ouderdeel (Kinderen → Instellingen, per gezin) plus `?3d=1` in de URL om te proberen. De 3D-wereld krijgt een eigen route `/kind/:id/wereld3d`; de wereldknop op het startscherm kiest de route volgens de schakelaar. Aan het eind (fase 5) verdwijnt de oude.
2. **Three.js, alles met code.** Geen 3D-modellen: afgeronde blokken, bollen, kegels, extrusies, canvas-texturen (zoals in de proef). Eén scène, één camera, geen engine eromheen. Three.js wordt pas geladen bij het openen van de 3D-wereld (dynamische import), dus de rest van de app wordt niet zwaarder (±132 KB gzip).
3. **Hergebruik wat al bestaat:** kaartlogica (`src/lib/wereld/kaart.ts`: botsen, bereikbaarheid, BFS), live (`live.ts`, wereldcoördinaten blijven hetzelfde), gebouwen en vrijgave/slot/gouden rand (`src/data/wereld.ts`, `gebouwenVoor`), de bestemmingenlogica en `?van=wereld` voor terugknoppen.
4. **Terugvallen in plaats van breken.** Heeft een stuk (kapsel, hoed, dak, tuinstuk, spelgebouw) nog geen 3D-versie, dan toont de wereld een eenvoudige vorm in de juiste kleur. Geen WebGL of te zwak toestel: automatisch de oude canvas-wereld.
5. **Stuk voor stuk, goedkoop in tokens.** Een basisversie komt in één keer; de rest groeit elke nacht met één stuk (zie "Nachtelijke routine").

## Opbouw van de code (voorstel)

```
src/lib/wereld3d/
  scene.ts          renderer, camera (volgt het kind, schuin, verder weg voor overzicht), licht, schaduw, resize, opruimen
  wereld.ts         bouwt de wereld uit de kaartdata: grond, plein, paden, bomen, lantaarns, hekjes, vlinders
  figuur.ts         chibi-figuurtje uit de Figuurtje-data (kleuren en vormen), looplus, naamlabel
  huis.ts           3D-huis uit de Huis-data (model, dak, muur, deur, ramen, tuin, extra)
  gebouwen.ts       Winkel, Spellenhuis, spelgebouwen, bouwplaats; slot en gouden rand
  stukken/          één bestand per soort: figuur-haar.ts, figuur-kleding.ts, huis-dak.ts, huis-tuin.ts ...
                    elk een register { [catalogus-id]: (opties) => Object3D }
  invoer.ts         joystick, toetsen, tikken op de grond (BFS uit kaart.ts)
  hud.tsx           profiel, opdracht, minikaart, menuknop (React boven het canvas)
src/schermen/Wereld3D.tsx   route; laadt three lazy; valt terug op <Wereld/> zonder WebGL
```

Tests (vitest, zonder WebGL): elke id in de catalogus van figuurtje en huis staat in een register of in de lijst `nog3d` (zodat de test ook ontbrekende stukken meldt); kaart-, live- en vrijgavetests blijven. Beeldcontrole: Playwright met swiftshader maakt schermafdrukken (zoals in de proef) en de nachtelijke schermcontrole meet de HUD.

## Fases

| Fase | Inhoud | Klaar als |
| --- | --- | --- |
| 1. Basisversie | Schakelaar, route, scène en camera, grond/plein/paden/bomen/lantaarns, drie kinderhuizen uit hun Mijn huis (kleuren en model, dak en deur), figuurtje met kleuren (huid, haar, kleding) en basiskapsels, naamlabel, joystick/toetsen/tikken met botsen, Winkel en Spellenhuis als eenvoudige 3D-gebouwen, door een deur gaan, HUD (profiel, minikaart, menu, huisknop), terugval op 2D | Frederique kan de wereld op de tablet openen via de schakelaar en lopen, zonder haperen |
| 2. Live en anderen | Live lopen in 3D (zelfde `live.ts`), ouders in de wereld | De anderen verschijnen en lopen vloeiend |
| 3. Stukken (nachtelijk) | Per nacht één of enkele stukken: kapsels, kleren, hoeden, daken, ramen, tuinstukken, extraatjes, spelgebouwen in fantasiestijl, Springland-gebied | Test `nog3d` wordt korter, schermafdruk in het verslag |
| 4. Beleving | Opdrachten, camera-instelling (afstand), dag en nacht, seizoenen, geluid, Springland in de wereld | Naar keuze van Frederique |
| 5. Omschakelen | 3D wordt standaard, de oude canvas-wereld verdwijnt na een week zonder problemen | Geen klachten, tablets goed |

## Prestaties en risico's

- Budget: schaduwkaart 2048 alleen rond het kind, `setPixelRatio` ten hoogste 1,5 op tablets, een paar honderd draw calls (gelijke materialen en geometrie delen, zoals in de proef), geen echte tekst in 3D (naamlabels zijn sprites van een canvas).
- Test op de oudste tablet en later in de Capacitor-WebView (`docs/capacitor.md`). Bij haperen: schaduwen en pixelverhouding automatisch verlagen op basis van de beeldsnelheid.
- WebGL-contextverlies (scherm vergrendeld): hervatten bij `webglcontextrestored`, of terugvallen op 2D.
- Batterij: render alleen terwijl de pagina zichtbaar is; stop de lus op verborgen tabblad.
- `prefers-reduced-motion`: geen vlinders, geen schommelende bomen.
- Schermtijd en vrijgave blijven zoals in `docs/wereld.md` (de wereld zelf telt niet mee, spelletjes wel; gebouwen volgen Winkelaanbod).

## Nachtelijke routine voor de 3D-wereld

Doel: de basisversie wordt niet in één grote klap afgemaakt. Elke nacht pakt een aparte routine **één stuk** uit `docs/wereld-3d-backlog.md`, bouwt het, controleert het met een schermafdruk en pusht naar main.

- **Moment:** na de schermcontrole, bijvoorbeeld 06:07 (Brussel). Daarna is er nog tijd voor Frederique om het te zien.
- **Werkwijze:** lees `docs/wereld-3d.md` en de backlog; kies het eerste open item (de volgorde staat in de backlog); bouw het in `src/lib/wereld3d/stukken/` of het juiste bestand; draai lint, tests, build en de schermafdruk (`prototypes/wereld-3d/` toont hoe); zet het item op klaar in de backlog; voeg een nieuwtje toe als ouders of kinderen er iets van merken (kernregel, `src/data/nieuwtjes.ts`); schrijf een korte samenvatting in `ideeen/YYYY-MM-DD-wereld3d.md`; push naar main.
- **Grenzen (zodat de tokens meevallen):** één item per nacht, geen grote herstructurering, geen nieuwe bibliotheken; blijft iets rood, dan alleen het verslag pushen. Is de backlog leeg, dan doet de routine niets.
- **Nieuwe stukken van de andere nachtroutines** (spelletjes, figuurtjestukken, huisstukken) hoeven geen 3D-versie te maken: de test `nog3d` laat zien wat ontbreekt en de 3D-routine zet het achteraan in de backlog. Zo blijven de bestaande nachten licht.

## Wie doet wat

- Frederique: kijkt naar de schermafdrukken en de proef en geeft smaak en prioriteit.
- Een aparte bouwthread (voorstel): fase 1 en 2, in meerdere stappen met tussentijdse commits achter de schakelaar.
- De nachtelijke 3D-routine: fase 3 en 4, één stuk per nacht.
- De bestaande routines (verhalen en spelletjes, schermcontrole) veranderen niet, behalve dat hun regels naar dit plan verwijzen.

## Open vragen

1. Camera: vaste afstand of in te stellen door het kind (dichterbij en verder)?
2. Moet het figuurtje in 3D alle kleren tonen vanaf de start, of beginnen met kleuren en kapsels?
3. Welke gebouwen als eerste in fantasiestijl na Winkel en Spellenhuis?
4. Opdrachten en minikaart in fase 1 of pas in fase 4?


## Stand van de bouw (fase 1, 27 oktober 2026)

- **Schakelaar:** niet per gezin in de database maar per toestel (`src/lib/wereld3d/schakelaar.ts`): `?3d=1` achter het adres van de wereld zet 3D aan op dat toestel (onthouden), `?3d=0` zet uit. Ouders hebben ook de knop "3D proberen" in hun wereldscherm (Wij → De wereld). Er is dus géén aparte route `/wereld3d`: dezelfde route `/kind/:id/wereld` kiest de tekenaar. Een gezinsbrede instelling komt pas bij fase 5 (omschakelen).
- **Opzet in de code:** `Wereld.tsx` kiest tussen `Tekenaar` (canvas) en `Tekenaar3D` (`src/lib/wereld3d/tekenaar.ts`, via een dynamische import zodat three alleen bij 3D geladen wordt). Beide krijgen dezelfde `teken`-aanroep, dus kaartlogica, live, joystick, deuren en vrijgave zijn gedeeld. Geen WebGL of een fout bij het starten: automatisch de gewone wereld.
- **Bestanden:** `bouwstenen.ts` (materialen, afgeronde blokken, doeken, labels), `figuur.ts` (chibi uit de Figuurtje-gegevens), `huis.ts` (huis uit Mijn huis: model, dak, kleuren, deur, schoorsteen, twee tuinstukken), `gebouw.ts` (Winkel, Spellenhuis, spelgebouwen met gouden rand en slot, bouwplaats), `natuur.ts` (bomen als instances, lantaarn, bank, speeltoestellen, hek), `dekking.ts` (`HEEFT_3D`: welke stukken een eigen 3D-vorm hebben; `ontbreekt3D()` meldt de rest) en `wereld3d.test.ts`.
- **Terugval:** elk stuk dat niet in `HEEFT_3D` staat krijgt een eenvoudige vorm; de test bouwt elk stuk van beide catalogi en elk gebouw. Nieuwe stukken van de nachtelijke bouw hoeven niets te doen; de 3D-routine werkt `HEEFT_3D` en de backlog bij.
- **Schermafdrukken:** `node scripts/wereld3d-foto.cjs <map> ArrowDown:9000 ArrowRight:30000` (Vite moet draaien; `NACHT=1` voor donker). Software-WebGL is traag, houd het scherm klein en geef lopen veel tijd.
- **Nog niet in fase 1:** opdrachten, minikaart, camera-instelling, geluid, alle figuur- en huisstukken (zie de backlog), echte 3D-gebouwen in fantasiestijl, test op de oudste tablet en in de Capacitor-WebView.
