# Concept: de wereld (de app als halve 3D-wereld)

> Update 27 oktober 2026: een echte 3D-versie is geprobeerd en geschrapt (`docs/wereld-isometrisch.md`). De wereld blijft 2D, in de stijl van nu.

Plan om de wereld levendiger te maken: `docs/wereld-levendig.md`.

Status: idee van Frederique (25 oktober 2026); de eerste versie staat in de app. Besluit van 27 oktober 2026: de wereld gaat naar echte 3D, zie `docs/wereld-3d.md` (plan) en `docs/wereld-isometrisch.md` (onderzoek). Mockup: `prototypes/straatje.html` (online: https://claude.ai/artifact/8yr9BdZx2BcZFZoSvmWiD8). Bouwt voort op `docs/straatje.md` (de straat, het bouwen, de fases) en `docs/huis.md`.

## Het idee

Naast het startscherm krijgen de kinderen een tweede manier om door de app te gaan: **de wereld**. Dat is Ons straatje, maar dan met gebouwen die ingangen zijn naar de bestaande onderdelen van de app. Met één knop op het startscherm ga je naar de wereld, en met één knop in de wereld ben je terug op het startscherm.

- Startscherm (hub): zoals nu, snel en overzichtelijk. Taken, spelletjes, winkel en de rest in tegels. Plus één grote kaart **Naar de wereld**.
- Wereld: bovenaanzicht in de stijl van de app. Het eigen figuurtje loopt (joystick of tikken), kijkt de kant op die het loopt, en stapt.
- Gebouwen als ingangen. In de mockup: de **Winkel** en het **Spellenhuis**, naast de huizen van de kinderen, het speelplein en de vijver. Een **bouwplaats** laat zien dat er later iets bijkomt.
- Door een deur gaan opent het bestaande scherm (de winkel met zijn tabs, de spelletjeslijst). Met "Terug naar de wereld" sta je weer voor de deur. Dezelfde schermen blijven ook bereikbaar vanaf het startscherm, met "Terug naar het startscherm".
- Wisselen gaat met een overgang waarin een kleurcirkel openklapt (zoals Pokémon).

Wat de mockup toont: startscherm met wereldkaart, wereld met Winkel, Spellenhuis en bouwplaats, binnenkomen en teruggaan in beide richtingen, een ouderhuis en live lopen als voorproefje van fase 2 en 3, en een figuurtje dat zich omdraait (rug, zijkant, voorkant) en echt stapt.

## Mijn eerlijke mening

**Het is een goed idee, onder een paar voorwaarden.**

Wat ik sterk vind:

1. **Het geeft alles wat al bestaat één thuis.** Figuurtje, huis, sterren, winkel en spellen zijn nu losse schermen. In een wereld horen ze bij elkaar: je spaart sterren, koopt iets in de winkel, zet het in je tuin en laat het aan je zus zien. Dat maakt Mijn huis en het figuurtje veel meer waard dan nu.
2. **Groei zonder drukte.** Een nieuw spel is een nieuw gebouw. De nachtelijke bouwer (nieuw verhaal en spel) kan dat zichtbaar maken: 's ochtends staat er een nieuw gebouw op de bouwplaats. Dat past bij het ouderscherm Winkelaanbod: "vrijgeven" wordt letterlijk "het gebouw openen".
3. **Het past bij hoe de kinderen zelf praten.** Ze vroegen zelf om rondlopen en bij elkaar op bezoek gaan. Een wereld is dat.
4. **Het hoeft niets te vervangen.** De wereld is een tweede weg naar dezelfde schermen. Daardoor is het risico klein en kan het in fases.

Waar ik voorzichtig mee zou zijn:

1. **Schermtijd.** De kernregel is: 1 ster = 1 minuut extra tijd, en rustige of lerende activiteiten tellen niet mee, spelletjes wel (`CLAUDE.md`). Rondlopen in een wereld moet daar een duidelijke plek in krijgen. Voorstel: de wereld zelf is rustig en telt niet mee. Binnengaan in het Spellenhuis telt wel mee, en in de bibliotheek of het schrijfhuis niet. De regel komt dus bij het gebouw, niet bij de wereld.
2. **Meer tikken en lopen naar je doel.** Een kind van 4 dat naar de winkel wil, mag er niet minuten over doen. Het startscherm blijft daarom de snelle weg en de standaard. In de wereld komt een kaart of een knop "ga naar de winkel" (snel verplaatsen), zodat lopen een keuze is en geen straf.
3. **Elke nieuwe functie moet nu twee keer bestaan.** Een scherm én een gebouw met een deur en een tekening. Dat houd je klein met een **bestemmingenlijst**: één lijst met per bestemming `route`, `naam`, `icoon`, `gebouw` (tekening en plek), `vrijgegeven` en `telt mee voor schermtijd`. Het startscherm en de wereld lezen allebei die lijst. Zonder zo'n lijst gaat het uiteenlopen.
4. **Volledig 3D niet nodig.** Het bovenaanzicht in vlakke stijl is precies goed. Echte 3D kost veel (prestaties op de tablets, tekenwerk) zonder dat de kinderen er iets voor terugkrijgen. De "halve 3D" zit in de camera en de gebouwen, niet in de engine.
5. **Tabletprestaties.** Canvas met één gerenderde ondergrond en plaatjes uit SVG draait goed (de mockup doet dat), maar test op de echte tablets, ook op de oudste. Live lopen (fase 2) is het zwaarste deel.
6. **Veiligheid en rust.** Bezoeken en bouwen zonder chat of vrij tekstvak. Bezoeken is alleen kijken. De brievenbus-idee komt pas met moderatie (`docs/chat.md`).

Kort: doen, in fases, met het startscherm als thuis en de wereld als uitje.

## Hoe het in elkaar zit

### Bestemmingen

Eén lijst in `src/data/bestemmingen.ts` met bijvoorbeeld:

| Id | Naam | Route | Gebouw | Telt mee voor schermtijd |
| --- | --- | --- | --- | --- |
| `winkel` | Winkel | `/kind/:id/winkel` | winkelpand | nee |
| `spellen` | Spellenhuis | `/kind/:id/spelletjes` | paars huis met gamepad | ja (voor de spelletjes zelf) |
| `verhalen` | Verhalen | `/kind/:id/verhalen` | bibliotheek | nee |
| `kleurplaten` | Kleurplaten | `/kind/:id/kleurplaten` | atelier | nee |
| `schrijven` | Schrijven | `/kind/:id/schrijven` | schrijfhuisje | nee |
| `huis` | Mijn huis | `/kind/:id/huis` | het eigen huis | nee |

Het startscherm toont de bestemmingen als tegels, de wereld als gebouwen. Winkelaanbod bepaalt wat vrij is. Een gebouw dat nog niet vrij is, staat als bouwplaats ("Binnenkort").

### Wisselen

- Startscherm → wereld: knop "Naar de wereld". Het kind start altijd voor zijn eigen deur (positie wordt niet opgeslagen).
- Wereld → startscherm: knop "Startscherm" rechtsboven.
- Wereld → gebouw → terug: je staat weer voor de deur.
- Routes: `/kind/:id/wereld` (en `/ouder/wereld`). De bestaande schermen krijgen een parameter `van=wereld` zodat de terugknop weet waar naartoe.

### Opbouw in fases

| Fase | Wat | Inhoud |
| --- | --- | --- |
| 0 | Voorbereiding | Bestemmingenlijst; startscherm leest eruit. Geen zichtbare verandering. |
| 1 | De wereld, alleen | Straat met de drie huizen, Winkel en Spellenhuis, speelplein, vijver. Binnenkomen in het eigen huis en bij een ander (alleen kijken). Joystick en tikken. Dag en nacht. |
| 2 | Zelf bouwen | Dingen plaatsen in de eigen tuin (zie `docs/straatje.md`). |
| 3 | Live samen | Je ziet elkaar rondlopen. |
| 4 | Ouders | Een ouderhuis aan het einde van de straat. |
| 5 | Uitbreiden | Bibliotheek (verhalen), atelier (kleurplaten), schrijfhuisje, seizoenen, brievenbus, winkeltje dat zelf een gebouw wordt. |

Het ouderscherm Winkelaanbod bepaalt per kind wat in de wereld te zien is, zoals nu voor de winkel. Het "nieuw in de app"-nieuwtje blijft verplicht bij elke stap (`src/data/nieuwtjes.ts`).

### Besturing en voorkomen

- Joystick plus tikken op de grond. Het figuurtje kijkt de kant op die het loopt: gezicht naar je toe bij omlaag, de rug bij omhoog, de zijkant bij links en rechts, met stappende voeten.
- Een kaart of snelknop om direct naar een gebouw te gaan.
- Voor Feline: grote gebouwen met een duidelijke prent, korte voorgelezen zinnen, geen lezen nodig.
- `prefers-reduced-motion`: geen rook, geen eendjes die zwemmen.

## Open vragen

1. Telt de tijd in de wereld mee? Voorstel: de wereld niet, de spelletjes in het Spellenhuis wel (zoals nu).
2. Moet de wereld het standaard startscherm worden zodra hij af is, of blijft het huidige startscherm de standaard met de wereld als keuze? Voorstel: startscherm blijft de standaard; het kind kan in Mijn thema kiezen waar de app opent.
3. Welke gebouwen na Winkel en Spellenhuis: bibliotheek, atelier of schrijfhuisje?
4. Mag de wereld op de gsm van de ouders ook (zoals Springland)?
5. Willen de ouders dat het nieuwe gebouwen-van-de-nacht 's ochtends als bouwplaats zichtbaar is, of liever pas na vrijgave in Winkelaanbod?

## Vervolgopdrachten voor deze week (idee van Frederique, 25 oktober 2026, nog niet bouwen)

Frederique is gewonnen voor het hele wereldidee en voor de wisseling met een hubweergave. Daarbij komen twee opdrachten die we deze week kunnen aanpakken, na de eerste versie:

1. **Springland wordt een apart deel van de wereld.** Springland is dan geen losse tegel meer, maar een gebied in de wereld (een poort, een berg of een eiland) waar je naartoe wandelt.
2. **(Vervallen 27 oktober 2026: de landkaart van Springland blijft zoals ze is, de poort in het dorp opent ze gewoon; zie `docs/wereld-dorp.md`.)** ~~De landkaart van Springland gaat op in de wereld.~~ Oorspronkelijk: De huidige kaart met levels (`SpringKaart.tsx`, het figuurtje wandelt naar het level) wordt een deel van dezelfde wereld, zodat navigeren door de wereld en door Springland één geheel is. Eén camera, één figuurtje, één joystick.

Wat daarvoor moet gebeuren (voorstel): Springland als bestemming in de bestemmingenlijst met een gebied in plaats van een gebouw; de levelknopen als plekjes op de wereldkaart; het vrijspelen (`levelOpen`) blijft zoals het is; en de hub blijft de snelle weg naar Springland.

## Live samen (fase 2, gebouwd 25 oktober 2026)

Wie in de wereld is, ziet de anderen van het gezin rondlopen, met hun naam boven het hoofd. Ook de ouders doen mee (menu Wij → De wereld in). Alle code staat in `src/lib/wereld/live.ts`.

- **Vervoer:** Supabase Realtime Broadcast op het kanaal `wereld:<gezin-id>`. Geen presence en geen database. Er wordt niets bewaard. Zonder Supabase (demo) loopt het via een `BroadcastChannel` tussen tabbladen.
- **Hoe vaak:** een positie gaat alleen weg terwijl je loopt, hoogstens twee keer per seconde (`MIN_TUSSENTIJD` = 500 ms), plus één laatste bericht als je stopt. Wie stilstaat stuurt niets, op een levensteken om de 45 seconden na. Een nieuw binnengekomene stuurt "hallo" en krijgt van elke aanwezige één antwoord met zijn plek. Bij een verborgen tabblad of sluiten gaat "weg" en stopt het sturen.
- **Bij de ontvanger:** het figuurtje schuift vloeiend naar de laatst ontvangen plek, kijkt de kant op waarheen het loopt en stapt. Wie 2 minuten niets liet horen, verdwijnt.
- **Veiligheid:** elk bericht wordt gecontroleerd (`leesBericht`); alleen leden van het eigen gezin worden getoond. Er is geen chat en geen tekst in de berichten.
- **Voorwaarde in Supabase:** het kanaal is publiek (de anonieme sessie van de tablets mag meedoen). Staat in Project Settings → Realtime de optie "Allow public access" uit, dan werkt live niet, maar de wereld blijft verder gewoon werken.

### Verbruik bekijken

Het gratis plan geeft 2 miljoen Realtime-berichten per maand. Een bericht telt één keer bij het versturen en één keer per ontvanger. Schatting: twee spelers die samen een kwartier per dag lopen komen op ongeveer 1 miljoen per maand. Kijk in het Supabase-dashboard onder **Reports → Realtime** (aantal berichten en pieken) en onder **Settings → Billing → Usage** (maandtotaal tegenover de 2 miljoen). Frederique evalueert na een week; zit het te hoog, dan verlagen we de frequentie (`MIN_TUSSENTIJD` naar 1000) of sturen we alleen als een ander in beeld is.

## Nieuwe spelletjes in de wereld (regel van Frederique, 25 oktober 2026)

- **Nachtelijke routine:** elk nieuw spelletje krijgt ook een gebouw in de wereld (huisje of een andere passende vorm), met een **gouden rand** zolang het nieuw is en een **slot** zolang het kind het niet kocht. De regel dat de ouders het eerst vrijgeven in Winkelaanbod blijft gelden: wat niet vrij is, staat er niet.
- **Later (plan, nog niet bouwen):** een aparte routine zet de bestaande spelletjes zo visueel mogelijk in de wereld. Springland wordt bijvoorbeeld een springkasteel-gebied waar het in dat werelddeel verdergaat (zie ook de vervolgopdrachten hierboven).

## Gebouwen van spelletjes (gebouwd 26 oktober 2026)

Elk nieuw spelletje van de nachtelijke bouw heeft een eigen gebouw in de wereld. Voorbeeld: het **bladerhuisje** (Bladeren sorteren).

- **Data:** een rij in `gebouwen` (`src/data/wereld.ts`) met `spel` (de spelsleutel), `pad` (gelijk aan de spelsleutel, dus de route `/kind/:id/<sleutel>`) en `nieuwSinds` (datum). Tekening in `gebouwTekening` (`src/data/wereldPrenten.ts`, viewBox 400 × 300, voet op y = 285). Een nieuw spel is dus een rij en een tekening, geen aparte code.
- **Zichtbaar:** `gebouwenVoor()` geeft de gebouwen die één kind ziet. Een gebouw van een spel staat er alleen als de ouders het spel voor dit kind vrijgaven (`inAanbod`, dezelfde regel als de winkel). Een ouder in de wereld ziet de gebouwen van wat in de winkel ligt. Zonder gegevens (offline of een fout) blijven ze weg. De lijst wordt bij het openen van de wereld vastgezet (`WereldLader`), zodat de kaart niet verspringt terwijl je loopt.
- **Gouden rand:** de eerste `NIEUW_DAGEN` (14) dagen na `nieuwSinds` straalt het gebouw goud (gloed rond de tekening, pulseert niet bij "minder beweging").
- **Slot:** zolang het kind het spel niet kocht (`spelIsVrij`, ook met de eigen prijs van de ouders en "alles vrij") is het gebouw grijzer met een gouden slotje op de deur; naar binnen gaan zegt "Dit spel kost sterren. Koop het eerst in de winkel!" (voorgelezen voor wie niet leest). Na de aankoop verdwijnt het slot.
- **Plek:** een gebouw boven de hoofdstraat krijgt vanzelf een stoepje naar de straat (`wegen()` in `src/lib/wereld/kaart.ts`). `kaart.test.ts` controleert dat elk spelgebouw bereikbaar is vanaf elk huis en een vrije deurmat heeft. Bezet (in tegels): Winkel (21,3; 21,5), Spellenhuis (48; 21), Bouwplaats (52,7; 21), Bladerhuisje (51,5; 11,6), Eekhoornboom (47,2; 11,6), Schoorsteenhuisje (41,8; 11,6), Pakjeshuis (31,5; 11,6), Kerstboomhuis (17,5; 11,6), Iglo (5,5; 11,6), Verkleedtent (24; 11,6), Heggendoolhof (11,5; 11,6), Winterhol (36,5; 21,5), Kastanjeboom (3,5; 21,5), Pakjesmagazijn (43; 21,5), Lampionnenatelier (16; 21,5), Inpakhuis (9; 21,5). Zoek voor een volgend gebouw een open plek langs de hoofdstraat en test hem.
- **Terugknop:** een spel met een eigen gebouw geeft `wereldDeur` aan `SpelKader`, zodat "terug" in de wereld voor de deur uitkomt.


## Lopen: tegel voor tegel of vrij (27 oktober 2026)

Het figuurtje loopt standaard tegel voor tegel (`tegelStap` in `src/lib/wereld/kaart.ts`: 0,24 s per tegel, korte draai bij een nieuwe richting, wippen tegen een muur, tikken loopt een tegelpad af, deuren pas bij het bereiken van een tegel; de deurmat is dan de tegel onder de deur). Een ouder kan per kind terug naar vrij lopen: Kinderen → Lopen in de wereld (kolom `gebruikers.wereld_lopen`, migratie 20261027000200). Het figuurtje wordt in drie stukken getekend (lijf, twee armen) zodat de armen zwaaien en één voet per stap omhoog gaat. De proef staat in `prototypes/wereld-beweging/`.

## Het poppetje in de wereld

Sinds 27 oktober 2026 wordt het figuurtje in de wereld getekend als "chibi met rand" (`src/lib/wereld/chibi.ts`, gekozen door Frederique uit drie voorstellen in `prototypes/figuurtje-stijlen/`). Het leest dezelfde `Figuurtje`-gegevens (kleuren, kapsel, hoofddeksel, shirt, broek, schoenen, gezicht, bril, cape) en loopt met een voetwissel per stap en tegengesteld zwaaiende armen. De SVG-tekening in de Kleerkast blijft ongewijzigd.
