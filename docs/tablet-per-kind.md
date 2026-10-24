# Tablet per kind en welkomstpad

Gevraagd op 24 oktober 2026: voor de eerste versie bij de kinderen mogen ze elkaars account niet kunnen overnemen.
De eerste keer kiest het kind op zijn tablet wie het is, daarna volgt een speels welkomstpad en dan het eigen startscherm.

## Koppelen aan een kind

1. Een ouder koppelt de tablet met de koppelcode (zoals vroeger, **Toestellen > Tablet koppelen**).
2. De tablet toont **Wie ben jij?**. Het kind tikt op zijn naam en bevestigt met **Ja, dat ben ik!**.
3. Vanaf dan opent de tablet altijd bij dat kind. Er is geen terugknop naar de andere kinderen meer: links bovenaan staat het slotje voor mama of papa.

Wat de server bewaakt (migratie `20261024000200_tablet_per_kind.sql`):

- `accounts.kind_id`: het kind van de tablet. `tablet_kiezen` zet het de eerste keer zonder pincode.
- Een ander kind kiezen op een tablet die al van iemand is, of een kind kiezen dat al een andere tablet heeft, vraagt de pincode.
  Zo kan een kind met een tweede toestel (bv. de pc) wel, maar alleen als een ouder meekijkt.
- Een gekozen tablet kan alleen voor zijn eigen kind taken afvinken, tijd vragen, activiteiten bewaren en het figuurtje
  aanpassen (trigger `eigen_kind_bewaken`). Wat een ouder met de pincode doet (tijd geven, goedkeuren) mag wel voor elk kind.
- Een tablet die nog niemand koos werkt zoals vroeger, tot het kind kiest.

## Loskoppelen

- **Op de tablet**: slotje, pincode, **Toestellen > Ander kind laten kiezen**. De tablet vraagt opnieuw **Wie ben jij?**.
- **Op de gsm van een ouder**: **Toestellen > Tablets** toont elke tablet met zijn kind.
  **Loskoppelen** laat het kind opnieuw kiezen; **Verwijderen** haalt de tablet uit het gezin (nieuwe koppelcode nodig).

## Welkomstpad

Vier stappen en een feest, met grote knoppen en voor wie niet leest een voorleesknop en geen tekst:

1. **Hoi**: het figuurtje springt binnen en wiebelt, met fonkelende sterretjes.
2. **Figuurtje**: huid, kapsel, haarkleur en kleur van het shirt (alleen de basisstukken; de rest speelt het kind vrij met sterren), en een knop **Verrassing**.
3. **Verjaardag**: drie draaiknoppen (dag, maand, jaar), een taart met evenveel kaarsjes als het kind oud is en hoeveel nachtjes slapen tot de verjaardag. **Weet ik niet** slaat over; een ouder kan de verjaardag later invullen bij **Kinderen**.
4. **Thema**: zes kaarten met een voorproefje (dino's en auto's, prinsessenkasteel, feeëntuin, oranje, groen, paars). De hele app kleurt meteen mee.
5. **Feest**: confetti, het figuurtje springt, en tien sterren vliegen een voor een in de sterrenpil: *Hoera, je eerste 10 sterren!*

Pas bij het feest wordt alles in één keer bewaard (`welkom_afronden`). De welkomstbonus van 10 sterren komt maar één keer per
kind in het puntenlog (bron `welkom`), ook als een ouder het welkomstpad opnieuw toont (**Kinderen > Welkomstpad opnieuw tonen**).
Het is de enige keer dat er sterren bijkomen zonder goedkeuring van een ouder.

## Demo zonder Supabase

In de demo onthoudt de browser welk kind de tablet koos (localStorage). Elk kind doorloopt het welkomstpad; na herladen begint de demo opnieuw.
