# Springland

Platformspel van opzij waarin het kind met zijn eigen figuurtje loopt en springt (gevraagd door de kinderen,
25 oktober 2026). Spelregels en besturing: `docs/spelletjes.md`, Springland. Dit document gaat over de
**landkaart met werelden** en hoe er levels bijkomen.

## Landkaart

- Na het openen van Springland staat het kind op de landkaart, van bovenaf gezien (zoals een oude
  platformgame-wereldkaart). Elke wereld is een eigen stuk land (bordje met de naam, eigen kleur en versiering);
  tussen twee werelden loopt een riviertje met een bruggetje. Na de laatste wereld ligt mist met een vraagteken:
  daar komen nieuwe werelden. De werelden nu: Zonnevallei (groen), Pepernotenland (snoep) en Winterbergen (sneeuw, begonnen 31 oktober 2026 met Het slaapbos; tweede level De bevroren beek op 1 november, derde level Het sneeuwdorp op 2 november, vierde level Het ijsmeer op 3 november, vijfde en laatste gewone level Het wolkenpad op 4 november (zacht, met vogels); de **sneeuwbaas** op 5 november als zesde plekje: Winterbergen is vol). De vierde wereld is Zonnestrand (zand, begonnen 6 november met Het strandpad, een zacht level met slakken; dezelfde dag in één reeks erbij: De schelpenbaai, De hoge duinen (pittig), De lange pier (zacht) en Het vuurtorenpad (pittig), en als zesde de **krabbaas** (`soort: 'krab'`: een rode krab met klappende scharen en een strohoedje). Zonnestrand is vol). De vijfde wereld is Wolkenrijk (stijl `hemel`: witte wolkenpaden, regenbogen en zonnepoorten; begonnen 7 november 2026 met De wolkentrap, een gewoon level met vogels; tweede level De regenboogbrug op 8 november: een gat van 3, twee gaten van 2 vlak na elkaar, twee vogels en een trapje; derde level De onweerswolkjes op 9 november, een pittig level met drie gaten van 2 vlak na elkaar en vogels; dezelfde dag in de lus erbij: Het regenboogeiland (zacht, met een springveer) en Het sterrenpad (pittig, gaten van 3 en een smalle trap van wolken), het vijfde en laatste gewone level; en als zesde de **bromwolk** (`soort: 'wolk'`: een grijze wolk met een geel bliksemkuifje en druppels). Wolkenrijk is vol). De zesde wereld is het Lichtjesbos (wereldstijl `nacht`: een donkerblauw bos met lampionnetjes, een lantaarnhuis, een maanvijver en een lichtjesboom op de kaart; begonnen 9 november 2026 met Het lampionnenpad, een gewoon level met egels in stijl bos; dezelfde dag erbij: Het donkere bospad, pittig met snelle egels, De bruggetjes over de beek, een zacht level in stijl weide met slakken, kersen en lage plankjes boven de grond, De lichtjesboom, pittig met snelle vogels en muurtjes van 2, en Het maanpad, het vijfde en laatste gewone level: zacht, stijl weide, met slakken en hoge plankjes vol appels en sterren. Als zesde de **bromuil** (`soort: 'uil'`: een bruine uil met oorpluimen en een zwaaiend lampionnetje). Het Lichtjesbos is vol). De zevende wereld is Speelgoedland (wereldstijl `speelgoed`: een houten vloer met een speelkleed, een blokkenkasteel, een treintje en een draaitol, blokjes, knikkers en teddyberen op de kaart; begonnen 9 november 2026 met De blokkenweg, een zacht level in stijl weide met slakken en trapjes; tweede level Het knikkerpad, een gewoon level in stijl bos met egels, vier gaten en twee trapjes; derde level De knikkerbaan, pittig, in stijl wolken met snelle vogels, gaten van 3, een smal pilaartje tussen twee gaten en muurtjes van 2; vierde level De treinrails, zacht, in stijl sneeuw met slakken, kleine gaten en hoge plankjes vol aardbeien).
- De kaart is aangekleed en beweegt een beetje (bomen wiegen, de molen draait, schaduwen van wolken drijven over,
  vlinders, meeuwen of sneeuwvlokjes); met "minder beweging" op het toestel staat alles stil. Tekeningen in
  `src/schermen/SpringKaartPrent.tsx`, plaatsing (nooit op het pad, elke keer dezelfde) in `aankleding()`.
- Het pad kronkelt vrij door elke wereld, soms even terug naar links (`VORMEN` in `springKaart.ts`, om de beurt per
  wereld).
- Elk level is een klein 3D-eilandje in de stijl van het level (grasheuvel, bosje, wolkeneiland, strandje,
  ijsberg; `LevelLand` in `SpringKaartPrent.tsx`) op één kronkelend pad. Tik op een plekje en het figuurtje wandelt erheen langs het
  pad (ook langs de plekjes ertussen); daar aangekomen begint het level. Tik op het plekje waar je al staat om
  meteen te spelen. De kaart schuift mee met het figuurtje en is met de vinger te verschuiven.
- Uitgespeeld = gouden rand en het record (sterren en fruit); op slot = grijs met een slotje (een tik geeft een
  schuddend plekje en voor wie niet leest de zin "Speel eerst het level ervoor").
- Lege plekjes (stippelrand) tonen hoeveel levels er nog in een wereld passen.
- Na een level: **Volgend level** (of **Nieuwe wereld!** bij de overgang) gaat terug naar de kaart; het figuurtje
  wandelt zelf naar het volgende plekje en start het.


## Hartjes en vlaggetjes

- Hartjes (27 oktober 2026, op vraag van Frederique): `LEVENS` in `springen.ts`, 2 bij Zelf lopen en 3 bij Vanzelf
  lopen (Feline en Yuna lezen nog niet). Alleen een beestje van opzij (of de baas) kost een hartje; vallen niet.
- Zijn de hartjes op, dan ga je terug naar het laatste **vlaggetje** (`C` in de kaart, wordt rood als je er langs
  loopt) of naar de start, met alle hartjes weer vol en de sterren die je al had. Het level opnieuw beginnen is dus
  nooit helemaal straffend, en wie niet leest hoort "Oei, je hartjes zijn op. Nog eens proberen!".
- Een level zonder eigen `C` krijgt vanzelf één vlaggetje in het midden (twee bij meer dan 120 kolommen) op stevige
  grond. Een pittig level mag er zelf een of twee zetten (liefst vlak voor het lastige stuk).

## Vijanden

Erop springen verslaat een vijand (27 oktober 2026, Frederique): hij gaat "poef" weg met sterretjes, je kaatst vrolijk
verder. De soort vijand volgt uit het `beestje` van het level, en elke soort heeft een eigen manier (`BEESTJE_LEVENS` in
`springen.ts`):

- **Slak**: één hup op zijn huisje en hij is weg.
- **Egel**: de eerste hup rolt hem op tot een stekelbolletje (2,5 seconden onschadelijk, je kan er langs lopen); een
  tweede hup, ook terwijl hij opgerold ligt, verslaat hem. Wacht je te lang, dan rolt hij weer open en loopt verder.
- **Vogel**: fladdert op en neer boven de grond (`VOGEL_FLADDER`): raak hem met een hup op het juiste moment, of
  spring er ruim onderdoor of overheen. Eén hup en hij is weg.

Een nieuwe soort (bv. een bij of een krab) is een nieuwe waarde bij `beestje` met tekening in `tekenBeestje`
(`springenVeld.ts`) en een rij in `BEESTJE_LEVENS`; denk goed na over een eigen manier om hem te verslaan en leg die hier uit.
Van opzij raken kost nog altijd een hartje. De baas heeft zijn eigen regels (zie hieronder).

## Baas (einde van een wereld)

- Elke wereld heeft zes plekjes: **vijf gewone levels en als zesde de baas** (`levelsPerWereld = 6`). Een wereld is dus pas
  vol met de baas erbij. De baas zit in een eigen level met `baas: { soort, naam }` in de data en een `B` in de
  kaart: een korte aanloop (sterren, een gat of twee, een beestje) en dan een open stuk grond waar hij heen en weer
  rolt voor het hekje bij het huisje (`POORT_AFSTAND`: dicht tot hij verslagen is).
- Hup op zijn hoofd: dan is hij 2 seconden duizelig (kruisjes in zijn ogen, sterretjes, onschadelijk, je kan er
  zelfs op blijven kaatsen) en rolt daarna iets sneller. 3 hups (`BAAS_NODIG`: 2 bij Vanzelf lopen) en hij is
  verslagen. Van opzij raken kost een hartje en de baas draait om. De bolletjes naast de hartjes tellen af.
- Geen schrik: de baas is boos-lief getekend, er is geen geweld, hij wordt gewoon duizelig en "poef" weg.
- De eerste baas is de **pompoenbaas** (Zonnevallei, stijl bos). De derde is de **sneeuwbaas** (Winterbergen, stijl sneeuw, `soort: 'sneeuw'`: drie sneeuwballen met een blauwe muts, rode sjaal en wortelneus). De tweede is de **pepernotenbaas** (Pepernotenland, stijl weide, `soort: 'pepernoot'`: drie bruine koekjes met glazuurstreepjes en een rood mijtertje). De vierde is de **krabbaas** (Zonnestrand, stijl strand, `soort: 'krab'`). Een nieuwe baas = een nieuw `soort`: tekening in
  `tekenBaas` (`springenVeld.ts`) en op het eilandje van de kaart (`SpringKaart.tsx`).
- Robotje: `springen.test.ts` laat het robotje ook de baas verslaan (hij hupt als de baas aan komt rollen).

## Op de gsm

- Liggend op een gsm (schermhoogte tot 520 px) vult Springland het hele scherm zoals een gsm-spelletje: de kop wordt
  twee kleine knoppen in de hoeken (terug, geluid), de keuze lopen, de levelknop en de score zweven bovenaan, de
  knoppen om te lopen en te springen zijn kleiner. Kaart en speelveld schalen mee met de hoogte, zodat je even veel
  van de wereld ziet als op de tablet. CSS in `springen.css` (blok "Gsm liggend").

## Als ouder spelen

- Ouderdeel Wij → **Springland spelen** (`/ouder/springland`, `OuderSpringland` in `Springen.tsx`): alleen op de gsm
  van een ouder, met het eigen figuurtje van de ouder (dat uit de chat). Gewoon vrijspelen zoals een kind, voortgang
  per ouder op die gsm, niets in het activiteitlog. Rechtop vraagt het scherm om de gsm te draaien.

## Vrijspelen

- De speelvolgorde is de volgorde van `springLevelLijst`. Een level is open als het vorige uitgespeeld is; een
  wereld uitspelen opent dus de eerste plek van de volgende wereld.
- Bewaard per kind op de tablet (localStorage, zoals de records): `springen-af-<level>-<kind>`,
  `record-springen-<level>-<kind>` en waar het figuurtje staat (`springen-plek-<kind>`). Bij Spelletjes proberen
  (ouders) staat alles open en wordt niets bewaard.
- Geen server nodig: het spelletje zelf koopt het kind één keer in de winkel (30 sterren); levels kosten niets.

## Een level toevoegen (ook de nachtelijke bouw)

Alles is data in `src/data/springen.ts`; de kaart, het pad en het vrijspelen volgen vanzelf.

1. Zet een nieuw item **achteraan** `springLevelLijst` met een nieuwe, vaste `id` (kleine letters, nooit meer
   wijzigen: records hangen eraan), `wereld`, `stijl`, `naam` (kort, voor op de kaart), `beestje`, `fruit` en de
   `kaart` (11 rijen van gelijke lengte, de bovenste rij leeg, 90 tot 150 kolommen, `P` links en `H` rechts).
2. Wereld: hoogstens `levelsPerWereld` (5) levels per wereld. Is de laatste wereld vol, voeg dan eerst een nieuwe
   wereld toe achteraan `springWerelden` (`id`, `naam`, `stijl`: groen, zand, sneeuw of snoep) en zet het level daarin.
   Een wereld heeft vijf gewone levels en als **zesde en laatste de baas** (zie "Baas"): heeft de laatste wereld vijf
   gewone levels maar nog geen baas, dan bouwt de nacht die baas in plaats van een gewoon level.
3. Stijl van het level: weide, bos, wolken, strand of sneeuw. Een nieuwe stijl kan, maar vraagt code: een rij in
   `kleuren` en een achtergrond in `springenVeld.ts`, en een icoon in `StijlIcoon` (`SpringKaart.tsx`) en een eilandje in `LevelLand`
   (`SpringKaartPrent.tsx`). Een nieuwe wereldstijl vraagt een rij in `wereldKleur`, grond in `Grond`, stukken in
   `Versiersel` en de lijsten `groot` en `klein` in `springKaart.ts`.
4. Moeilijkheid: elk level iets anders dan het vorige. **Een level mag soms moeilijk zijn** (Frederique, 27 oktober
   2026): een kind hoeft niet elk level de eerste keer te halen, en met hartjes en vlaggetjes is opnieuw proberen
   zacht. Kies zelf een mooie mix: ongeveer om de twee, drie levels een pittig level.
   - Gewoon: gaten hoogstens 3 vakjes breed, een opstapje hoogstens 2 vakjes hoog, na een springpaddenstoel minstens
     4 vakjes grond voor een gat, niets recht boven een paddenstoel, en een beestje minstens 4 vakjes van een gat
     (het wandelt 2 vakjes heen en weer).
   - Pittig: twee of drie gaten kort na elkaar, een gat van 4 vakjes (met een planke of springveer als hulp), smalle
     planken, twee beestjes vlak na elkaar of een beestje net na een gat, sneller wandelende beestjes (`snelheid` tot
     1.6 in de data) en een vlaggetje (`C`) net voor het lastigste stuk. Het blijft haalbaar met één soort sprong en het
     blijft vriendelijk: geen gaten waar je zonder hulp niet over kan, en nooit een stuk dat je helemaal niet
     kan zien aankomen.
   - Houd rekening met **Vanzelf lopen** (Feline, Yuna): daar loopt het figuurtje zelf (5 vakjes per seconde), je kan
     enkel springen, en je hebt 3 hartjes. Een pittig level moet dus ook met alleen tikken te halen zijn; het robotje
     test beide besturingen.
   Laat het aansluiten bij het seizoen of feest (CLAUDE.md, "Seizoenen en feesten") via naam, stijl en fruit.
5. Draai `npm test`: `springen.test.ts` laat een robotje elk level uitspelen (vanzelf en zelf lopen) zonder dat
   de hartjes op raken (een pittig level mag het robotje af en toe een hartje kosten, maar nooit alle) en `springKaart.test.ts` controleert werelden en volgorde. Lukt het robotje niet, pas dan de kaart aan.
6. Nieuwtje met het volgende versienummer: "Springland: nieuw level <naam> in <wereld>".
