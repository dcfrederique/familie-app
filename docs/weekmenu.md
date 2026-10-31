# Weekmenu

Idee van de ouders (24 oktober 2026): in het ouderdeel per dag de **warme maaltijd** invullen, en de kinderen zien op hun startscherm wat er vanavond op tafel komt.

## Ouderdeel

- Menu **Wij → Weekmenu** (`/ouder/weekmenu`, alleen op de gsm van een ouder).
- Eén week per keer (maandag tot zondag), met pijltjes naar de vorige en volgende week. Vandaag staat gemarkeerd.
- Per dag één tekstveld (max. 80 tekens). Leeg maken en bewaren haalt de dag weg.
- De app raadt een prentje uit het gerecht (`src/data/maaltijden.ts`, het eerst genoemde gerecht wint: "kip met frietjes" wordt kip). Tik op het prentje om een ander te kiezen. Prentjes: `src/data/maaltijdPrenten.tsx`.

## Kinderen

- Startscherm: naast de sterren een knop "Vanavond eten we …" met het prentje. Tikken leest het voor.
- Wie niet leest (Feline) krijgt alleen een rond prentje met een luidsprekertje in de kop; tikken leest "Vanavond eten we …" voor.
- Geen menu voor vandaag: geen knop.

## Database

Migratie `20261024000600_weekmenu.sql` (draait automatisch via de CI-job `migraties`): tabel `weekmenu (gezin_id, dag, gerecht, prentje)`. Het hele gezin leest (ook de tablets), alleen een ouder-account schrijft (RLS). Zonder migratie toont de app gewoon geen menu. Tests: `supabase/tests/weekmenu.test.sql`.


## Momenten, standaarden en recepten (31 oktober 2026)

Wens van Frederique: ook ontbijt, middag en vieruurtje in het weekmenu, eigen recepten kiezen zodat de voorraad klopt, en deelrecepten (bolognaisesaus uit de diepvries). Afboeken blijft met een tik (niet automatisch); standaardmaaltijden zijn instelbaar.

- **Momenten**: ontbijt, middag, avond, vieruurtje (`weekmenu.moment`, migratie `20261031000200_weekmenu_momenten.sql`). De avond staat altijd aan en is de warme maaltijd die de kinderen zien; de andere zet een ouder aan onder "Momenten en standaardmaaltijden" op het Weekmenu (`voorraad_instellingen.momenten`).
- **Standaardmaaltijd** (`weekmenu_standaard`): per moment (niet de avond) en per weekdag of "elke dag", bv. elke ochtend boterhammen. Een leeg moment krijgt de standaard; een vaste weekdag wint van "elke dag"; eigen invoer gaat voor. De avond heeft geen standaard.
- **Receptkiezer**: het boekje naast een rij opent je eigen recepten (zonder deelrecepten). Wat met de voorraad nu te koken is ("alles in huis") staat bovenaan, bij de andere staat wat ontbreekt. Het recept zet gewoon de naam in het veld (de koppeling gaat op naam, zoals altijd).
- **Afboeken** (Voorraad): per (dag, moment) een kaart "Gekookt, boek af" (bij ontbijt en vieruurtje "Gegeten"). Het vieruurtje rekent met `eters_vieruurtje` (standaard 4: de kinderen en Maxim), de rest met het aantal eters van het gezin. Standaardmaaltijden vragen enkel vanaf gisteren, geen week oude vragen.
- **Server**: `voorraad_gekookt_moment(dag, moment, overslaan)`; `voorraad_gekookt(dag, overslaan)` blijft de avond afboeken.
