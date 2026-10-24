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
