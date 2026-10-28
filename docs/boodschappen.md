# Boodschappen

Gevraagd door Frederique op 24 oktober 2026: een boodschappenlijst in het ouderdeel (Wij → Boodschappen), met per artikel de winkel waar je het koopt, en een weergave per winkel. Vanuit het weekmenu zet je de ingrediënten van een gerecht op de lijst.

## Wat de ouders zien

- **Wij → Boodschappen** (`/ouder/boodschappen`, `src/schermen/Boodschappen.tsx`): bovenaan de winkels als tabbladen (Alle, Colruyt, Aldi, …) met het aantal open artikels. In de winkel kies je die winkel en zie je enkel wat je daar moet halen (plus wat nog geen winkel heeft). De keuze wordt per toestel onthouden.
- Toevoegen: naam en winkel. De app vult de winkel van de vorige keer in voor hetzelfde artikel, anders de winkel die bovenaan gekozen is. Eerdere artikels worden voorgesteld tijdens het typen.
- Afvinken = in de kar. Een gekocht artikel blijft nog 12 uur doorstreept staan, zodat een misklik terug te zetten is. Tik op een artikel om naam, hoeveelheid of winkel aan te passen, of om het weg te gooien.
- **Instellingen → Winkels** (`/ouder/winkels`, `src/schermen/Winkels.tsx`): winkels toevoegen, hernoemen, herschikken (die volgorde geldt op de lijst) en weggooien. Artikels van een weggegooide winkel komen bij "Nog geen winkel". Elk gezin begint met Colruyt, Aldi, Lidl en Albert Heijn.
- **Weekmenu**: naast elk gerecht staat een karretje. Dat opent de ingrediënten: voorstellen uit `src/data/ingredienten.ts` (per deel van het gerecht, "stoofvlees met frietjes" geeft beide), of wat de ouders de vorige keer voor hetzelfde gerecht op de lijst zetten. Aanvinken, per ingrediënt een winkel kiezen (of "Alles in …") en **Op de lijst**. Wat al open op de lijst staat, is niet aangevinkt. Het getal op het karretje = open artikels voor die dag.

## Prijzen, categorieën en uitgaven (gevraagd op 24 oktober 2026)

- **Categorie per artikel**: bij toevoegen kies je een categorie. De app onthoudt de categorie van de vorige keer, en stelt anders iets voor uit de naam (`src/data/categorieSleutels.ts`: "verse melk" is Zuivel en eieren). Ingrediënten uit het weekmenu krijgen hetzelfde voorstel. Standaardcategorieën: Groenten en fruit, Vlees en vis, Zuivel en eieren, Brood en ontbijt, Droge voeding, Diepvries, Dranken, Snoep en koeken, Huishouden, Verzorging, Andere.
- **Prijs per artikel, ingevuld na de boodschappen**: heb je in een winkel artikels afgevinkt, dan staat bij die winkel een knop **Afrekenen**. Daar vul je de prijs per artikel in (zoals op de kassabon), met een totaal eronder. Wat niet op de lijst stond, vul je in bij "Niet op de lijst" (komt als gekocht artikel "Andere aankopen" in de uitgaven). Een prijs of categorie later aanpassen kan door op het artikel te tikken, of bij Uitgaven → Nog zonder prijs.
- **Wij → Uitgaven** (`/ouder/uitgaven`, `src/schermen/Uitgaven.tsx`): per maand het totaal, verdeeld **per winkel** of **per categorie**; tik op een regel voor de verdeling over het andere (bij Colruyt: welke categorieën, bij Zuivel: welke winkels). Alleen gekochte artikels met een prijs tellen mee; artikels zonder prijs staan onderaan om snel aan te vullen.
- **Instellingen → Winkels en categorieën**: beide lijsten toevoegen, hernoemen, herschikken, weggooien. Weggegooid = bestaande uitgaven komen bij "Geen winkel" of "Geen categorie".
- Bedragen: Vlaamse schrijfwijze (1,29), tot 99 999,99 euro.

## Gegevens

Migratie `supabase/migrations/20261024000900_boodschappen.sql`:

- `winkels` (naam uniek per gezin, `volgorde`), met een trigger die bij een nieuw gezin de vier standaardwinkels aanmaakt; bestaande gezinnen kregen ze bij de migratie.
- `boodschappen` (naam, hoeveel, `winkel_id` of null, `dag` en `gerecht` als het uit het weekmenu kwam, `gekocht_op`, `gekocht_door`).
- RLS: enkel een ouder-account van het eigen gezin (`is_ouder_account()`); tablets zien niets, ook niet met de pincode. Een winkel van een ander gezin kan niet gebruikt worden.
- Gekochte artikels blijven bewaard: de app laadt de laatste 60 dagen om winkels en ingrediënten per gerecht te onthouden.

Migratie `supabase/migrations/20261025000100_uitgaven.sql`: tabel `categorieen` (naam uniek per gezin, `volgorde`, trigger met de standaardcategorieën bij een nieuw gezin) en op `boodschappen` de kolommen `categorie_id` en `prijs` (numeric 8,2, niet negatief). RLS blijft enkel voor ouder-accounts; een categorie van een ander gezin kan niet gebruikt worden.

Tests: `supabase/tests/boodschappen.test.sql`, `supabase/tests/uitgaven.test.sql` en `src/lib/boodschappen.test.ts`.

## Nog niet

- Meldingen of een teller in het menu voor de boodschappen.
- Een prijs per eenheid of een kassabon als geheel (de prijs hoort bij het artikel; een totaal zonder artikels kan als "Andere aankopen").
- Budget of vergelijking met vorige maand.
- Hoeveelheden uit het weekmenu (alles komt zonder hoeveelheid op de lijst).

## Prijs per eenheid (27 oktober 2026, nieuwtje 0.50)

Bij een artikel (bewerken en Afrekenen) kies je Totaal of Per eenheid. Per eenheid: prijs per stuk/kg/l plus aantal (komma mag, leeg = 1); de app berekent totaal = eenheidsprijs × aantal (op de cent) en bewaart dat in `prijs`, zodat Uitgaven ongewijzigd optelt. Kolommen `eenheidsprijs` en `aantal` (migratie 20261027000500) onthouden hoe het ingegeven werd. Logica: `prijsUitInvoer` in `src/lib/boodschappen.ts`.

## Verwachte prijs (28 oktober 2026, nieuwtje 0.68)

Open artikels tonen een schatting (`± €`, schuin) uit de laatste aankoop met prijs: liefst dezelfde winkel, anders een andere (met `*`). Was toen een eenheidsprijs ingegeven en staat in Hoeveel nu een aantal, dan eenheidsprijs × aantal. Boven elke winkel staat "Verwacht ± €" (som van de schattingen, artikels zonder eerdere prijs apart geteld). Alleen app-logica (`schatPrijs`, `schatLijst` in `src/lib/boodschappen.ts`), geen migratie; gebruikt de 60 dagen geschiedenis die de lijst al laadt.
