# Winkelaanbod: wat er in de winkel van de kinderen ligt

Gevraagd door de ouders op 24 oktober 2026: zelf kiezen wat de kinderen kunnen kopen, zodat nieuwe spelletjes en
stukken voor het figuurtje in fases vrijkomen, en per kind kiezen welke spelletjes het te zien krijgt.

## Waar

Ouderdeel → Kinderen → **Winkelaanbod** (`/ouder/aanbod`), alleen op de gsm van een ouder (zoals Pincode en
Winkels). Het menu toont een getal als er nieuw aanbod is dat nog geen ouder bekeek.

## Regels

- **In de winkel** (per gezin): wat aan staat, kunnen de kinderen kopen. Wat uit staat, zien ze niet meer in Spelen
  of in de kleerkast, behalve wat ze al gekocht hebben: gekocht blijft van het kind.
- **Per kind** (de knopjes met de figuurtjes): wat voor een kind uit staat, ziet dat kind niet, ook niet als het al
  gekocht is. Zo kan een ouder ook een gratis spelletje (Rekenen, Memory, Penalty's) voor één kind weglaten.
- Gratis stukken van het figuurtje (de basisstukken en alle kleuren) staan er altijd; ze staan niet in de lijst.
- Een stuk dat een kind aan heeft, blijft in de kleerkast staan, ook als een ouder het uit de winkel haalt.
- **Standaard**: alles wat er op 24 oktober 2026 al was, ligt in de winkel. Wat er later bijkomt (de nachtelijke
  bouw voegt elke nacht een spelletje toe) ligt er **pas als een ouder het vrijgeeft**. Het staat bovenaan onder
  "Nieuw, nog niet vrijgegeven" met de knoppen Vrijgeven en Nog niet.
- De schakelaar "Figuurtje en spelletjes kopen met sterren" bij Kinderen en tijd blijft: uit = alles gratis, maar
  alleen voor wat in de winkel ligt.

## Prijs instellen

Bij elk spelletje en elk stuk dat iets kost, staat de prijs in een invulveld (0 tot 500 sterren; 0 = gratis).
Tik buiten het veld of op Enter om te bewaren. Staat er een eigen prijs, dan verschijnt "Standaard (15)" om terug te
gaan naar de prijs uit de catalogus. Wie niet leest betaalt nog altijd de helft van de ingestelde prijs, naar boven
afgerond. Een nieuwe prijs geldt voor wat nog niet gekocht is; wat al gekocht is, blijft gekocht.

## Techniek

- Migratie `supabase/migrations/20261024001100_winkelaanbod.sql`:
  - kolom `standaard_vrij` op `spel_prijzen` en `figuurtje_stukken` (bestaande rijen `true`, nieuwe rijen `false`);
  - tabel `aanbod` (keuze per gezin, zonder rij geldt `standaard_vrij`) en `aanbod_verborgen` (per kind);
  - functie `in_aanbod(kind, soort, sleutel)`; `kopen` weigert wat niet in de winkel ligt ("nog niet in de winkel")
    en `figuurtje_bewaren` met "alles vrij" ook;
  - schrijven alleen vanaf een ouder-account (RLS met `is_ouder_account()`), lezen voor het hele gezin.
- Migratie `20261024001500_aanbod_prijs.sql`: kolom `aanbod.prijs` (vrijgegeven mag nu leeg zijn: dan geldt `standaard_vrij`),
  functie `winkel_prijs`; `kopen` en `figuurtje_bewaren` gebruiken de ingestelde prijs.
- Tests: `supabase/tests/winkelaanbod.test.sql` en `src/data/aanbod.test.ts`.
- App: `src/data/aanbod.ts` (regel `inAanbod` en de lijst `aanbodItems`), `bron.aanbod()`, `aanbodVrijgeven`,
  `aanbodVoorKind`; scherm `src/schermen/Winkelaanbod.tsx`; Spelen en Kleerkast filteren erop.
- Later ook Mijn huis: voeg de soort toe aan de check van `aanbod` en `aanbod_verborgen`, en de items aan `aanbodItems`.
