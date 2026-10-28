# Ouderdeel: van beheerscherm naar familie-assistent

Plan van 24 oktober 2026. Klikbare mockup: `prototypes/ouderdeel.html`.

## Waarom

Het ouderdeel is nu vier tabs onderaan (Vandaag, Goedkeuren, Taken, Kinderen) met Toestellen bovenaan. Dat volstaat voor de sterrenlus, maar er komen functies bij die niets met de kinderen te maken hebben: notities, taken voor de ouders, een boodschappenlijst en later gewicht, fitness en een loopschema. Vier tabs groeien niet mee. Daarom krijgt het ouderdeel de vorm van een beheertoepassing op de gsm: een balk bovenaan met links een hamburgermenu dat alle onderdelen in groepen toont.

De kinderkant verandert niet.

## Lay-out

- **Balk bovenaan** (vast): links de hamburgerknop (48 × 48), in het midden de titel van het scherm, rechts een belletje met het aantal dingen dat op goedkeuring wacht. Tikken op het belletje opent Goedkeuren; zo blijft de belangrijkste actie met één tik bereikbaar.
- **Menu** schuift van links in, 300 px breed, met een donkere laag over de rest. Sluiten met een tik naast het menu, een veeg naar links of de terugknop van Android.
- **Geen tabs meer onderaan.** Het vrijgekomen plekje gebruiken schermen voor hun eigen hoofdknop (zoals **Nieuwe taak**), als zwevende knop rechtsonder.
- **Lettertype**: de ouderkant gebruikt **IBM Plex Sans** (400 tot 600), tekst 15 px, titels 16 tot 20 px, cijfers met `tabular-nums`. De kinderschermen blijven speels met Baloo 2 en Nunito.
- Kleuren blijven zoals in `docs/ontwerp.md`, maar de ouderkant is strak en zakelijk (24 oktober 2026, gevraagd door Frederique): **geen afgeronde hoeken** (alleen de avatars van de kinderen zijn rond), dunne randen, een accentstreep links voor wat aandacht vraagt.
- Menu: groepen gescheiden door een dunne lijn, het actieve item met een blauwe streep links, onder Kinderen elk kind met het hoofd van zijn figuurtje en zijn sterren (tik = naar zijn kaart in Kinderen en tijd).

## Op een groot scherm (pc)

Vanaf 1024 px breed staat het menu vast links als zijbalk (288 px), de balk toont enkel de titel en het belletje, en de kaarten (kinderen, taken, goedkeuringen, instellingen) staan in een raster van kolommen van minstens 380 px. Meldingen en de knoppen bovenaan een scherm blijven over de hele breedte.

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
| Gezondheid | **Gewicht** | bestaat (`docs/gewicht.md`) | Per ouder, privé; met Mijn profiel. |
| | **Lopen** | bestaat (`docs/lopen.md`) | Lopen zelf invoeren (Strava-koppeling geschrapt, zie `docs/lopen.md`). Het opbouwschema komt nog later. |
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

**Zo gebouwd (24 oktober 2026):** snel toevoegen bovenaan (zonder datum, voor samen) of met **Met datum…** het volledige formulier. Groepen Te laat, Vandaag, Deze week, Later, Zonder datum en Gedaan deze week. Een taak die elke dag, week of maand terugkomt heeft een datum (elke dag sinds migratie `20261024000800_onze_taken_elke_dag`); afvinken maakt meteen de volgende keer aan (Postgres-functie `ouder_taak_afvinken`), terugzetten haalt die weer weg. `wie` is de id van een ouder, of leeg voor samen. In het menu staat bij Onze taken een teller met jouw taken (en die van samen) voor vandaag en eerder; op **Vandaag** staat het blok **Jouw taken** met die taken chronologisch, afvinken kan er meteen (`src/lib/onzetaken.ts`).

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

**Zo gebouwd (24 oktober 2026):** **Nieuwe notitie** (tekst) of **Nieuw lijstje** (regels met vinkjes, kolom `lijst` als JSON). Vinkjes zet je meteen in het overzicht. Vastzetten bovenaan, standaard gedeeld; alleen de eigenaar kan een notitie privé maken, de partner kan een gedeelde notitie aanpassen of weggooien. Zoeken verschijnt vanaf 5 notities.

### Gezondheid: gewicht, fitness en loopschema

- **Privé per ouder** als standaard. Je partner ziet het enkel als je dat aanzet.
- Gewicht: een meting per dag, grafiek van 30 en 90 dagen, optioneel een doel.
- Fitness: training met soort, duur en een korte notitie; weekoverzicht.
- Loopschema: uitgewerkt plan in `docs/loopschema.md` (looptracking met Capacitor, "light Strava" voor de ouders). Oorspronkelijk idee: een opbouwschema in weken (bijvoorbeeld 3 keer per week, afwisselend lopen en wandelen). Vandaag-scherm toont de volgende training. Afvinken na het lopen.
- Tabellen `wegingen` en `gezondheid_profielen` (gebouwd, privé zonder delen), later `trainingen`, `loopschema`.

### Vandaag als familie-assistent

Op termijn wordt Vandaag het overzicht van de hele dag: eerst wat op goedkeuring wacht en de kinderen, daaronder een blok **Onze dag** met de taken van vandaag, het aantal items op de boodschappenlijst en de training van vandaag. Elk blok verschijnt pas als het onderdeel bestaat.

## Fases

1. **Nieuwe lay-out** (alleen frontend, **gebouwd op 24 oktober 2026**): `OuderKader` krijgt de balk en het menu (`src/data/ouderMenu.ts`, stijl in `src/schermen/ouder.css`), tabs onderaan verdwijnen, Spelregels (`/ouder/spelregels`) en Pincode (`/ouder/pincode`) worden eigen schermen. Op een tablet van een kind tonen we Wij, Gezondheid en Pincode niet. Geen databasewijziging.
2. **Boodschappen en Onze taken**: de twee onderdelen die het meest dagelijks gebruikt worden. Elk een migratie en een scherm. **Onze taken is gebouwd op 24 oktober 2026** (`/ouder/onze-taken`, `src/schermen/OnzeTaken.tsx`); Boodschappen nog niet.
3. **Notities**: **gebouwd op 24 oktober 2026** (`/ouder/notities`, `src/schermen/Notities.tsx`), samen met Onze taken in migratie `20261024000700_onze_taken_notities`.
4. **Gezondheid**: gewicht eerst, dan loopschema, dan fitness. **Gewicht en Mijn profiel zijn gebouwd op 24 oktober 2026** (`docs/gewicht.md`, migratie `20261024001000_gewicht`).

Elke fase kan apart naar main.

## Open vragen (beslissen bij het bouwen)

- Grijze "komt later"-items in het echte menu tonen of weglaten? Voorlopig tonen we ze grijs, zonder link.
- Gezondheid standaard privé (voorstel) of standaard gedeeld?
- Mag het ouderdeel op de tablet van een kind (met pincode) ook de nieuwe onderdelen tonen, of enkel de kinderonderdelen? Voorstel: op een tablet enkel Kinderen en Instellingen.
