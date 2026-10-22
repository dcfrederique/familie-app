# Functionele specificatie

## Doel

Kinderen verdienen extra schermtijd door taken te doen. Sterren worden minuten; een ouder zet die minuten zelf in Google Family Link en bevestigt dat in de app. De app houdt alleen taken, sterren, verzoeken en activiteiten bij.

## Flow

1. Kind vinkt een taak af (eventueel met foto als bewijs).
2. Ouder keurt goed (sterren op saldo) of keurt af (geen sterren, geen straf).
3. Kind vraagt extra tijd aan: 15, 30 of 60 minuten; die sterren worden gereserveerd.
4. Ouder krijgt een melding met naam, minuten en saldo.
5. Ouder zet de minuten in Family Link en tikt **Toegekend**: sterren definitief af.
6. Of de ouder tikt **Nu niet** (met optionele reden): sterren terug.
7. Een verzoek dat niet wordt behandeld, vervalt na bv. 2 uur of om 20:00: sterren terug.

Feline vraagt zelf geen tijd aan; dat beslissen de ouders.

## Datamodel (minimaal)

- `Gebruiker`: naam, avatar, rol (kind / ouder), pincode, thema (kind), niveaus per spel
- `Taak`: titel, prentje, sterren, herhaling (eenmalig / elke dag / schooldagen), foto nodig, herinnering, voor welke kinderen
- `Inzending`: kind, taak, tijdstip, foto, status (ingediend / goedgekeurd / afgekeurd)
- `Tijdverzoek`: kind, sterren, minuten, status (aangevraagd / toegekend / afgewezen / vervallen), reden
- `Puntenlog`: elke bij- en afschrijving met reden en bron
- `Activiteitlog`: kind, activiteit, inhoud (bv. welk verhaal), duur, sterren
- `Instellingen per kind`: activiteiten aan/uit, app-tijd per dag, tijdvenster
- `Verhaal`: titel, reeks, leeftijd, thema, bladzijden (tekst, prent, optioneel geluid)

## Spelregels sterren

| Regel | Waarde (voorstel) |
| --- | --- |
| Omrekening | 1 ster = 1 minuut |
| Blokken | 15, 30 of 60 minuten |
| Dagplafond extra tijd | 60 min per kind |
| Tijdvenster aanvragen | 7:00 tot 20:00 |
| Maximum spaarsaldo | 300 sterren |
| Sterren uit activiteiten per dag | 20 per kind; ook die pas na goedkeuring van een ouder |

## Activiteiten

| Activiteit | Hoe het werkt | Sterren | Telt mee voor app-tijd |
| --- | --- | --- | --- |
| Memory | 3, 6 of 8 paren met eigen prentjes; beurten, gevonden paren, record per kind en niveau | Geen | Ja |
| Penalty's: schieten (Luca) | Veeg over de bal: richting = hoek, lengte = hoogte, snelheid = kracht, boogje = effect; reeks van 5 tegen keeper (Makkelijk, Normaal, Pro); goal 1 punt, in de gouden roos 2 punten; record per niveau | Geen | Ja |
| Penalty's: keepen (Luca) | Computer-spits neemt aanloop en schiet; Luca duikt door te vegen (richting = hoek, schuin omhoog = hoge bal, korte tik omlaag = blijven staan); timing telt; reeks van 5, redding 1 punt, uit de hoek 2; zelfde niveaus; later een echte reeks om beurten | Geen | Ja |
| Rekenen | 10 sommen per rondje; niveaus Tellen en Tot 10 (3 antwoordknoppen, voor Feline), Tot 20 (Yuna), Tot 100 en Tafels (Luca, cijferklavier); bolletje per som: groen = in één keer goed, oranje = tweede poging | 1 per 2 sommen in één keer goed | Nee |
| Verhalen | Tekening + grote tekst per bladzijde; Voorlezen laat het voorgelezen woord oplichten; voor Feline en Yuna standaard aan | 5 per uitgelezen verhaal | Nee |
| Kleurplaten | Lijndiktes, vlak inkleuren, gum, ongedaan maken, grote kleurknoppen | 3 per afgewerkte plaat | Nee |
| Tekenen | Vrij tekenen; tekeningen gaan naar het gezinsalbum | Geen | Nee |

## Schermen

Kinderen (tablet liggend):

1. Wie speelt er? Profielkeuze, kleine knop met slotje voor ouders.
2. Startscherm Yuna: taken als grote kaarten (te doen / wacht op mama of papa / gedaan), Spelen en maken, Extra tijd vragen.
3. Startscherm Feline: zonder lezen, voorleesknop per taak, groot vinkje, sterren als rij.
4. Tekenen en kleurplaten.
5. Sterren inwisselen voor tijd (opties boven het dagplafond uitgeschakeld).
6. Startscherm Luca: thema dino's en auto's (banner met raceauto nr. 8, dino, vulkaan), knop Thema, met Rekenen.
7. Memory, Rekenen, Penalty's, Verhaal lezen.

Ouders (gsm), onderaan navigatie Vandaag / Goedkeuren / Taken / Kinderen:

1. Vandaag: wat op jou wacht, per kind sterren, taken en app-tijd.
2. Goedkeuren: tijdverzoeken (met herinnering eerst Family Link in te stellen) en taken met foto; alles tegelijk goedkeuren.
3. Taak toevoegen: naam, prentje, sterren, voor wie, hoe vaak, foto als bewijs, herinnering.
4. Kinderen: per kind activiteiten aan/uit, app-tijd per dag, tijdvenster, wat er vandaag gedaan is.

## Features per fase

| Feature | Fase |
| --- | --- |
| Gezinsprofielen, takenlijst, goedkeuren met één tik, tijd aanvragen, saldo en geschiedenis | MVP |
| Activiteiten: memory, rekenen, penalty's (schieten en keepen), verhalen, kleurplaten, tekenen | MVP |
| Werken zonder lezen voor Feline | MVP |
| Thema kiezen per kind, herinneringen, reeksen en badges, andere beloningen, klusjesbord, beurtrol, weekoverzicht, gezinsalbum | Fase 2 |
| Meer spelletjes en verhalen, gezinsdoel, taken voorstellen, pauzemodus, widget | Later |

## Initiële data (verplicht in de eerste versie)

- [ ] Alle 30 verhalen uit `docs/verhalen.md` volledig uitschrijven per bladzijde, volgens de afspraken per reeks.
- [ ] Per bladzijde een prent in de stijl van het voorbeeld: vlakke SVG-vormen, effen kleuren, eenvoudige achtergrond, geen beschermde personages.
- [ ] Dirk de draak, Mo de muis en Pip de pinguïn zien er in elk verhaal hetzelfde uit (één tekening per personage, hergebruikt).
- [ ] Elk verhaal als apart databestand (bv. JSON): titel, reeks, leeftijd, thema, bladzijden met tekst en prent.
- [ ] Voorlezen per bladzijde; plaats voor eigen opnames later.
- [ ] Voorbeeldtaken (zie hieronder) en de spelletjes Memory, Rekenen en Penalty's (schieten én keepen).

Voorbeeldtaken:

| Taak | Sterren | Herhaling | Foto |
| --- | --- | --- | --- |
| Tafel dekken / afruimen | 5 | Elke dag | Nee |
| Kamer opruimen | 10 | Elke dag | Ja |
| Huiswerk maken | 10 | Schooldagen | Nee |
| Vaatwasser uitruimen | 5 | Elke dag | Nee |
| 15 à 20 minuten lezen | 10 | Elke dag | Nee |
| Tanden poetsen | 5 | Elke dag | Nee |
| Speelgoed opruimen | 5 | Elke dag | Nee |
| Plantjes water geven | 5 | Elke dag | Nee |
| Fiets binnenzetten | 5 | Elke dag | Nee |
| Pyjama aandoen (Feline) | 5 | Elke dag | Nee |

## Beveiliging

- Kind-account: taken indienen en tijd aanvragen; alleen ouder-account kan goedkeuren en instellingen wijzigen.
- Saldo, dagplafond en tijdvenster worden op de server gecontroleerd.
- Foto's en tekeningen blijven privé binnen het gezin.
