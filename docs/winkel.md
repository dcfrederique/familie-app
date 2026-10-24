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
