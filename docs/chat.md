# Chat van de kinderen naar de ouders

Gevraagd door Frederique op 24 oktober 2026: een kind kan vanop zijn tablet een bericht sturen, de ouders krijgen een melding en antwoorden.

## Hoe het werkt

- **Per kind aan of uit**: Ouder → Kinderen en tijd → vinkje *Mag berichten sturen naar mama en papa*. Standaard uit. Zolang het uit staat, ziet het kind geen berichtenknop en weigert de server nieuwe berichten (oude blijven leesbaar).
- **Kind**: een rond berichtenknopje in de kop van het startscherm (met een rood bolletje bij een nieuw antwoord). Het scherm *Berichten* heeft het thema van het kind (race, kasteel, tuin).
  - Wie leest (Luca, Yuna): typen, plus snelle stickers met een zin (“Ik heb honger”).
  - Wie niet leest (Feline): enkel acht grote prentjes (kom je even, honger, dorst, klaar, hulp, toilet, verdrietig, ik hou van jou). Antwoorden van de ouders kan ze laten voorlezen.
  - Een sticker komt bij de ouders aan als gewone zin, zodat melding en gesprek gewoon leesbaar zijn.
- **Ouders**: Wij → *Chat met de kinderen* (alleen op de gsm), met een tab per kind en een teller bij ongelezen berichten, ook in het menu. Een bericht van een kind geeft een melding (zelfde weg als goedkeuren: trigger → pg_net → Edge Function `melding`, zie `docs/meldingen.md`); tikken opent de chat.
- **Gezien**: berichten krijgen “gezien” zodra de ander het gesprek opent.

## Wie schreef, en meldingen terug

- Bij elk bericht staat het figuurtje van de schrijver. Kinderen zien zo of mama of papa antwoordde (met naam); de ouders zien elkaar en het kind. Elke ouder maakt zijn eigen figuurtje via Chat → *Mijn figuurtje aanpassen* (alles vrij, geen sterren; RPC `ouder_figuurtje_bewaren`).
- Een antwoord van mama of papa geeft ook een melding op de **tablet van het kind**. Aanzetten kan op de tablet onder Ouderdeel → Toestellen en meldingen → *Meldingen aanzetten* (achter de pincode). Tikken op de melding opent het gesprek.
- Geen melding voor wie het gesprek op dat moment open heeft: het scherm meldt zich elke 20 seconden (`chat_aanwezig`), 45 seconden stilte telt als weg. De ontvangers (en dit filter) kiest de database in `chat_push`; de Edge Function `melding` verstuurt alleen.

## Veiligheid

- Tabel `berichten` heeft geen rechtstreekse toegang; alles loopt via `chat_berichten`, `chat_sturen`, `chat_gelezen` en `chat_overzicht`. Een tablet die bij een kind hoort, kan niet meelezen in het gesprek van een ander kind.
- Een kind kan maximaal 30 berichten per 10 minuten sturen (anders vol gsm).
- Een sticker is een sleutel (`^[a-z_]{1,20}$`); de prentjes en zinnen staan in `src/data/stickers.ts`.

## Later

Spraakbericht (opnemen en versturen) voor wie niet leest, en foto's sturen.

Migraties: `20261024001400_chat.sql`, `20261024001800_chat_meldingen.sql`. Tests: `supabase/tests/chat.test.sql`, `src/lib/chat.test.ts`.
