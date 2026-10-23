# Use case: Mijn huis

Status: idee van de kinderen zelf (23 oktober 2026), nog niet gebouwd. Prototype: `prototypes/huis.html` (ook online: https://claude.ai/artifact/3kD5SUF2qVNoVKD4auxdyz).

## Doel

Naast hun figuurtje willen de kinderen een eigen huis. Ze starten met een klein hutje en zien het groeien naarmate ze sterren verdienen: een huisje, een verdieping erbij, een garage, en ten slotte een huis met een toren. Ondertussen kleden ze het zelf aan: dak, muren, deur, ramen, tuin en extraatjes. Het figuurtje woont in het huis en staat altijd voor de deur.

Het huis werkt zoals het figuurtje: het kost geen sterren, verandert niets aan taken of tijd en gaat open met mijlpalen op het totaal aantal **ooit verdiende** sterren (optie C uit `docs/avatar.md`). Het saldo blijft onaangeroerd.

## Actoren

| Wie | Wat |
| --- | --- |
| Kind (Luca, Yuna, Feline) | Bouwt en kleedt het eigen huis aan, zo vaak als het wil |
| Ouder | Kan een huis terugzetten; dezelfde schakelaar "alles vrij" als bij figuurtje en spelletjes geldt ook voor het huis |

## Waar het huis verschijnt

1. **Startscherm** van elk kind: een tegel "Mijn huis" met het huis in het klein. Tik erop om naar het huis te gaan.
2. **Mijn huis**: het huis groot in een tuintje, met het figuurtje voor de deur, de lucht (dag of nacht volgens het thema) en de volgende mijlpaal.
3. **Feestscherm** als het huis groter wordt.
4. Later (idee): **Ons straatje**, de drie huizen naast elkaar als nieuwe versie van Wie speelt er?

## Hoofdscenario: huis aankleden

1. Het kind tikt op de tegel Mijn huis en ziet zijn huis met het figuurtje ervoor.
2. Het tikt op **Aankleden** (penseel). De **bouwplaats** opent: links het huis, rechts de categorieën en een raster met keuzes.
3. Elke keuze toont het eigen huis van het kind met die keuze, zodat het meteen ziet hoe het staat.
4. Een tik past het huis links meteen aan (met een klein wiebeltje). Bij dak, muren en deur staat een rij kleurbolletjes.
5. In **Tuin** kiest het kind twee dingen (links en rechts van het huis); een derde keuze vervangt de oudste. In **Extra** mag alles tegelijk aan.
6. **Ongedaan maken**, **Verrassing** (dobbelsteen) en **Klaar** werken zoals in de kleerkast.

## Groeien: van hutje naar torenhuis

Het huis groeit met mijlpalen op het totaal aantal verdiende sterren. Elke grootte blijft daarna vrij: wie het hutje gezelliger vindt, mag terug.

| Huis | Ooit verdiend (wie leest) | Wie niet leest (een vijfde) | Wat erbij komt |
| --- | --- | --- | --- |
| Hutje | 0 | 0 | Eén kamer, één deur, één raam |
| Huisje | 30 | 6 | Breder, twee ramen |
| Huis met verdieping | 80 | 16 | Tweede verdieping met drie ramen |
| Groot huis | 160 | 32 | Garage aan de zijkant |
| Torenhuis | 300 | 60 | Toren met eigen dak of kantelen |

**Moment van groeien**: als een ouder sterren goedkeurt en daardoor een nieuwe grootte vrijkomt, toont Mijn huis de volgende keer een feestscherm: het oude huis, een pijl, het nieuwe huis met het figuurtje ervoor en "Je huis is gegroeid!". Knoppen **Bouwen!** (meteen verhuizen) en **Later**. Voor Feline zonder tekst: het feest wordt voorgelezen. Nieuwe stukken (bv. de trampoline) krijgen zoals bij het figuurtje het label Nieuw.

De kleuren en keuzes verhuizen mee naar het grotere huis: niemand moet opnieuw beginnen.

## Onderdelen (startcatalogus)

| Categorie | Keuzes (voorstel, drempel voor wie leest) | Kleur kiezen |
| --- | --- | --- |
| Huis | Hutje 0, huisje 30, verdieping 80, groot huis 160, torenhuis 300 | Nee |
| Dak | Puntdak 0, plat dak 0, rond dak 40, trapgevel 120 | Ja, 8 kleuren |
| Muren | Effen 0, hout 0, baksteen 25, natuursteen 100 | Ja, 9 kleuren |
| Deur | Gewoon 0, boog 0, ronde deur 50, dubbele deur 150 | Ja |
| Ramen | Vierkant 0, boog 0, rond 30, met luiken 60 (luiken in de kleur van de deur) | Nee |
| Tuin (2 plaatsen) | Boom 0, bloemen 0, zandbak 0, schommel 25, voetbaldoel 40, konijnenhok 50, trampoline 75, raceauto 100, moestuin 120, hondenhok 150, zwembadje 200, dino 250 | Nee |
| Extra (alles mag) | Schoorsteen 0, bloembakken 0, hekje 20, brievenbus 30, vlag in je eigen kleur 60, lichtjes 100 | Nee |

Bij een torenhuis volgt het torendak het dak: puntdak wordt een spitse toren, rond dak een koepel, plat dak en trapgevel worden kantelen. De trapgevel is een knipoog naar de Vlaamse huizen.

Alles is eigen ontwerp, vlakke vormen en effen kleuren zoals de prenten en het figuurtje. De catalogus is data (bv. `src/data/huis.ts`) met dezelfde velden als `src/data/figuurtje.ts` (`drempel`, `prenten`).

## Per kind

| | Luca (8) | Yuna (6) | Feline (4) |
| --- | --- | --- | --- |
| Categorieën | Alle 7, met naam | Alle 7, met naam, voorleesknop | 6 (zonder Ramen), alleen icoon |
| Keuzes per categorie | Alles | Alles | Maximaal 6, extra groot |
| Tekst | Namen van keuzes | Korte namen | Geen; elke tik leest de naam voor |
| Drempels | Normaal | Normaal | Een vijfde (zoals figuurtje en spelletjes) |

## Samen met het figuurtje

- Het figuurtje staat altijd naast de deur, in zijn huidige kleren. Tik erop: de kleerkast opent.
- De vlag heeft de kleur van het kind (blauw, oranje, groen); later kan dat de shirtkleur van het figuurtje zijn.
- Eén teller voor alles: "ooit verdiend" opent figuurtjes, spelletjes en het huis. De volgende mijlpaal op Mijn huis toont alleen wat het huis betreft.

## Alternatieve scenario's

- **Eerste keer**: het kind start met een hutje in de kleur van zijn thema en een grote knop Verrassing.
- **Terug zonder Klaar**: wijzigingen gaan verloren, het oude huis blijft (zoals de kleerkast).
- **Ouder zet terug**: in Kinderen > kind kan een ouder het huis terugzetten naar het hutje in de themakleur.
- **Op slot**: grijs met een slotje en "nog 40 sterren". Tik erop: het huis toont even hoe het zou staan, het slotje blijft dicht.

## Gegevens (voorstel, nog geen code)

- Nieuwe kolom `kind.huis` (JSON), bv. `{ "model": "verdieping", "dak": { "stijl": "punt", "kleur": "antraciet" }, "muur": { "stijl": "baksteen", "kleur": "baksteen" }, "deur": { "stijl": "gewoon", "kleur": "blauw" }, "ramen": "vierkant", "tuin": ["doel", "raceauto"], "extra": ["schoorsteen"] }`.
- De server controleert bij bewaren dat elk stuk vrij is, met dezelfde functie als bij het figuurtje (som van de bijschrijvingen in het puntenlog). Geen nieuwe tabel nodig.
- Het feestscherm onthoudt per tablet wat al gevierd is (zoals bij het figuurtje).
- Tekenen: één SVG met lagen (lucht, huis, dak, ramen, deur, extra's, tuin, figuurtje). Het figuurtje komt uit de bestaande tekenfunctie.

## Aanvaardingscriteria

- [ ] Een kind opent zijn huis in één tik vanaf het startscherm.
- [ ] Elke keuze is meteen zichtbaar op het grote huis, zonder laadtijd.
- [ ] Het huis groeit bij een mijlpaal met een feestscherm; keuzes en kleuren blijven behouden.
- [ ] Het figuurtje staat voor de deur in zijn huidige kleren.
- [ ] Feline kan zonder lezen een huis maken: alleen iconen, voorlezen bij elke tik, aanraakvlakken van minstens 96 px.
- [ ] Aanraakvlakken voor Luca en Yuna minstens 64 px.
- [ ] Licht en donker thema (donker = nacht met verlichte ramen).
- [ ] Vrijspelen kost geen saldo; stukken op slot tonen hoeveel sterren nog nodig zijn.

## Open vragen

1. **Binnenkant**: de kinderen willen misschien ook binnen inrichten (bed, tafel, knuffels). Voorstel: tweede stap, achter een tik op de deur.
2. **Ons straatje**: de drie huizen naast elkaar op Wie speelt er? of als aparte pagina. In het prototype als idee te zien.
3. **Seizoenen**: sneeuw op het dak in de winter, een pompoen bij Halloween. Leuk, maar later.
