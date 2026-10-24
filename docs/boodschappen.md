# Boodschappen

Gevraagd door Frederique op 24 oktober 2026: een boodschappenlijst in het ouderdeel (Wij → Boodschappen), met per artikel de winkel waar je het koopt, en een weergave per winkel. Vanuit het weekmenu zet je de ingrediënten van een gerecht op de lijst.

## Wat de ouders zien

- **Wij → Boodschappen** (`/ouder/boodschappen`, `src/schermen/Boodschappen.tsx`): bovenaan de winkels als tabbladen (Alle, Colruyt, Aldi, …) met het aantal open artikels. In de winkel kies je die winkel en zie je enkel wat je daar moet halen (plus wat nog geen winkel heeft). De keuze wordt per toestel onthouden.
- Toevoegen: naam en winkel. De app vult de winkel van de vorige keer in voor hetzelfde artikel, anders de winkel die bovenaan gekozen is. Eerdere artikels worden voorgesteld tijdens het typen.
- Afvinken = in de kar. Een gekocht artikel blijft nog 12 uur doorstreept staan, zodat een misklik terug te zetten is. Tik op een artikel om naam, hoeveelheid of winkel aan te passen, of om het weg te gooien.
- **Instellingen → Winkels** (`/ouder/winkels`, `src/schermen/Winkels.tsx`): winkels toevoegen, hernoemen, herschikken (die volgorde geldt op de lijst) en weggooien. Artikels van een weggegooide winkel komen bij "Nog geen winkel". Elk gezin begint met Colruyt, Aldi, Lidl en Albert Heijn.
- **Weekmenu**: naast elk gerecht staat een karretje. Dat opent de ingrediënten: voorstellen uit `src/data/ingredienten.ts` (per deel van het gerecht, "stoofvlees met frietjes" geeft beide), of wat de ouders de vorige keer voor hetzelfde gerecht op de lijst zetten. Aanvinken, per ingrediënt een winkel kiezen (of "Alles in …") en **Op de lijst**. Wat al open op de lijst staat, is niet aangevinkt. Het getal op het karretje = open artikels voor die dag.

## Gegevens

Migratie `supabase/migrations/20261024000900_boodschappen.sql`:

- `winkels` (naam uniek per gezin, `volgorde`), met een trigger die bij een nieuw gezin de vier standaardwinkels aanmaakt; bestaande gezinnen kregen ze bij de migratie.
- `boodschappen` (naam, hoeveel, `winkel_id` of null, `dag` en `gerecht` als het uit het weekmenu kwam, `gekocht_op`, `gekocht_door`).
- RLS: enkel een ouder-account van het eigen gezin (`is_ouder_account()`); tablets zien niets, ook niet met de pincode. Een winkel van een ander gezin kan niet gebruikt worden.
- Gekochte artikels blijven bewaard: de app laadt de laatste 60 dagen om winkels en ingrediënten per gerecht te onthouden.

Tests: `supabase/tests/boodschappen.test.sql` en `src/lib/boodschappen.test.ts`.

## Nog niet

- Meldingen of een teller in het menu voor de boodschappen.
- Hoeveelheden uit het weekmenu (alles komt zonder hoeveelheid op de lijst).
