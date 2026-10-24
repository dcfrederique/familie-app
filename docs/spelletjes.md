# Nieuwe spelletjes en vrijspelen met sterren

Concept voor vijf nieuwe spelletjes bovenop Memory en Penalty's, en hoe ze met sterren opengaan.
Alle spelletjes volgen de bestaande afspraken: eigen prenten (vlakke vormen, effen kleuren, geen merken of
bekende personages), tablet liggend, aanraakvlakken van 64 px of meer, licht en donker thema, en voor wie
niet leest prentjes en voorlezen in plaats van tekst.

## Spelregels die niet veranderen

- Spelletjes leveren **geen** sterren op en tellen **wel** mee voor de app-tijd (zoals Memory en Penalty's).
- Elk afgewerkt potje komt in het activiteitlog, zodat de ouders zien wat er gespeeld is.
- Records en gekozen niveau bewaart elk toestel zelf (zoals bij de andere spelletjes).

## Vrijspelen met sterren

> Vervangen op 24 oktober 2026: de kinderen **kopen** de spelletjes nu met sterren die van hun saldo afgaan.
> Zie `docs/winkel.md` voor de regels en prijzen. Wat hieronder staat, is de oude regeling.

Zelfde idee als bij het figuurtje (optie C uit `docs/avatar.md`): een spelletje gaat open als het kind
**ooit** genoeg sterren verdiend heeft. Het saldo blijft hetzelfde, er wordt niets afgeschreven. Wat eenmaal
open is, blijft open.

| Spelletje | Open bij (lezers) | Open bij (wie niet leest, een vijfde) |
| --- | --- | --- |
| Rekenen, Memory, Penalty's | meteen | meteen |
| Huisdier wassen | 20 | 4 |
| Puzzels | 40 | 8 |
| Racen | 30 | 6 |
| Koken | 50 | 10 |
| Touwspringen | 75 | 15 |
| Basket | 100 | 20 |

- In het menu Spelen staat een spelletje op slot als een grijze tegel met een slotje en een balk
  "nog 12 sterren". Wie niet leest hoort bij een tik: "Nog even sterren sparen!".
- Pas open: de tegel krijgt het label **Nieuw!** tot het kind het spelletje een eerste keer opent.
- De ouder kan vrijspelen uitzetten bij Kinderen; die ene schakelaar geldt voor het figuurtje en de spelletjes samen.
- De drempels zijn een voorstel en staan als data in `src/data/spelletjes.ts`. De server hoeft niets te
  controleren: er staan geen sterren of tijd op het spel.

## De vijf spelletjes

### Racen (Luca, ook Yuna)

Bovenaanzicht van een weg met drie rijstroken en de eigen raceauto nr. 8. Tik links of rechts van de auto
(of veeg) om van rijstrook te wisselen. Ontwijk kegels, olievlekken en trage auto's, pik sterretjes op.
Het tempo loopt op. Drie botsingen en de race is gedaan; score = afstand plus sterretjes.
Niveaus: Rustig, Snel, Turbo. Record per niveau.

### Basket (Luca, ook Yuna)

Veeg de bal omhoog naar de ring, net als schieten bij Penalty's: richting is links of rechts, de lengte van
de veeg is de kracht. De bal vliegt in een boog. 10 ballen per reeks; raak is 2 punten, zonder de ring te
raken ("swish") 3 punten. Bij Normaal schuift de ring traag heen en weer, bij Pro sneller.

### Koken (Yuna en Feline)

Kies een gerecht (pannenkoeken, pizza, fruitsla, soep, taart). Het receptkaartje toont de ingrediënten als
prentjes. Tik de juiste ingrediënten uit de kast in de kom of pan; een fout ingrediënt huppelt terug. Daarna
roeren (cirkels draaien met de vinger) en klaar: het gerecht staat op tafel met confetti.
Niveaus: Klein (3 ingrediënten), Groot (5), Chef (het kaartje verdwijnt na een paar tellen, onthouden!).
Wie niet leest hoort elk ingrediënt voorgelezen.

### Touwspringen (Yuna en Feline)

Het eigen figuurtje springt touw. Het touw draait rond; tik ergens op het scherm om te springen net als het
touw onderaan is. Elke sprong telt, het touw gaat stilaan sneller. Drie keer struikelen en je bent klaar.
Niveaus: Traag, Normaal, Snel. Record per niveau.

### Huisdier wassen (Feline en Yuna)

Kies een huisdier (hondje, poes, konijn of pony). Het diertje zit vol modder. Vier stapjes, telkens met een
groot icoon: **schrobben** met de spons tot de modder weg is, **afspoelen** met de douche tot het schuim
weg is, **afdrogen** met de handdoek en tot slot een **strikje** of halsband kiezen. Geen tijd, geen fouten:
rustig en voor iedereen te doen. Wie niet leest hoort bij elke stap wat er moet gebeuren.

### Puzzels (iedereen)

Gebouwd op 24 oktober 2026. Kies een prent en het aantal stukjes, en sleep de stukjes (met echte nopjes) naar
hun plek op het bord; dicht genoeg bij de juiste plek klikt een stukje vast. Bij 4 en 6 stukjes staat de prent
vaag op het bord als hulp, bij 12 en 20 alleen het voorbeeld bovenaan. Record = snelste tijd per niveau.
Startniveau: wie niet leest 4 stukjes, de oudste lezer 20, andere lezers 12 (het kind kan zelf wisselen).
De prenten zijn voorlopig de drukste bladzijde van elk verhaal (`src/data/puzzels.ts`); de gegenereerde prenten
uit `docs/azure-extra.md` (stap 3) komen er later bij. Logica en tests in `src/lib/spelletjes/puzzel.ts`,
migratie `20261024000300_puzzels.sql` laat `puzzel` toe in het activiteitlog.

## Eigen ideeën voor later

- **Ballonnen prikken** (Feline): ballonnen zweven omhoog, prik er zoveel als het getal zegt (tellen).
- **Dino-eieren zoeken** (Luca, Feline): eieren verstopt in een prent, tik ze aan; elk ei kraakt open.
- **Doolhof** met de raceauto: veeg de auto naar de finish.
- **Moestuin**: elke dag water geven en de plantjes groeien echt mee met de dagen.
- **Dierengeluiden raden** (Feline): hoor een geluid, tik het juiste dier aan.

## Techniek

Zoals de bestaande spelletjes: spelregels zonder tekenwerk in `src/lib/spelletjes/<spel>.ts` met tests,
tekenwerk op een canvas of in SVG, het scherm in `src/schermen/<Spel>.tsx` binnen `SpelKader`. Migratie
`20261022001100_meer_spelletjes.sql` laat de nieuwe activiteiten toe in het activiteitlog.
