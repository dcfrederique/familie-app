# Concept: de wereld (de app als halve 3D-wereld)

Status: idee van Frederique (25 oktober 2026), nog niet gebouwd. Mockup: `prototypes/straatje.html` (online: https://claude.ai/artifact/8yr9BdZx2BcZFZoSvmWiD8). Bouwt voort op `docs/straatje.md` (de straat, het bouwen, de fases) en `docs/huis.md`.

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
