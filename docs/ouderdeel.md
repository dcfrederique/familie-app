# Ouderdeel: van beheerscherm naar familie-assistent

Plan van 24 oktober 2026. Klikbare mockup: `prototypes/ouderdeel.html`.

## Waarom

Het ouderdeel is nu vier tabs onderaan (Vandaag, Goedkeuren, Taken, Kinderen) met Toestellen bovenaan. Dat volstaat voor de sterrenlus, maar er komen functies bij die niets met de kinderen te maken hebben: notities, taken voor de ouders, een boodschappenlijst en later gewicht, fitness en een loopschema. Vier tabs groeien niet mee. Daarom krijgt het ouderdeel de vorm van een beheertoepassing op de gsm: een balk bovenaan met links een hamburgermenu dat alle onderdelen in groepen toont.

De kinderkant verandert niet.

## Lay-out

- **Balk bovenaan** (vast): links de hamburgerknop (48 × 48), in het midden de titel van het scherm, rechts een belletje met het aantal dingen dat op goedkeuring wacht. Tikken op het belletje opent Goedkeuren; zo blijft de belangrijkste actie met één tik bereikbaar.
- **Menu** schuift van links in, 300 px breed, met een donkere laag over de rest. Sluiten met een tik naast het menu, een veeg naar links of de terugknop van Android.
- **Geen tabs meer onderaan.** Het vrijgekomen plekje gebruiken schermen voor hun eigen hoofdknop (zoals **Nieuwe taak**), als zwevende knop rechtsonder.
- Kaarten, kleuren en lettertypes blijven zoals in `docs/ontwerp.md`. De ouderkant krijgt wel een rustiger, zakelijker toon: minder kleurvlakken, meer lijsten met rijen.

## Menu

| Groep | Onderdeel | Nu | Toelichting |
| --- | --- | --- | --- |
| | **Vandaag** | bestaat | Startscherm. Wat op je wacht, per kind sterren, taken en extra tijd. Later ook een blok "Onze dag" (zie verder). |
| | **Goedkeuren** | bestaat | Met teller. Taken, activiteiten en tijdverzoeken. |
| Kinderen | **Taken van de kinderen** | bestaat (nu "Taken") | Hernoemd, omdat er later ook taken voor de ouders komen. |
| | **Kinderen en tijd** | bestaat (nu "Kinderen") | Tijd geven, kan lezen, vraagt zelf tijd, stem, figuurtje. |
| | **Spelregels** | bestaat (nu onderaan Kinderen) | Dagplafond en tijdvenster als eigen scherm. |
| Wij | **Onze taken** | komt later | Taken voor de ouders, zonder sterren. |
| | **Boodschappen** | komt later | Gedeelde lijst. |
| | **Notities** | komt later | Losse notities en lijstjes. |
| Gezondheid | **Gewicht** | komt nog later | Per ouder, privé. |
| | **Fitness** | komt nog later | Trainingen bijhouden. |
| | **Loopschema** | komt nog later | Opbouwschema, bijvoorbeeld 0 naar 5 km. |
| Instellingen | **Toestellen en meldingen** | bestaat | Koppelcode, tablets, meldingen aanzetten. |
| | **Pincode** | bestaat (nu op Vandaag) | Pincode instellen of wijzigen. |

Onderaan het menu: wie aangemeld is, en **Naar de kinderen** (vergrendelt het ouderdeel op een tablet, zoals de huidige knop Kinderen).

Onderdelen die nog niet bestaan staan grijs in het menu met het label **Komt later**. In de mockup kun je ze toch openen om een schets te zien; in de echte app laten we ze weg tot ze gebouwd zijn, of tonen we ze grijs zonder link. Dat beslissen we bij het bouwen.

## Toekomstige onderdelen (summier)

Alles hieronder is alleen voor de ouders. De tabletaccounts van de kinderen mogen deze tabellen niet lezen, ook niet met de pincode: dat regelen we met RLS op `soort = 'ouder'`.

### Onze taken

- Taak met titel, optioneel een datum, wie (ik, partner of samen) en herhaling (eenmalig, wekelijks, maandelijks).
- Afvinken zonder goedkeuring en zonder sterren. Gedane taken zakken weg in "Gedaan deze week".
- Voorbeelden: vuilnis buiten zetten (dinsdag), schoolreis betalen, auto naar keuring.
- Tabel `ouder_taken` (gezin_id, titel, datum, wie, herhaling, gedaan_op, gedaan_door).

### Boodschappen

- Eén gedeelde lijst per gezin, live gelijk op beide gsm's (Supabase Realtime).
- Snel toevoegen bovenaan, met suggesties uit wat je vroeger kocht. Afvinken in de winkel, afgevinkte items zakken onderaan en verdwijnen na een dag.
- Optioneel een groep (groenten, zuivel, drogisterij) zodat de lijst in winkelvolgorde staat.
- Later: een recept uit de app van de kinderen (Koken) toevoegen aan de lijst.
- Tabel `boodschappen` (gezin_id, item, hoeveelheid, groep, afgevinkt_op, toegevoegd_door).

### Notities

- Notitie met titel en tekst, of een lijstje met vinkjes. Vastpinnen bovenaan.
- Gedeeld met de partner, of privé.
- Voorbeelden: maten van de kinderen, cadeau-ideeën, wifi-code oma.
- Tabel `notities` (gezin_id, eigenaar, gedeeld, titel, tekst, vastgezet, bijgewerkt_op).

### Gezondheid: gewicht, fitness en loopschema

- **Privé per ouder** als standaard. Je partner ziet het enkel als je dat aanzet.
- Gewicht: een meting per dag, grafiek van 30 en 90 dagen, optioneel een doel.
- Fitness: training met soort, duur en een korte notitie; weekoverzicht.
- Loopschema: een opbouwschema in weken (bijvoorbeeld 3 keer per week, afwisselend lopen en wandelen). Vandaag-scherm toont de volgende training. Afvinken na het lopen.
- Tabellen `metingen`, `trainingen`, `loopschema` (alle met eigenaar en `gedeeld`).

### Vandaag als familie-assistent

Op termijn wordt Vandaag het overzicht van de hele dag: eerst wat op goedkeuring wacht en de kinderen, daaronder een blok **Onze dag** met de taken van vandaag, het aantal items op de boodschappenlijst en de training van vandaag. Elk blok verschijnt pas als het onderdeel bestaat.

## Fases

1. **Nieuwe lay-out** (alleen frontend): `OuderKader` krijgt de balk en het menu, tabs onderaan verdwijnen, Spelregels en Pincode worden eigen schermen. Geen databasewijziging. Klein werk.
2. **Boodschappen en Onze taken**: de twee onderdelen die het meest dagelijks gebruikt worden. Elk een migratie en een scherm.
3. **Notities**.
4. **Gezondheid**: gewicht eerst, dan loopschema, dan fitness.

Elke fase kan apart naar main.

## Open vragen (beslissen bij het bouwen)

- Grijze "komt later"-items in het echte menu tonen of weglaten?
- Gezondheid standaard privé (voorstel) of standaard gedeeld?
- Mag het ouderdeel op de tablet van een kind (met pincode) ook de nieuwe onderdelen tonen, of enkel de kinderonderdelen? Voorstel: op een tablet enkel Kinderen en Instellingen.
