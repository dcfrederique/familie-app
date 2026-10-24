# Familie-app: taken, sterren en spelen

Gezinsapp waarin drie kinderen sterren verdienen met taken en rustige activiteiten, en die sterren inwisselen voor extra schermtijd. Een ouder keurt alles goed en zet de minuten zelf in Google Family Link: er is **geen** koppeling met Google.

Taal van de app en van de code-commentaren: **Nederlands (Vlaams)**.

## Gebruikers

| Wie | Toestel | Aanpak |
| --- | --- | --- |
| Luca (8) | Tablet, liggend | Leest zelf; thema dino's en auto's; rekenen tot 100 en tot 1000, tafels, penalty's |
| Yuna (6) | Tablet, liggend | Korte woorden met grote prentjes, voorleesknop; rekenen tot 20 |
| Feline (4) | Tablet, liggend | Werkt zonder lezen: prentjes, voorleesknop per taak, sterren tellen; vraagt zelf geen tijd aan |
| 2 ouders | Gsm | Taken toewijzen, goedkeuren, tijd toekennen, activiteiten per kind beheren |

## Kernregels (niet zonder overleg wijzigen)

- Punten heten voor de kinderen **sterren**. 1 ster = 1 minuut extra tijd.
- Sterren voor taken pas na goedkeuring van een ouder; geen tijd zonder dat een ouder die geeft.
- Tijd aanvragen in blokken van 15, 30 of 60 min; sterren worden gereserveerd, pas afgeschreven als de ouder op **Toegekend** tikt. **Nu niet** of vervallen = sterren terug.
- Dagplafond (voorstel 60 min extra per kind) en tijdvenster (7:00 tot 20:00) worden **op de server** gecontroleerd.
- Afkeuren kost niets, geen strafpunten.
- Zonder goedkeuring: de eenmalige welkomstbonus van 10 sterren op het einde van het welkomstpad, en de sterren uit lerende spelletjes (rekenen, verhalen, kleurplaten), die er meteen bij komen binnen het dagplafond voor activiteiten (beide gevraagd door de ouders, 24 oktober 2026).
- Nieuwe spelletjes en stukken voor het figuurtje koopt het kind zelf met sterren; die gaan van het vrije saldo af (`docs/winkel.md`).
- Elke tablet hoort bij één kind (`docs/tablet-per-kind.md`); een ander kind kiezen kan alleen met de pincode of vanaf de gsm van een ouder.
- Elke bij- en afschrijving komt in een puntenlog met reden.
- Rustige en lerende activiteiten (verhalen, rekenen, kleurplaten) leveren sterren op en tellen **niet** mee voor de app-tijd; spelletjes (memory, penalty's) leveren niets op en tellen **wel** mee.
- Geen beschermde personages of merken in prenten, iconen of thema's (geen Spider-Man, Disney enz.): alles is eigen ontwerp.
- Ouder-acties altijd achter pincode of biometrie, ook op het toestel van een kind.

## Documentatie in deze map

- `docs/spec.md`: functionele specificatie (flows, datamodel, activiteiten, schermen, features per fase, initiële data).
- `docs/ontwerp.md`: visuele stijl (kleuren, lettertypes, iconen, layout per toestel) en link naar het schermontwerp.
- `docs/verhalen.md`: de 30 verhalen die als initiële data in de app moeten.
- `prototypes/spelletjes.html`: werkend prototype van Memory en Rekenen (vanilla JS). Gebruik de logica en de stijl als referentie.
- `prototypes/penalty.html`: werkend prototype van Penalty's (schieten met een veeg, canvas). De keeper-modus moet nog gebouwd worden.
- `docs/hosting.md`: hosting op Azure Static Web Apps, automatisch deployen, en de klikstappen voor de hele Azure-setup (Speech, back-ups).
- `docs/huis.md` en `prototypes/huis.html`: use case en klikbaar prototype van Mijn huis (huis groeit met verdiende sterren, zelf aankleden); nog niet in de app.
- `docs/azure-extra.md` en `docs/prenten.md`: Azure-extra's (back-up, leesoefening Ik lees zelf, prenten met Azure OpenAI) en het stappenplan voor de prenten.
- `docs/winkel.md`: sterren inwisselen voor spelletjes en stukken van het figuurtje, en sterren uit spelletjes zonder goedkeuring.
- `docs/tablet-per-kind.md`: tablet vastzetten op één kind en het welkomstpad (figuurtje, verjaardag, thema, welkomstbonus).
- `prototypes/thema-subschermen.html`: mockup van het kinderthema (race, kasteel, tuin) in de subschermen; zit in de app via `src/data/themaPrenten.ts`, `src/schermen/ThemaDelen.tsx` en `src/schermen/thema-schermen.css`.
- `docs/ouderdeel.md` en `prototypes/ouderdeel.html`: plan en mockup van het ouderdeel als beheertoepassing met hamburgermenu, en latere onderdelen (onze taken, boodschappen, notities, gezondheid). Fase 1 (menu, zijbalk op pc, IBM Plex Sans, rechte hoeken) zit in de app; de latere onderdelen nog niet.

## Beslist (21 oktober 2026)

1. Platform: PWA met React, Vite en TypeScript.
2. Backend: Supabase (gratis plan); saldo, dagplafond en tijdvenster als Postgres-functies.
3. Meldingen naar ouders: web-push (alle toestellen zijn Android; geen Telegram).
4. Tijdvenster voor aanvragen: 7:00 tot 20:00. Overige waarden zoals in `docs/spec.md`.
5. MVP in twee delen: eerst de sterrenlus (taken, goedkeuren, tijd aanvragen, saldo), daarna activiteiten en verhalen.
6. Hosting: Azure Static Web Apps (Free), elke commit op `main` gaat na groene CI automatisch online (beslist 24 oktober 2026, `docs/hosting.md`).

## Werkwijze

- Commando's: `npm run dev`, `npm test`, `npm run lint`, `npm run build`.
- Spelregels staan in `src/lib/regels.ts` (app) en in de Postgres-functies van `supabase/migrations/` (server, leidend).
- Gegevens via `src/lib/bron/`: `supabaseBron` met database, `demoBron` in het geheugen als `.env.local` geen key heeft (pincode demo: 1234).
- Databasetests: `scripts/test-db.sh` (Postgres 16).
- Bouw in fases: eerst de MVP uit `docs/spec.md`, daarna fase 2.
- Kindschermen eerst ontwerpen voor tablet liggend (1194 × 834), ouderschermen voor gsm (390 × 844).
- Grote aanraakvlakken: minstens 48 px voor ouders, 64 px of meer voor kinderen.
- Licht en donker thema ondersteunen.
- Schrijf tests voor de sterrenlogica (reserveren, toekennen, terugboeken, dagplafond).
- Content (verhalen, taken, spelletjes-niveaus) als data, niet hardcoded in componenten.
