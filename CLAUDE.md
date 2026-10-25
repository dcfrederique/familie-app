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
- Zonder goedkeuring: de eenmalige welkomstbonus van 10 sterren op het einde van het welkomstpad, en de sterren uit lerende spelletjes (rekenen, verhalen, kleurplaten, schrijven), die er meteen bij komen binnen het dagplafond voor activiteiten (beide gevraagd door de ouders, 24 oktober 2026).
- Nieuwe spelletjes en stukken voor het figuurtje en Mijn huis koopt het kind zelf met sterren; die gaan van het vrije saldo af (`docs/winkel.md`).
- De ouders kiezen wat in de winkel ligt en per kind wat het ziet (Kinderen → Winkelaanbod, `docs/winkelaanbod.md`); de server controleert. Ze kunnen ook de prijs per item aanpassen. Nieuw aanbod ligt er pas na vrijgave door een ouder.
- Elke tablet hoort bij één kind (`docs/tablet-per-kind.md`); een ander kind kiezen kan alleen met de pincode of vanaf de gsm van een ouder.
- Elke bij- en afschrijving komt in een puntenlog met reden.
- Een ouder kan sterren zelf bijgeven of afnemen (Kinderen en tijd, bron `ouder` in het puntenlog, reden optioneel); afnemen kan niet meer dan het vrije saldo (gereserveerde sterren blijven staan). Het kind krijgt een melding op het startscherm.
- Rustige en lerende activiteiten (verhalen, rekenen, kleurplaten, schrijven) leveren sterren op en tellen **niet** mee voor de app-tijd; spelletjes (memory, penalty's) leveren niets op en tellen **wel** mee.
- Geen beschermde personages of merken in prenten, iconen of thema's (geen Spider-Man, Disney enz.): alles is eigen ontwerp.
- Ouder-acties altijd achter pincode of biometrie, ook op het toestel van een kind.

## Documentatie in deze map

- `docs/spec.md`: functionele specificatie (flows, datamodel, activiteiten, schermen, features per fase, initiële data).
- `docs/ontwerp.md`: visuele stijl (kleuren, lettertypes, iconen, layout per toestel) en link naar het schermontwerp.
- `docs/verhalen.md`: de 30 verhalen die als initiële data in de app moeten.
- `prototypes/spelletjes.html`: werkend prototype van Memory en Rekenen (vanilla JS). Gebruik de logica en de stijl als referentie.
- `prototypes/penalty.html`: werkend prototype van Penalty's (schieten met een veeg, canvas). De keeper-modus moet nog gebouwd worden.
- `docs/hosting.md`: hosting op Azure Static Web Apps, automatisch deployen, en de klikstappen voor de hele Azure-setup (Speech, back-ups).
- `docs/huis.md` en `prototypes/huis.html`: Mijn huis (eigen huis naast het figuurtje, zelf aankleden). Zit in de app: groter bouwen en stukken koopt het kind met sterren in de winkel (Huis-tab), zoals het figuurtje; scherm `src/schermen/Huis.tsx`, data `src/data/huis.ts`, tekening `src/lib/huis/tekenen.ts`.
- `docs/azure-extra.md` en `docs/prenten.md`: Azure-extra's (back-up, leesoefening Ik lees zelf, prenten met Azure OpenAI) en het stappenplan voor de prenten.
- `docs/winkel.md`: sterren inwisselen voor spelletjes en stukken van het figuurtje, en sterren uit spelletjes zonder goedkeuring.
- `docs/winkelaanbod.md`: de ouders geven spelletjes en stukken vrij voor de winkel (in fases) en kiezen per kind wat het ziet.
- `docs/dagelijks-hoera.md`: de eerste keer per dag een hoera-melding voor het kind: nieuw vrijgegeven spelletjes en een gratis cadeautje uit de winkel (figuurtje of huis).
- `docs/tablet-per-kind.md`: tablet vastzetten op één kind en het welkomstpad (figuurtje, verjaardag, thema, welkomstbonus).
- `prototypes/thema-subschermen.html`: mockup van het kinderthema (race, kasteel, tuin; voetbal kwam er later bij) in de subschermen; zit in de app via `src/data/themaPrenten.ts`, `src/schermen/ThemaDelen.tsx` en `src/schermen/thema-schermen.css`.
- `docs/weekmenu.md`: weekmenu met de warme maaltijd per dag (ouderdeel Wij → Weekmenu), de kinderen zien die van vandaag op hun startscherm.
- `docs/ouderdeel.md` en `prototypes/ouderdeel.html`: plan en mockup van het ouderdeel als beheertoepassing met hamburgermenu, en latere onderdelen (onze taken, boodschappen, notities, gezondheid). Fase 1 (menu, zijbalk op pc, IBM Plex Sans, rechte hoeken), Onze taken, Notities, Boodschappen en Gewicht zitten in de app (alleen voor ouder-accounts, RLS); Fitness en Loopschema nog niet.
- `docs/gewicht.md`: Gezondheid → Gewicht en Mijn profiel (wegingen, BMI, grafiek met doel), privé per ouder.
- `docs/schrijven.md`: Schrijven met de vinger (letters, woorden en lijntjes in grijs volgen); gratis leerdeel, 3 sterren per rondje van vijf.
- `docs/chat.md`: chat van de kinderen naar de ouders (per kind aan te zetten, melding op de gsm, stickers voor wie niet leest).
- `docs/boodschappen.md`: boodschappenlijst per winkel (Wij → Boodschappen), winkels en categorieën beheren (Instellingen), ingrediënten vanuit het weekmenu, prijzen na de boodschappen (Afrekenen) en het overzicht Wij → Uitgaven per maand, winkel en categorie.

- Herhaling om de zoveel dagen (25 oktober 2026): Onze taken en de taken van de kinderen hebben naast elke dag/week/maand ook Om de 2 weken en Om de N dagen (N van 2 tot 365, eigen keuze). Onze taken telt vanaf de datum van de vorige beurt (`herhaal_dagen`), kindertaken vanaf `start_dag` (`src/lib/herhaling.ts`, migratie 20261025000500).
- Een kind kan alleen berichten sturen als een ouder de chat voor dat kind aanzette (standaard uit); een tablet ziet enkel het eigen gesprek (`docs/chat.md`).

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

# Nachtelijke uitbreidingen: verhalen en spelletjes

## Doel
Elke nacht wordt de familie-app uitgebreid met 1 nieuw verhaal en 1 nieuw spelletje.
Dit gebeurt in twee fases: eerst uitdenken (ontwerp), daarna coderen (bouw).

## Doelgroep en toon
- Kinderen van 4 tot 8 jaar
- Taal: Nederlands, eenvoudige zinnen, korte alinea's
- Positief en warm; geen enge, gewelddadige of verdrietige inhoud
- Verhalen: 300 tot 600 woorden, met een duidelijk begin, midden en einde
- Spelletjes: eenvoudig, speelbaar op een tablet, zonder lezen speelbaar voor de jongste
- Verhalen zijn meteen beschikbaar. Elk nieuw spelletje en elke nieuwe unlockable
  (stukken voor het figuurtje of Mijn huis) is te koop met sterren in de winkel:
  geef het een `prijs` in de data (zie `src/data/spelletjes.ts`, `src/data/huis.ts`, `docs/winkel.md`) en een rij in
  de servercatalogus (`spel_prijzen`, `figuurtje_stukken` of `huis_stukken` via een nieuwe migratie)
- Nieuwe spelletjes en unlockables liggen **niet** meteen in de winkel: de ouders geven ze vrij in
  Kinderen → Winkelaanbod (`docs/winkelaanbod.md`). Laat `standaard_vrij` dus op `false` (de standaard) en
  meld in het nieuwtje en het bericht aan de ouders dat het spelletje klaarstaat om vrij te geven
- Naast het spelletje mag de nacht ook nieuwe stukken maken voor elk type van het Winkelaanbod: stukken voor
  het figuurtje (`src/data/figuurtje.ts`) en voor Mijn huis (`src/data/huis.ts`, dak, muren, deur, ramen, tuin,
  extraatjes). Kies ze bij het thema van het verhaal (bv. een pompoen in de tuin, een sinterklaasmuts, een
  kerstkrans aan de deur). Elk stuk heeft een prijs in lijn met de bestaande stukken en een rij in de
  servercatalogus (`figuurtje_stukken` of `huis_stukken`, nieuwe migratie; `huis.test.ts` en `figuurtje.test.ts`
  houden data en migratie gelijk). Ze beginnen niet vrijgegeven, net als de spelletjes. Het plan noemt ze
  apart (wat, prijs, tekening), en de bouw doet alleen de stukken uit het plan. Geen beschermde personages.

## Seizoenen en feesten
Laat verhalen (en waar het past ook spelletjes, bv. andere prenten, kleuren of voorwerpen) aansluiten
bij wat er in het echte leven in België komt. Kijk naar de datum van vandaag en kies het feest of
seizoen van de komende weken:
- Herfst (oktober, november): bladeren, paddenstoelen, eekhoorns
- Halloween (laatste week van oktober tot 31 oktober): lief en grappig, verkleden, pompoenen; niets engs
- Sint-Maarten (rond 11 november, waar het past)
- Sinterklaas (half november tot 6 december): schoen zetten, pepernoten, de Sint en zijn paard
- Kerstmis en Nieuwjaar (7 december tot 6 januari): kerstboom, sneeuw, lichtjes, vuurwerk kijken
- Winter (januari, februari): sneeuwman, schaatsen, warme chocomelk
- Valentijn (rond 14 februari): lief zijn voor elkaar, vriendschap
- Carnaval (februari, maart): verkleden, stoet, confetti
- Pasen (de weken voor Pasen): paaseieren zoeken, kuikens, lente
- Lente (maart tot mei): bloemen, vlinders, lammetjes; Moederdag (2e zondag van mei)
- Vaderdag (2e zondag van juni), zomer en vakantie (juli, augustus): zee, zandkastelen, kamperen
- Terug naar school (eind augustus, september)
Niet elk verhaal hoeft een feest te zijn: buiten de feestperiodes past het seizoen. Wissel af,
zodat niet alle verhalen van één periode op elkaar lijken. Gebruik geen beschermde personages.

## Mappenstructuur
- Plannen: `ideeen/YYYY-MM-DD.md`
- Samenvattingen van de bouw: `ideeen/YYYY-MM-DD-resultaat.md`
- Volg voor code de bestaande structuur van verhalen en spellen in het project

## Regels voor de ontwerpfase
- Lees eerst de bestaande verhalen en spellen, zodat er geen herhaling is
- Kies het thema volgens "Seizoenen en feesten" en zet het bovenaan het plan
- Wijzig GEEN code, schrijf alleen het plan
- Stel in het plan een sterrenprijs voor het spelletje voor (in lijn met de bestaande prijzen)
- Het plan bevat: titel, volledige verhaaltekst, spelregels,
  benodigde schermen/componenten en acceptatiecriteria

## Regels voor de bouwfase
- Werk op `main` en push naar `main` zodra lint, tests en build groen zijn
  (een push op `main` gaat na groene CI automatisch online; migraties lopen via CI)
- Bouw alleen wat in het plan van vandaag staat
- Draai de tests; los fouten op voor je stopt
- Als iets niet lukt: noteer het in het resultaatbestand in plaats van te gokken;
  blijft iets rood, push dan geen code maar alleen het resultaatbestand
- Schrijf een korte samenvatting in `ideeen/YYYY-MM-DD-resultaat.md`
- Zet bovenaan `src/data/nieuwtjes.ts` een item voor vandaag (verhaal, spel met prijs, wat open staat);
  ouders lezen het in het ouderdeel onder "Nieuw in de app"

---

## Taakprompt 1 – Ontwerp (bv. 01:00)
Lees CLAUDE.md en volg de regels voor de ontwerpfase. Bekijk de bestaande
verhalen en spellen. Bedenk 1 nieuw verhaal en 1 nieuw spelletje dat bij de
app past. Schrijf het volledige plan naar ideeen/<datum van vandaag>.md.
Wijzig geen code.

## Taakprompt 2 – Bouw (bv. 03:00)
Lees CLAUDE.md en volg de regels voor de bouwfase. Open
ideeen/<datum van vandaag>.md. Als dat bestand niet bestaat, stop dan en
schrijf dat in het resultaatbestand. Implementeer het verhaal (direct beschikbaar)
en het spelletje (te koop met sterren in de winkel), draai lint, tests en build,
schrijf de samenvatting naar ideeen/<datum van vandaag>-resultaat.md en push naar main.
