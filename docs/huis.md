# Use case: Mijn huis

Status: idee van de kinderen zelf (23 oktober 2026), in de app gebouwd op 24 oktober 2026. Prototype: `prototypes/huis.html` (ook online: https://claude.ai/artifact/3kD5SUF2qVNoVKD4auxdyz). Code: `src/data/huis.ts`, `src/lib/huis/tekenen.ts`, `src/schermen/Huis.tsx`, migratie `20261024001700_mijn_huis.sql`.

## Doel

Naast hun figuurtje willen de kinderen een eigen huis. Ze starten met een klein hutje en zien het groeien naarmate ze sterren verdienen: een huisje, een verdieping erbij, een garage, en ten slotte een huis met een toren. Ondertussen kleden ze het zelf aan: dak, muren, deur, ramen, tuin en extraatjes. Het figuurtje woont in het huis en staat altijd voor de deur.

Het huis werkt zoals het figuurtje in de winkel (`docs/winkel.md`): het hutje en de basisstukken zijn gratis, grotere huizen en andere stukken koopt het kind met sterren van zijn vrije saldo. Wie niet leest betaalt de helft. De ouders kiezen wat er in de winkel ligt (`docs/winkelaanbod.md`, tab Huis); zoals elk nieuw aanbod ligt het huis er pas na vrijgave. (Het eerste voorstel met mijlpalen op ooit verdiende sterren is vervangen door de winkel.)

## Actoren

| Wie | Wat |
| --- | --- |
| Kind (Luca, Yuna, Feline) | Bouwt en kleedt het eigen huis aan, zo vaak als het wil |
| Ouder | Kan een huis terugzetten; dezelfde schakelaar "alles vrij" als bij figuurtje en spelletjes geldt ook voor het huis |

## Waar het huis verschijnt

1. **Startscherm** van elk kind: het huis in het klein in een rondje naast het figuurtje, bovenaan. Tik erop om naar het huis te gaan.
2. **Mijn huis**: meteen de bouwplaats (zoals de kleerkast): links het huis met de tuin, het figuurtje voor de deur en de lucht (dag, of nacht in het donkere thema en bij het racethema), rechts de keuzes. Kop en kleuren volgen het thema van het kind.
3. **Winkel**: tab Mijn huis met alles wat te koop is; na het kopen gaat het kind naar zijn huis met het stuk al gekozen.
4. **Feestscherm** als het kind een groter huis koopt.
4. Later (idee): **Ons straatje**, de drie huizen naast elkaar als nieuwe versie van Wie speelt er?

## Hoofdscenario: huis aankleden

1. Het kind tikt op het huisje naast zijn figuurtje. De **bouwplaats** opent: links het huis, rechts de categorieën en een raster met keuzes (met bladzijden als er meer zijn, zoals in de tuin).
2. Een stuk op slot toont slotje en prijs. Genoeg sterren: tikken vraagt "kopen?". Te weinig: het huis toont even hoe het zou staan, met "nog zoveel sterren sparen".
3. Elke keuze toont het eigen huis van het kind met die keuze, zodat het meteen ziet hoe het staat.
4. Een tik past het huis links meteen aan (met een klein wiebeltje). Bij dak, muren en deur staat een rij kleurbolletjes.
5. In **Tuin** kiest het kind twee dingen (links en rechts van het huis); een derde keuze vervangt de oudste. In **Extra** mag alles tegelijk aan.
6. **Ongedaan maken**, **Verrassing** (dobbelsteen) en **Klaar** werken zoals in de kleerkast.

## Groeien: van hutje naar torenhuis

Een groter huis koopt het kind in de winkel of op de bouwplaats (tab Huis). Elke grootte blijft daarna van het kind: wie het hutje gezelliger vindt, mag terug. Een kind mag een grootte overslaan als het lang genoeg spaart.

| Huis | Prijs (wie leest) | Wie niet leest (de helft) | Wat erbij komt |
| --- | --- | --- | --- |
| Hutje | gratis | gratis | Eén kamer, één deur, één raam |
| Huisje | 25 | 13 | Breder, twee ramen |
| Huis met verdieping | 50 | 25 | Tweede verdieping met drie ramen |
| Groot huis | 80 | 40 | Garage aan de zijkant |
| Torenhuis | 120 | 60 | Toren met eigen dak of kantelen |

**Moment van groeien**: na het kopen van een groter huis volgt een feestscherm met het nieuwe huis en het figuurtje ervoor: "Je huis is gegroeid!" (voor Feline voorgelezen). Bewaren gebeurt met Klaar, zoals altijd.

De kleuren en keuzes verhuizen mee naar het grotere huis: niemand moet opnieuw beginnen.

## Onderdelen (startcatalogus)

| Categorie | Keuzes en prijs in sterren (wie leest) | Kleur kiezen |
| --- | --- | --- |
| Huis | Hutje 0, huisje 25, verdieping 50, groot huis 80, torenhuis 120 | Nee |
| Dak | Puntdak 0, plat dak 0, rond dak 15, trapgevel 40 | Ja, 8 kleuren |
| Muren | Effen 0, hout 0, baksteen 10, natuursteen 30 | Ja, 9 kleuren |
| Deur | Gewoon 0, boog 0, ronde deur 15, dubbele deur 35 | Ja |
| Ramen | Vierkant 0, boog 0, rond 10, met luiken 20 (luiken in de kleur van de deur) | Nee |
| Tuin (2 plaatsen) | Boom 0, bloemen 0, zandbak 0, schommel 10, voetbaldoel 15, konijnenhok 20, trampoline 25, raceauto 30, moestuin 30, hondenhok 40, zwembadje 50, dino 60 | Nee |
| Extra (alles mag) | Schoorsteen 0, bloembakken 0, hekje 10, brievenbus 10, vlag in je eigen kleur 20, lichtjes 30 | Nee |

Bij een torenhuis volgt het torendak het dak: puntdak wordt een spitse toren, rond dak een koepel, plat dak en trapgevel worden kantelen. De trapgevel is een knipoog naar de Vlaamse huizen.

Alles is eigen ontwerp, vlakke vormen en effen kleuren zoals de prenten en het figuurtje. De catalogus is data in `src/data/huis.ts` met dezelfde velden als `src/data/figuurtje.ts` (`prijs`, `prenten`).

## Per kind

| | Luca (8) | Yuna (6) | Feline (4) |
| --- | --- | --- | --- |
| Categorieën | Alle 7, met naam | Alle 7, met naam, voorleesknop | 6 (zonder Ramen), alleen icoon |
| Keuzes per categorie | Alles | Alles | Maximaal 6, extra groot |
| Tekst | Namen van keuzes | Korte namen | Geen; elke tik leest de naam voor |
| Prijzen | Normaal | Normaal | De helft (zoals figuurtje en spelletjes) |

## Samen met het figuurtje

- Het figuurtje staat altijd naast de deur, in zijn huidige kleren. Tik erop: de kleerkast opent.
- De vlag heeft de kleur van het kind (blauw, oranje, groen); later kan dat de shirtkleur van het figuurtje zijn.
- Eén teller voor alles: "ooit verdiend" opent figuurtjes, spelletjes en het huis. De volgende mijlpaal op Mijn huis toont alleen wat het huis betreft.

## Alternatieve scenario's

- **Eerste keer**: het kind start met een hutje met de deur in de kleur van zijn thema, een appelboom, bloemen en een schoorsteen.
- **Terug zonder Klaar**: wijzigingen gaan verloren, het oude huis blijft (zoals de kleerkast).
- **Ouder zet terug**: nog niet in de app (de server kan het al: `huis_bewaren` met null zet het terug naar het hutje).
- **Op slot**: grijs met een slotje en "nog 40 sterren". Tik erop: het huis toont even hoe het zou staan, het slotje blijft dicht.

## Gegevens

- Kolom `gebruikers.huis` (JSON), bv. `{ "model": "verdieping", "dak": "punt", "dakKleur": "antraciet", "muur": "baksteen", "muurKleur": "baksteen", "deur": "gewoon", "deurKleur": "blauw", "ramen": "vierkant", "tuin": ["doel", "raceauto"], "extra": ["schoorsteen"] }`; null = het hutje in de themakleur.
- Catalogus `huis_stukken` (soort, sleutel, prijs, standaard_vrij); soorten `huis`, `dak`, `muur`, `deur`, `ramen`, `tuin`, `huisextra` en de kleuren. `huis.test.ts` houdt de catalogus gelijk met de app.
- Kopen via `kopen(kind, soort, sleutel)` (tabel `aankopen`); bewaren via `huis_bewaren(kind, huis)`, dat elk stuk controleert (gratis, gekocht, of met "alles vrij" in de winkel). Een tablet past alleen het huis van zijn eigen kind aan. Tests: `supabase/tests/huis.test.sql`.
- Tekenen: één SVG met lagen (lucht, huis, dak, ramen, deur, extra's, tuin, figuurtje) in `src/lib/huis/tekenen.ts`; het figuurtje komt uit de bestaande tekenfunctie.

## Aanvaardingscriteria

- [x] Een kind opent zijn huis in één tik vanaf het startscherm.
- [x] Elke keuze is meteen zichtbaar op het grote huis, zonder laadtijd.
- [x] Het huis groeit bij een mijlpaal met een feestscherm; keuzes en kleuren blijven behouden.
- [x] Het figuurtje staat voor de deur in zijn huidige kleren.
- [x] Feline kan zonder lezen een huis maken: alleen iconen, voorlezen bij elke tik, aanraakvlakken van minstens 96 px.
- [x] Aanraakvlakken voor Luca en Yuna minstens 64 px.
- [x] Licht en donker thema (donker = nacht met verlichte ramen).
- [x] Groter bouwen en stukken kopen gaat van het vrije saldo; stukken op slot tonen hun prijs en hoeveel sterren nog nodig zijn.

## Open vragen

1. **Binnenkant**: de kinderen willen misschien ook binnen inrichten (bed, tafel, knuffels). Voorstel: tweede stap, achter een tik op de deur.
2. **Ons straatje**: de drie huizen naast elkaar op Wie speelt er? of als aparte pagina. In het prototype als idee te zien.
3. **Seizoenen**: sneeuw op het dak in de winter, een pompoen bij Halloween. Leuk, maar later.
