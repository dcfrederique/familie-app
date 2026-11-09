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

## Het gezin

Wij zijn met 6: twee ouders, Luca, Yuna, Feline en **Maxim** (anderhalf jaar). Maxim heeft geen account en komt niet voor in de app (geen sterren, taken of tablet), maar hij eet wel mee: reken voor eten, boodschappen en voorraad (`docs/voorraad.md`) met 6 personen.

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
- Sterrenpot (7 november 2026): sterren in de eigen pot of de gezinspot zijn niet vrij (niet te koop, niet als tijd te vragen); het kind stort alleen, **alleen een ouder haalt sterren eruit** en tikt op Gedaan om af te schrijven (`docs/sterrenpot-dagboek.md`).
- Een ouder kan sterren zelf bijgeven of afnemen (Kinderen en tijd, bron `ouder` in het puntenlog, reden optioneel); afnemen kan niet meer dan het vrije saldo (gereserveerde sterren blijven staan). Het kind krijgt een melding op het startscherm.
- Rustige en lerende activiteiten (verhalen, rekenen, kleurplaten, schrijven) leveren sterren op en tellen **niet** mee voor de app-tijd; spelletjes (memory, penalty's) leveren niets op en tellen **wel** mee.
- Geen beschermde personages of merken in prenten, iconen of thema's (geen Spider-Man, Disney enz.): alles is eigen ontwerp.
- **Elke nieuwe functie of zichtbare verandering voor kinderen of ouders krijgt in dezelfde push een item bovenaan `src/data/nieuwtjes.ts`** (ouderdeel "Nieuw in de app", `/ouder/nieuw`), met het volgende oplopende versienummer (`versie: '0.N'`, hoogste nummer + 1, de test controleert het). Geen nieuwtje = niet klaar (harde regel van Frederique, 25 oktober 2026). Geldt ook voor de nachtelijke bouw en voor kleine functies; pure herstellingen alleen als ouders er iets van merken.
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
- `docs/weekmenu.md`: weekmenu met de warme maaltijd per dag (ouderdeel Wij → Weekmenu), de kinderen zien die van vandaag op hun startscherm; sinds 31 oktober 2026 ook ontbijt, middag en vieruurtje, standaardmaaltijden en een receptkiezer (afboeken blijft met een tik, deelrecepten in `docs/voorraad.md`).
- `docs/thema-nieuw.md`: zes kinderthema's die volledig uit data bestaan (`src/data/dataThemas.ts`: ruimte, zee, dier, wolk, bak, kliniek) en hoe je er een toevoegt; kleuren, prent, tegels, voortgang, slot en feest uit één rij.
- `docs/ouderdeel.md` en `prototypes/ouderdeel.html`: plan en mockup van het ouderdeel als beheertoepassing met hamburgermenu, en latere onderdelen (onze taken, boodschappen, notities, gezondheid). Fase 1 (menu, zijbalk op pc, IBM Plex Sans, rechte hoeken), Onze taken, Notities, Boodschappen en Gewicht zitten in de app (alleen voor ouder-accounts, RLS); Fitness nog niet. Lopen, Analyse en Loopschema zijn op 29 oktober 2026 weggehaald: Trackd houdt dat lokaal bij.
- `docs/gewicht.md`: Gezondheid → Gewicht en Mijn profiel (wegingen, BMI, grafiek met doel), privé per ouder.
- `docs/springland.md`: Springland, het platformspel met het eigen figuurtje: landkaart met werelden, hartjes en vlaggetjes, de baas op het einde van elke wereld, levels vrijspelen, en hoe je een level of wereld toevoegt (ook de nachtelijke bouw; levels mogen soms moeilijk zijn).
- `docs/schrijven.md`: Schrijven met de vinger (letters, woorden en lijntjes in grijs volgen); gratis leerdeel, 3 sterren per rondje van vijf.
- `docs/sterrenlimiet.md`: de ouders stellen per lerend spelletje (rekenen, verhaal, zelf gelezen, kleurplaat, schrijven) een daglimiet in sterren in, voor iedereen of per kind (Spelregels); de server past hem toe in `activiteit_opslaan`.
- `docs/wereld-isometrisch.md`: onderzoek naar 2.5D/3D voor de wereld (27 oktober 2026). Een 3D-versie (Three.js) is gebouwd en proefgespeeld, maar Frederique **schrapte het 3D-concept volledig** (27 oktober 2026: speelt niet goed, kinderen vinden het niet leuk). **Bouw geen 3D**; de wereld blijft 2D (canvas, `docs/wereld.md`), met de stijl van nu. Wel mag het figuurtje in de wereld (uiterlijk en beweging) verbeterd worden.
- `docs/wereld-25d.md`: de wereld in 2.5D (schuin bovenaanzicht, gewoon 2D-canvas, **geen** Three.js of WebGL); proef zit in de app als schakelaar in Instellingen → Wereldinstellingen (`src/lib/wereld/tekenen25.ts`, `camera.ts`, `weergave.ts`, nieuwtje 0.48), standaard staat de wereld nog plat. Dit wijkt van "de stijl van nu" af tot Frederique kiest.
- `docs/wereld-dorp.md`: de wereld in acht gebieden die apart laden (poorten, grindroutes), en Kaart bewerken voor de ouders (Wij → Kaart bewerken): huizen, gebouwen, decor en paden verplaatsen. De standaardplekken staan in `src/lib/wereld/gebieden.ts` (`standaardItems`), wat de ouders wijzigen in `gezinnen.wereld_kaart`; de nachtroutine bouwt de gebieden vol via `standaardItems`.
- `docs/chat.md`: chat van de kinderen naar de ouders (per kind aan te zetten, melding op de gsm, stickers voor wie niet leest).
- `docs/voorraad.md`: voorraad en recepten (Wij → Voorraad, Wij → Recepten): afvinken op de boodschappenlijst telt bij, minimum zet een artikel op de lijst, Gekookt boekt het recept van een weekmenu-dag af, tekort voor de week; alles op de server (migratie 20261027000700).
- `docs/huisdier.md`: Mijn huisdier (7 november 2026): kind kiest een diertje uit 12, het groeit door goedgekeurde taken (pootjes) en wordt met sterren verzorgd (eten 2, wassen 1, knuffelen gratis, daglimiet); wordt nooit ziek; ouders zetten het aan en kiezen de regels (Kinderen → Huisdier).
- `docs/sterrenpot-dagboek.md` en `prototypes/sterrenpot-dagboek.html`: ontwerp (7 november 2026, nog niet gebouwd) van de Sterrenpot (sparen voor een doel van de ouders) en het Dagboek (Mijn dag, gevoel per dag, voor de ouders leesbaar).
- `docs/boodschappen.md`: boodschappenlijst per winkel (Wij → Boodschappen), winkels en categorieën beheren (Instellingen), ingrediënten vanuit het weekmenu, prijzen na de boodschappen (Afrekenen) en het overzicht Wij → Uitgaven per maand, winkel en categorie.

- Menu herindelen (28 oktober 2026): kinderen hebben op Thuis, Taken, Spelen (`/kind/:id/kiezen`) en Ik (`/kind/:id/ik`) een vaste onderbalk (`KindBalk.tsx`, `KindHubs.tsx`); de kop heeft geen rondjes meer voor huis, thema, chat en slot. Ouders: groepen Kinderen, Spelen en wereld, Huishouden, Gezondheid, Instellingen in `src/data/ouderMenu.ts`; drie menustijlen (Snel standaard, Klassiek, Onderbalk) kiest een ouder per toestel in Mijn profiel (`src/lib/menustijl.ts`, hubpagina's `OuderHub.tsx`). Nieuwe kindschermen die in de balk horen: zet `<KindBalk>` onderaan.
- Spelletjes proberen (25 oktober 2026): ouderdeel Kinderen → Spelletjes proberen (`src/schermen/Proberen.tsx`, `src/lib/proef.tsx`). Een ouder speelt als een gekozen kind elk spelletje en leerdeel, beeldvullend, ook wat niet in de winkel ligt; `proefBron` blokkeert alles wat voor het kind bewaard wordt (sterren, activiteitlog, aankopen, chat). Nieuwe kindschermen met schrijfacties: zet ze in `GEBLOKKEERD` in proef.tsx.
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

# Nachtelijke uitbreidingen: verhalen, kleurplaten en spelletjes

## Doel
Elke nacht wordt de familie-app uitgebreid met 1 nieuw verhaal, 1 nieuwe kleurplaat en 1 nieuw spelletje
(de routine is er om elke nacht nieuwe content voor de kinderen te maken; vraag van Frederique, 27 oktober 2026).
Dit gebeurt in twee fases: eerst uitdenken (ontwerp), daarna coderen (bouw).

## Doelgroep en toon
- Kinderen van 4 tot 8 jaar
- Taal: Nederlands, eenvoudige zinnen, korte alinea's
- Positief en warm; geen enge, gewelddadige of verdrietige inhoud
- Verhalen: 300 tot 600 woorden, met een duidelijk begin, midden en einde
- Spelletjes: eenvoudig, speelbaar op een tablet, zonder lezen speelbaar voor de jongste
- Niveaus: makkelijk en middel blijven eenvoudig (Feline en Yuna); de stand **moeilijk** moet een pak moeilijker zijn
  (Luca van 8 vindt de spelletjes te simpel, Frederique 30 oktober 2026): grotere velden, meer stukken, vooruit denken, minder hints
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

- Springland: elke nacht komt er ook **één nieuw level** bij, passend bij het thema van de nacht. Volg
  `docs/springland.md`, "Een level toevoegen": achteraan `springLevelLijst` in `src/data/springen.ts`, in de laatste
  wereld; een wereld heeft vijf gewone levels en als zesde de **baas** (`docs/springland.md`, "Baas"): heeft de laatste
  wereld vijf gewone levels maar nog geen baas, bouw dan die baas (arena met `B`, `baas` in de data) in plaats van een gewoon
  level, en is de wereld vol, begin dan eerst een nieuwe wereld achteraan `springWerelden`. Levels hebben nu hartjes
  (2, bij Vanzelf lopen 3), beestjes en de baas kosten een hartje en bij 0 ga je terug naar het laatste vlaggetje. **Vijanden
  verslaan door erop te springen (slak 1 hup, egel rolt op en 2 hups, vogel fladdert), `docs/springland.md` "Vijanden"; een nieuw level mag die soorten (en een nieuwe soort) gebruiken. Een level
  mag soms moeilijk zijn** (ongeveer om de twee, drie levels een pittig level, zie "Moeilijkheid" in `docs/springland.md`),
  maar het blijft haalbaar met alleen tikken (Vanzelf lopen voor Feline en Yuna). **Elke baas heeft zijn eigen aanval en zwak punt** (`docs/springland.md`, "Baas"; Frederique 9 november 2026): bedenk voor een nieuwe baas een patroon dat nog niet bestaat. De wereldkaart (van bovenaf,
  het figuurtje wandelt naar het level) en het vrijspelen volgen vanzelf uit de data. Bedenk het level in het plan
  (naam, wereld, stijl, beestje, fruit, schets van het verloop). De bouw moet het robotje het nieuwe level laten
  uitspelen (`npx vitest run src/lib/spelletjes/springen.test.ts`); lukt dat niet, pas het level aan tot het haalbaar
  is. Een level is geen unlockable in de winkel: het gaat open door het vorige uit te spelen. Noem het in het nieuwtje.
- De wereld (`docs/wereld.md`): de nacht plaatst **geen** gebouw meer in De wereld (Frederique, 9 november 2026). Nieuwe spelletjes
  krijgen dus geen rij in `gebouwen` en geen tekening in `wereldPrenten.ts`; ze staan alleen in het spelmenu en de winkel. Het plan en het
  nieuwtje noemen geen wereldgebouw. Eventuele plaatsing van spelletjes in de wereld doet Frederique later zelf of via een aparte routine.

## Wekelijks: drie nieuwe kinderthema's (Frederique, 7 november 2026)
Elke **zaterdag** (`TZ=Europe/Brussels date +%u` = 6) maakt de nacht erbij **drie nieuwe thema's**, één met de smaak van
elk kind (Luca 8, Yuna 6, Feline 4). Eerste keer: zaterdag 14 november 2026. Een thema is één rij in `src/data/dataThemas.ts` plus de
sleutel in `Kleur` (`gezin.ts`), `Banner` en `bannerVoorKleur` (`thema.ts`) en een migratie die de sleutels toevoegt aan
`welkom_afronden` en `thema_kiezen`; alles staat in `docs/thema-nieuw.md` (volg het, schrijf geen eigen css). Kies geen thema dat al bestaat
(race, kasteel, tuin, voetbal, ruimte, zee, dier, wolk, bak, kliniek), geen beschermde personages of merken. Een thema is geen winkelitem
en heeft geen vrijgave: kinderen kiezen het zelf bij Mijn thema, ouders bij Kinderen. Ontwerpfase: de drie thema's in het plan (naam,
sleutel, kleuren licht en donker, schets van de prent). Bouwfase: bouwen, controleren op tablet (1194 × 834) en lage gsm liggend
(844 × 390), licht en donker, zonder scrollen, en een nieuwtje met het volgende versienummer (kan hetzelfde nieuwtje van de nacht zijn).

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

- Kleurplaten: elke nacht komt er **één nieuwe kleurplaat** bij, in het thema van de nacht (zie "Seizoenen en feesten"),
  net als het verhaal meteen beschikbaar (gratis, geen winkel, geen vrijgave). Eigen ontwerp in de stijl van de bestaande
  platen in `src/data/kleurplaten.ts`: vlakken in viewBox 400 × 300 (`r`, `c`, `e`, `d`), minstens 8 vlakken, grote vlakken die
  een kind van 4 met één tik kan inkleuren, lijnen alleen als versiering, een ingekleurd `voorbeeld` met één kleur per vlak
  (`kleurplaten.test.ts` controleert dat) en een unieke `sleutel`. Plan: titel, sleutel, wat er op staat en een schets van
  de vlakken. Geen beschermde personages.

## Mappenstructuur
- Plannen: `ideeen/YYYY-MM-DD.md`
- Samenvattingen van de bouw: `ideeen/YYYY-MM-DD-resultaat.md`
- Volg voor code de bestaande structuur van verhalen en spellen in het project

## Regels voor de ontwerpfase
- Lees eerst de bestaande verhalen en spellen, zodat er geen herhaling is
- Kies het thema volgens "Seizoenen en feesten" en zet het bovenaan het plan
- Wijzig GEEN code, schrijf alleen het plan
- Stel in het plan een sterrenprijs voor het spelletje voor (in lijn met de bestaande prijzen)
- Het plan bevat: titel, volledige verhaaltekst, de kleurplaat van de nacht, spelregels,
  benodigde schermen/componenten en acceptatiecriteria, en het nieuwe level voor Springland

## Regels voor de bouwfase
- Werk op `main` en push naar `main` zodra lint, tests en build groen zijn
  (een push op `main` gaat na groene CI automatisch online; migraties lopen via CI)
- Bouw alleen wat in het plan van vandaag staat
- Draai de tests; los fouten op voor je stopt
- Als iets niet lukt: noteer het in het resultaatbestand in plaats van te gokken;
  blijft iets rood, push dan geen code maar alleen het resultaatbestand
- Schrijf een korte samenvatting in `ideeen/YYYY-MM-DD-resultaat.md`
- Zet bovenaan `src/data/nieuwtjes.ts` een item voor vandaag (verhaal, kleurplaat, spel met prijs, wat open staat) met het
  volgende oplopende `versie` (harde kernregel); ouders lezen het in het ouderdeel onder "Nieuw in de app"

---

## Taakprompt 1 – Ontwerp (bv. 01:00)
Lees CLAUDE.md en volg de regels voor de ontwerpfase. Bekijk de bestaande
verhalen en spellen. Bedenk 1 nieuw verhaal, 1 nieuwe kleurplaat, 1 nieuw spelletje en 1 nieuw level
voor Springland dat bij de app past. Schrijf het volledige plan naar ideeen/<datum van vandaag>.md.
Wijzig geen code.

## Taakprompt 2 – Bouw (bv. 03:00)
Lees CLAUDE.md en volg de regels voor de bouwfase. Open
ideeen/<datum van vandaag>.md. Als dat bestand niet bestaat, stop dan en
schrijf dat in het resultaatbestand. Implementeer het verhaal en de kleurplaat (direct beschikbaar),
het spelletje (te koop met sterren in de winkel) en het nieuwe level van Springland, draai lint, tests en build,
schrijf de samenvatting naar ideeen/<datum van vandaag>-resultaat.md en push naar main.

---

# Nachtelijke schermcontrole (05:07)

Doel: geen enkel kinderscherm mag op een tablet scrollen, liggend of staand (vraag van Frederique, 25 oktober 2026),
en elke nacht worden de schermen een beetje mooier. Loopt na de nachtelijke bouw (01:07 ontwerp, 03:07 bouw).

## Twee fases (Frederique, 27 oktober 2026)
- **Fase 1, rondgang**: zolang `e2e/schermen-open.ts` nog schermen bevat, doorloopt de nacht alle kinderschermen en
  herstelt telkens wat nog open staat (zie Werkwijze).
- **Fase 2, enkel nieuwigheden**: zodra `e2e/schermen-open.ts` leeg is, kijkt de nacht alleen nog de kinderschermen na die
  sinds de vorige schermcontrole nieuw of veranderd zijn (`git log` sinds het vorige `ideeen/*-schermen.md`, vooral de
  nachtelijke bouw). Nieuw scherm: in `SCHERMEN` zetten, meten met `--scherm` op alle kinderen en toestellen (ook de
  speltoestand), herstellen tot het past op tablets en gsm liggend. De e2e-schermtests (elke nacht) bewaken de rest.
  Geen nieuwigheden: alleen een kort verslag en een melding.

## Werkwijze
- `npm ci`, dan `npx vite --port 5173 --host 127.0.0.1 &` (demo zonder Supabase) en
  `node scripts/schermcontrole.cjs --json /tmp/uitslag.json` (Playwright staat globaal in de cloudomgeving).
  Het script doorloopt per kind (Luca, Yuna, Feline) het welkomstpad, met elke dag een ander thema, en meet elk kindscherm
  op tien gangbare tablets, liggend en staand (iPad 9.7/10.2/Air/Pro 11/Pro 12.9, Galaxy Tab A/S6 Lite/S7/S9+, Fire 7/HD 10),
  plus twee gsm's liggend (ter info). Het meldt pagina's of vakken die scrollen en knoppen of tekst buiten beeld.
  Opties: `--kind luca`, `--scherm huis,figuurtje`, `--fotos map --alle-fotos` (schermafdrukken), `--thema-nr N`.
- Herstel eerst wat op een tablet scrolt; kies per nacht de schermen met de meeste meldingen. Bekijk de schermafdrukken
  zelf: passen is niet genoeg, het moet er ook goed uitzien (geen ovale tegels, geen afgeknipte tekst, knoppen ≥ 64 px).
- Middelen die al bestaan: `Bladzijden` met `maat` (meet zelf hoeveel tegels passen, `naast` zet de pijlen opzij) in plaats
  van scrollen; `SpelKader vol` + `.kind-vol` om een scherm precies de hoogte te laten vullen; media query
  `(min-width: 600px) and (min-height: 560px)` = tablet (ook staand), `(orientation: portrait)` voor staand.
- Daarna kleine visuele details toevoegen aan een of twee schermen (een prentje, een animatie, een thema-accent), in de stijl
  van de app en met `prefers-reduced-motion`. Geen nieuwe functies, geen spelregels of prijzen wijzigen.
- Gsm liggend (844 × 390, 915 × 412) is het tweede doel (Frederique, 25 oktober 2026): eerst moeten de tablets passen,
  daarna maakt elke nacht ook een paar schermen passend op een liggende gsm, tot alles zonder scrollen kan.
  Doel (Frederique): op de gsm liggend ziet een kinderscherm er hetzelfde uit als op de tablet (zelfde opmaak, zelfde
  onderdelen op dezelfde plaats), alleen kleiner; lettergroottes, marges en maten mogen daarvoor mee krimpen.
  Een liggende gsm valt buiten de tabletquery (hoogte < 560 px). Een idee is schalen (bv. CSS `zoom` op `.kind`
  = schermhoogte / ±600 px), maar kies zelf wat het beste werkt (ook clamp()/dvh-maten of een eigen query
  `(max-height: 500px) and (orientation: landscape)` die dezelfde tabletopmaak met kleinere maten oplegt).
  Let op: tikvlakken niet onder ±44 px, canvas-spelletjes en Bladzijden moeten correct meten.
- Bewust scrollend (meldingen mogen blijven): de landkaart van Springland (`.spring-kaart`, slepen) en de chatgeschiedenis.

## Playwright-tests (`npm run test:e2e`, elke nacht)
- Opgezet 26-27 oktober 2026 op vraag van Frederique. `playwright.config.ts` start de vite-demo zelf; tests in `e2e/`.
  Lokaal in de cloud: `npx playwright test --workers=6` (±5 min). Ze lopen **niet** bij elke push (te traag, Frederique
  27 oktober 2026): de nachtelijke schermcontrole draait ze zelf voor ze pusht, en de workflow `.github/workflows/e2e.yml`
  draait ze elke nacht om 4:41 UTC en op aanvraag (Actions → E2E). Ze blokkeren het deployen niet; rood meldt de
  schermcontrole in de thread en herstelt ze de volgende nacht eerst.
- `e2e/werking.spec.ts`: welkomstpad met welkomstbonus, sterrenlus (taak indienen, tijd aanvragen, ouder keurt goed en
  kent toe, pincode als die gevraagd wordt), winkel kopen, Mijn huis en figuurtje bewaren, een verhaal openen.
  Vaste klok (10:00) wegens het tijdvenster. Nieuwe kinderflows krijgen hier een test.
- `e2e/schermen.spec.ts`: per kind en toestel (tablets liggend en staand, gsm liggend) elk kinderscherm uit
  `SCHERMEN`, met dezelfde meetcode als het nachtelijke verslag (`scripts/schermmeting.cjs`) en vast toeval.
  Wat nog niet past, staat in `e2e/schermen-open.ts` ('kind scherm BxH'). Een nieuw probleem maakt de test rood, en
  een scherm dat intussen past ook ("haal het weg uit schermen-open.ts"; in de E2E-workflow enkel een waarschuwing, want schermen op het randje meten daar soms net anders): zo krimpt de lijst elke nacht.
  Lijst opnieuw opmaken: `OPEN_OPNEMEN=1 npx playwright test e2e/schermen.spec.ts --workers=6` en
  `node scripts/open-bijwerken.cjs ideeen/<datum>-schermen.md`. Een nieuw kinderscherm: zet het in `SCHERMEN`.
- De lijst mag alleen krimpen. Iets erbij zetten mag enkel voor een nieuw scherm of toestel, nooit om een rode test
  stil te krijgen; herstel dan het scherm.

## Afronden
- Lint, tests, `npx playwright test` en build groen; dan pas push naar `main`. Rood en niet op te lossen: alleen het verslag pushen.
- Verslag in `ideeen/YYYY-MM-DD-schermen.md`: wat hersteld is (voor en na, aantal passende schermen), welke details erbij
  kwamen en wat nog open staat (de volgende nacht begint daar).
- Merken ouders er iets van, dan een item bovenaan `src/data/nieuwtjes.ts` met het volgende `versie` (harde kernregel).
- Korte melding aan Frederique in de thread "Elke nacht schermen nakijken en verfijnen".

## Taakprompt 3 – Schermcontrole (05:07)
Lees CLAUDE.md en volg "Nachtelijke schermcontrole" (kijk eerst in welke fase je zit; in fase 2 alleen de nieuwigheden). Haal main binnen, draai de Playwright-tests en
scripts/schermcontrole.cjs op alle kinderen,
herstel wat op een tablet scrolt of buiten beeld valt (begin bij de schermen met de meeste meldingen), daarna een paar
schermen voor de gsm liggend, voeg een paar kleine
visuele details toe, haal wat nu past uit e2e/schermen-open.ts, draai lint, tests, e2e en build, schrijf ideeen/<datum van vandaag>-schermen.md en push naar main.
