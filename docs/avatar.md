# Use case: Mijn figuurtje

Status: gebouwd (22 oktober 2026), ontgrendelen met optie C (mijlpalen). Mockup: `prototypes/avatar.html`. Code: `src/data/figuurtje.ts`, `src/schermen/Kleerkast.tsx`, migratie `20261022001000_figuurtje.sql`.

## Doel

Elk kind maakt een eigen speelfiguurtje (blokjesfiguur, zoals een speelgoedmannetje) en kleedt het zelf aan: huidskleur, gezicht, haar, hoofddeksel, shirt, broek, schoenen en een extraatje. Het figuurtje vervangt de letter in het rondje en wordt het gezicht van het kind in de hele app. Het geeft de kinderen een eigen plek in de app die niets met taken of tijd te maken heeft, en een extra reden om sterren te verdienen (zie "Ontgrendelen").

## Actoren

| Wie | Wat |
| --- | --- |
| Kind (Luca, Yuna, Feline) | Maakt en wijzigt het eigen figuurtje, zo vaak als het wil |
| Ouder | Kan een figuurtje terugzetten en (als we ontgrendelen kiezen) die functie per kind aan- of uitzetten |

## Waar het figuurtje verschijnt

1. **Wie speelt er?**: het figuurtje (hoofd en bovenlijf) op de profielknop, in plaats van de letter.
2. **Startscherm** van elk kind: klein figuurtje linksboven in de banner; tik erop om de kleerkast te openen.
3. **Eindscherm van een spelletje of rondje rekenen**: het figuurtje springt en juicht.
4. **Ouder-app**: een klein hoofdje naast de naam in Vandaag en Goedkeuren, zodat ouders ook snel zien over wie het gaat.
5. Later (fase 2): figuurtje als speler bij Penalty's (shirtkleur), op de gezinspagina of in het weekoverzicht.

## Hoofdscenario: figuurtje aankleden

1. Het kind tikt op zijn figuurtje op het startscherm.
2. De **kleerkast** opent: links het figuurtje groot, rechts de categorieën (tabbladen met een icoon) en een raster met keuzes.
3. Het kind kiest een categorie, bv. Haar. Het raster toont elke haarstijl op het eigen hoofdje van het kind, zodat het meteen ziet hoe het staat.
4. Een tik op een keuze past het figuurtje links meteen aan (met een klein huppeltje).
5. Waar een kleur kan (haar, shirt, broek, schoenen) staat onder het raster een rij grote kleurbolletjes.
6. **Ongedaan maken** zet de vorige stap terug; **Verrassing** (dobbelsteen) kiest alles willekeurig uit wat vrij is.
7. **Klaar** bewaart het figuurtje en keert terug naar het startscherm, waar het nieuwe figuurtje meteen staat.

Er is geen goedkeuring van een ouder nodig: aankleden kost geen sterren en verandert niets aan taken of tijd.

## Alternatieve scenario's

- **Eerste keer**: bij het eerste gebruik start het kind van een basisfiguurtje in de kleur van zijn thema, met een grote knop Verrassing om snel iets leuks te krijgen.
- **Terug zonder Klaar**: de wijzigingen gaan verloren; het oude figuurtje blijft. (Geen vraag "wil je bewaren?", dat is te moeilijk voor Feline. Alternatief: automatisch bewaren; zie open vragen.)
- **Ouder zet terug**: in Kinderen > kind > Figuurtje kan een ouder het figuurtje terugzetten naar het basisfiguurtje (bv. bij ruzie over "die heeft mijn kapsel nagedaan").
- **Op slot (alleen als we ontgrendelen kiezen)**: een keuze op slot staat grijs met een slotje en een balkje "nog 40 sterren". Tik erop: het figuurtje toont even hoe het zou staan, en een korte zin legt uit hoeveel sterren nog nodig zijn. Het slotje blijft dicht.

## Per kind

| | Luca (8) | Yuna (6) | Feline (4) |
| --- | --- | --- | --- |
| Categorieën | Alle 8, met naam | Alle 8, met naam | 6 (zonder Gezicht en Schoenen), alleen icoon |
| Keuzes per categorie | Alles | Alles | Maximaal 6, extra groot |
| Tekst | Namen van keuzes | Korte namen, voorleesknop | Geen tekst; elke tik leest de naam voor |
| Thema-extra's | Racehelm, shirt met nummer 8, dino-kap | Kroontje, staartjes, oranje regenjas | Konijnenoren, glitterster, knuffel |

Alles is eigen ontwerp: geen merken, geen bekende personages en geen merknaam (de app zegt "figuurtje", nooit de naam van een speelgoedmerk).

## Onderdelen (startcatalogus)

| Categorie | Keuzes (voorstel) | Kleur kiezen |
| --- | --- | --- |
| Huid | 6 tinten, waaronder speelgoed-geel | Nee (de tint is de keuze) |
| Gezicht | Lach, grote lach, knipoog, verbaasd, tong uit, stoer | Nee |
| Haar | Kort, stekels, pony, lang, staartjes, krullen, knotje, geen | Ja, 8 kleuren |
| Hoofd | Niets, pet, racehelm, muts, kroontje, dino-kap, konijnenoren | Nee |
| Shirt | T-shirt, met ster, met bliksem, met nummer 8, gestreept, met dino, regenjas | Ja |
| Broek | Lange broek, short, rok, salopette | Ja |
| Schoenen | Sportschoenen, laarzen, blote voeten | Ja |
| Extra | Niets, bril, cape, voetbal, toverstaf, knuffeldino | Nee |

De catalogus is data (bv. `src/data/figuurtje.ts`), niet hardcoded in componenten, zodat we later makkelijk stukken toevoegen.

## Ontgrendelen met sterren

**Beslist (22 oktober 2026): optie C, vrijspelen met mijlpalen.** De drie mogelijkheden die bekeken zijn:

| | A. Alles vrij | B. Kopen met sterren | C. Vrijspelen met mijlpalen (aanbevolen) |
| --- | --- | --- | --- |
| Hoe | Alle stukken zijn meteen beschikbaar | Een stuk kost sterren van het saldo | Een stuk gaat open als het kind in totaal X sterren **verdiend** heeft; het saldo blijft onaangeroerd |
| Past bij "1 ster = 1 minuut" | Ja | Nee: sterren worden dan ook kleren, wat de omrekening vertroebelt | Ja |
| Extra motivatie voor taken | Geen | Groot, maar kleren concurreren met schermtijd | Groot, zonder dat het kind moet kiezen |
| Nieuwe regels nodig | Geen | Afschrijving zonder ouder, log, prijzen, terugbetalen | Alleen drempels; telt uit het bestaande puntenlog |
| Voor Feline | Ok | Moeilijk (sparen en kiezen) | Ok: ze ziet de sterrenrij vollopen |

**Gekozen: C.** Ongeveer de helft van de catalogus is vanaf de start vrij, zodat het meteen leuk is. De rest gaat open bij mijlpalen op het totaal aantal ooit verdiende sterren (goedgekeurde taken en activiteiten; tijdaanvragen tellen niet af). Voorstel drempels: 25, 50, 100, 150, 250, 400, 600 sterren, met per mijlpaal 1 à 3 nieuwe stukken. Voor Feline lagere drempels (10, 20, 40, ...) omdat ze minder sterren haalt. Later kunnen ook reeksen (bv. 5 dagen na elkaar tanden poetsen = kroontje) stukken vrijspelen; dat sluit aan bij "reeksen en badges" in fase 2.

Zo blijven de kernregels intact: niemand verliest sterren, een ouder keurt nog altijd elke ster goed (dus ook elke mijlpaal), en er komt geen nieuwe munt bij.

**Moment van vrijspelen**: als een ouder sterren goedkeurt en daardoor een mijlpaal gehaald wordt, toont het startscherm van het kind de volgende keer een feestscherm: "Nieuw! Je hebt het kroontje vrijgespeeld", met het figuurtje dat het nieuwe stuk al draagt, en knoppen **Aandoen** en **Later**.

## Gegevens (voorstel, nog geen code)

- `Gebruiker.avatar` wordt een JSON-object, bv. `{ "huid": "geel", "gezicht": "lach", "haar": { "stijl": "stekels", "kleur": "bruin" }, "hoofd": "racehelm", "shirt": { "stijl": "nummer8", "kleur": "rood" }, "broek": { "stijl": "lang", "kleur": "blauw" }, "schoenen": { "stijl": "sport", "kleur": "wit" }, "extra": "geen" }`.
- Bij optie C: welke stukken vrij zijn, berekent de server uit de som van de positieve bijschrijvingen in het puntenlog. Geen extra tabel nodig; eventueel een tabel `Ontgrendeling` (kind, stuk, tijdstip, gezien) om het feestscherm maar één keer te tonen.
- De server controleert bij bewaren dat elk gekozen stuk vrij is (zelfde principe als saldo en dagplafond).
- Tekenen: gelaagde SVG (huid, broek, shirt, schoenen, hoofd, gezicht, haar, hoofddeksel, extra), vlakke vormen, effen kleuren, zoals de rest van de prenten.

## Aanvaardingscriteria

- [x] Een kind kan zijn figuurtje openen vanaf het startscherm in één tik.
- [x] Elke keuze is meteen zichtbaar op het grote figuurtje, zonder laadtijd.
- [x] Klaar bewaart; het nieuwe figuurtje staat meteen op het startscherm en bij Wie speelt er.
- [x] Feline kan zonder lezen een figuurtje maken: alleen iconen, voorlezen bij elke tik, aanraakvlakken van minstens 96 px.
- [x] Aanraakvlakken voor Luca en Yuna minstens 64 px.
- [x] Licht en donker thema.
- [x] (Optie C) Stukken op slot zijn zichtbaar met het aantal sterren dat nog nodig is; vrijspelen kost geen saldo.
- [x] Geen merknamen of beschermde personages in tekst of tekeningen.

## Keuzes bij het bouwen (22 oktober 2026)

Frederique vroeg om te bouwen en redelijke standaarden te kiezen. Aan te passen als het anders moet:

1. **Bewaren met Klaar**, niet automatisch. Zo werken Terug (ongedaan maken) en Verrassing zonder dat er meteen iets bewaard is. Terug zonder Klaar laat het oude figuurtje staan.
2. **Geen figuurtje voor ouders**. In de ouder-app staat het hoofdje van het kind naast de naam.
3. **Meteen gebouwd**, niet uitgesteld naar fase 2.
4. **Minder lezen = een vijfde van de drempel**: geldt voor elk kind waarbij "Kan lezen" uit staat (nu Feline).
5. **Vrijspelen aan/uit per kind** in Kinderen; uit betekent alles vrij. Daar staat ook Figuurtje terugzetten.
6. **Feestscherm** verschijnt op het startscherm als er sinds het vorige bezoek op die tablet iets vrijgespeeld is. De tablet onthoudt wat al gevierd is; de eerste keer wordt niets gevierd.
7. **Ooit verdiend** = de som van alle bijschrijvingen in het puntenlog (goedgekeurde taken en activiteiten, correcties). Extra tijd telt niet af.
