# Winkel: sterren inwisselen voor spelletjes en het figuurtje

Beslist door de ouders op 24 oktober 2026, na de eerste testen met de kinderen: vrijspelen met *ooit verdiende*
sterren (zonder dat er iets van het saldo afging) werkte niet als beloning. De kinderen kopen nu zelf wat op slot
staat, en die sterren gaan echt van hun saldo af. Dit vervangt optie C uit `docs/avatar.md` en het vrijspelen uit
`docs/spelletjes.md`.

## Regels

- Een spelletje of een stuk van het figuurtje dat iets kost, staat op slot met zijn prijs. Wie genoeg sterren
  heeft, tikt erop en krijgt de vraag **"Kopen?"** met de prijs en wat er daarna overblijft.
- Kopen gaat van het **vrije** saldo: sterren die gereserveerd zijn voor een tijdaanvraag kun je niet uitgeven.
- Gekocht is voor altijd. Twee keer kopen kost niets.
- Er is geen goedkeuring van een ouder nodig om te kopen: het zijn de eigen sterren van het kind.
- Wie niet leest (Feline) betaalt de helft, naar boven afgerond. Zij ziet de prijs als sterretjes en hoort de vraag
  voorgelezen; de knoppen zijn een kruisje en een vinkje.
- Te weinig sterren: een korte tip "Nog 6 sterren sparen" (of voorgelezen "Nog even sterren sparen!").
- Wat in de winkel ligt en welk kind wat ziet, kiezen de ouders bij Kinderen → Winkelaanbod (`docs/winkelaanbod.md`).
- De ouder kan de winkel per kind uitzetten bij Kinderen (de schakelaar "Figuurtje en spelletjes kopen met
  sterren"); dan is alles gratis.
- Alles wat een kind met het oude systeem al had vrijgespeeld, blijft van hem of haar zonder iets af te schrijven
  (de migratie zet dat als aankoop van 0 sterren in de tabel `aankopen`).

## De winkel van een kind

Op het startscherm zijn de sterren een knop naar de **Winkel** (`/kind/:id/winkel`, `src/schermen/Winkel.tsx`); wie
niet leest heeft een rond winkeltje in de kop. De winkel toont alles wat te koop is in één overzicht, met twee tabs:
Spelletjes en Figuurtje. Eerst wat het kind nu kan kopen, dan waarvoor het spaart (met een balkje), en wat al van het
kind is achteraan met "Van jou" (tik = spelen of aandoen). Alleen wat de ouders vrijgaven en voor dit kind tonen
(`docs/winkelaanbod.md`). Kopen kan ook nog gewoon in Spelen en in de kleerkast.

## Sterren uit spelletjes: meteen erbij

Lerende spelletjes (rekenen, verhalen, kleurplaten) leveren hun sterren **meteen** op, zonder goedkeuring. Het
dagplafond voor activiteiten (20 per kind per dag) en het spaarmaximum blijven gelden, en elke bijschrijving komt in
het puntenlog. Een ouder keurt alleen nog **taken** goed en geeft de **extra schermtijd**. Activiteiten die van voor
deze wijziging nog op goedkeuring wachten, blijven gewoon in Goedkeuren staan.

## Prijzen (voorstel)

| Spelletje | Prijs | Wie niet leest |
| --- | --- | --- |
| Rekenen, Memory, Penalty's | gratis | gratis |
| Huisdier wassen | 15 | 8 |
| Puzzels, Racen | 20 | 10 |
| Koken | 25 | 13 |
| Touwspringen | 30 | 15 |
| Basket | 40 | 20 |

Figuurtje: de basisstukken zijn gratis; de andere kosten 10, 15, 20, 25, 35 of 50 sterren (de cape is het duurst).
Alle kleuren zijn gratis.

Mijn huis (`docs/huis.md`): het hutje en de basisstukken zijn gratis. Groter bouwen kost 25 (huisje), 50 (verdieping),
80 (groot huis met garage) of 120 sterren (torenhuis); dak, muren, deur, ramen, tuin en extraatjes kosten 10 tot 60
sterren. Alles in de Huis-tab van de winkel of meteen op Mijn huis; wie niet leest betaalt de helft. Prijzen in
`src/data/huis.ts` en `supabase/migrations/20261024001700_mijn_huis.sql` (tabel `huis_stukken`).

De prijzen staan als data in `src/data/spelletjes.ts` en `src/data/figuurtje.ts`, en op de server in
`supabase/migrations/20261024000500_sterren_kopen.sql` (tabel `spel_prijzen`, kolom `figuurtje_stukken.prijs`).
De tests in `src/data/*.test.ts` houden de twee gelijk.

## Techniek

- Server: `kopen(kind, soort, sleutel, naam)` controleert prijs en vrij saldo, schrijft een aankoop en een
  afschrijving met bron `aankoop` in het puntenlog. `figuurtje_bewaren` aanvaardt alleen gratis of gekochte stukken.
  `activiteit_opslaan` schrijft de sterren meteen bij. Tests: `supabase/tests/figuurtje.test.sql` en
  `activiteiten.test.sql`.
- App: `KoopVraag.tsx` is het venster om te kopen, gebruikt in `Spelen.tsx` en `Kleerkast.tsx`. Het feestscherm
  voor mijlpalen (`NieuwStuk`) is weg.

## Soorten figuurtjes (8 november 2026)

Naast het kind kiest een kind bij Mijn figuurtje → **Soort** een robot, katje, ridder, astronaut of draakje (`soort` is een categorie van het figuurtje in `src/data/figuurtje.ts`, tekeningen in `src/lib/figuurtje/soorten.ts`). Prijzen: katje 30, robot 40, ridder 40, astronaut 50, draakje 60 (wie niet leest de helft); ze liggen pas in de winkel na vrijgave in Kinderen → Winkelaanbod. Bij een andere soort zijn alleen de tabbladen Soort en Extra te kiezen (hoeden, haar, shirt en broek horen bij het kind). Een nieuwe soort toevoegen: een tekening in `soorten.ts`, een stuk in de categorie `soort` en een rij in `figuurtje_stukken` (nieuwe migratie). Oudere figuurtjes zonder `soort` zijn een kind; de server accepteert 12 of 13 velden (migratie 20261108000200).
