# Voorraad en recepten

Vraag van Frederique (27 oktober 2026): de voorraad registreren (hoeveel drank enz. er nog is), gekoppeld aan de boodschappenlijst (die past de voorraad automatisch aan) en aan het weekmenu (de voorraad daalt; daarvoor zijn recepten nodig).

## Ouderdeel (alleen gsm van een ouder)

- **Wij → Voorraad** (`/ouder/voorraad`, `src/schermen/Voorraad.tsx`): artikelen per plek (Koelkast, Diepvries, Kast, Kelder, Andere) met min en plus (stap 1, bij kg en l een half, bij g en ml honderd). Tik op een artikel voor naam, aantal, eenheid, plek, minimum, "een aankoop brengt", winkel, categorie en houdbaar tot. Onderaan: voor hoeveel personen we koken, en het logboek ("Wat is er veranderd?").
- **Wij → Recepten** (`/ouder/recepten`, `src/schermen/Recepten.tsx`): per gerecht de ingrediënten met hoeveelheid, voor een aantal personen. De naam moet gelijk zijn aan het gerecht in het weekmenu (hoofdletters tellen niet). Gerechten van het weekmenu zonder recept staan als snelknop bovenaan. Een nieuw ingrediënt maakt meteen een voorraadartikel (aantal 0).

## Koppelingen (op de server, `supabase/migrations/20261027000700_voorraad.sql`)

- **Boodschappen → voorraad**: een boodschap die op gekocht gaat (afvinken of afrekenen) telt `aantal × aankoop_aantal` bij het artikel met dezelfde naam (hoofdletters en spaties tellen niet; `aantal` is het aantal van de eenheidsprijs, anders 1). Terugzetten haalt het weer af (`boodschappen.voorraad_bijgeboekt`). Een trigger, dus het klopt ook vanuit Afrekenen.
- **Minimum → boodschappen**: valt het aantal tot het minimum of lager (door een daling), dan komt het artikel op de lijst, met zijn winkel en categorie, tenzij het er al open staat. Terugzetten van een aankoop doet dit niet.
- **Weekmenu → voorraad**: in Voorraad staat voor elke dag tot en met vandaag met een recept een kaart "Gekookt, boek af / Niet gekookt". Gekookt boekt de ingrediënten af (hoeveelheid × eters / personen van het recept); Niet gekookt laat de voorraad staan. Per dag één keer (`voorraad_gekookt`).
- **Tekort voor de week**: de ingrediënten van de komende dagen (nog niet afgeboekt) bij elkaar min wat er ligt; het tekort kan met één tik op de lijst, tenzij het er al open staat.

## Keuzes

- Afboeken vraagt een tik (geen automatisme op de dag zelf): het gezin eet soms buiten de deur of anders dan gepland, en een vergeten tik kost niets.
- Hoeveelheden van een recept staan in de eenheid van het artikel; geen omrekening tussen g en kg (dat kan later).
- Het aantal gaat nooit onder 0; het logboek toont wat echt veranderde.
- Alles is ouder-only (RLS), de tablets zien niets. Tests: `supabase/tests/voorraad.test.sql`, `src/lib/voorraad.test.ts`, `e2e/voorraad.spec.ts`.
