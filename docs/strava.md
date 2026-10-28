# Strava-koppeling

Basis gebouwd op 28 oktober 2026 (op vraag van Frederique). Bouwt op `docs/lopen.md`. Wat nog ontbreekt zijn de gegevens van Strava zelf: zie "Wat Frederique doet".

## Hoe het werkt

1. In Lopen tikt een ouder **Koppel met Strava**. De app roept de Edge Function `strava` aan (`actie: 'start'`), die een Strava-adres teruggeeft met een ondertekende `state` (ouder + tijdstip, 15 minuten geldig).
2. Strava vraagt toestemming (`read` en `activity:read_all`) en stuurt de ouder terug naar `…/functions/v1/strava?code=…&state=…`.
3. De functie controleert de `state`, ruilt de code in voor tokens, bewaart ze in `strava_koppelingen` en haalt alle activiteiten op. Daarna stuurt ze de ouder terug naar `/ouder/lopen?strava=gekoppeld`.
4. Alleen activiteiten van het type Run, TrailRun en VirtualRun worden `loopsessies` met `bron = 'strava'` en `externe_id` = het Strava-id. Het soort volgt `workout_type` (wedstrijd, lange duurloop, interval); hoogte, gemiddelde hartslag en de route (polyline) worden mee bewaard.
5. De functie meldt zich ook aan voor de **webhook** van Strava. Een nieuwe, gewijzigde of verwijderde activiteit komt dan binnen enkele seconden in de app, zonder dat iemand op synchroniseren tikt. **Nu synchroniseren** blijft bestaan als vangnet.
6. Een loop die al in de lijst staat krijgt van Strava enkel de gemeten waarden (afstand, duur, hoogte, hartslag, route, dag). Soort, hoe het ging en de notitie blijven van de ouder.
7. **Ontkoppelen** trekt de toegang bij Strava in en wist de tokens; de lopen blijven staan. Trekt de ouder de toegang bij Strava in, dan meldt de webhook dat ook en wissen we de koppeling.

## Veiligheid

- De tokens staan in `strava_koppelingen`, zonder policies en zonder rechten voor de app (`supabase/tests/strava.test.sql` bewaakt dat). Alleen de Edge Function (service-rol) leest ze. De app vraagt enkel `strava_status()`.
- De `state` is een HMAC met het clientgeheim, dus niemand kan een koppeling aan een andere ouder hangen.
- De webhook controleert `hub.verify_token`. Het controlewoord wordt in CI afgeleid van het clientgeheim.
- Het clientgeheim komt nooit in de app (geen `VITE_`-variabele).

## Wat Frederique doet (eenmalig)

1. **Strava-app maken** op <https://www.strava.com/settings/api> (aangemeld als de ouder die de app maakt):
   - Application Name: bv. *Familie-app*; Category: *Training* of *Other*; Website: het adres van de app (`https://thankful-meadow-0d992b403.5.azurestaticapps.net`).
   - **Authorization Callback Domain**: enkel het domein van het Supabase-project, bv. `abcdefgh.supabase.co` (zonder `https://` en zonder pad).
   - Een icoon uploaden is verplicht (bv. het app-icoon).
2. Daarna toont Strava het **Client ID** (een getal) en het **Client Secret**.
3. In GitHub (repo → Settings → Secrets and variables → Actions) twee secrets zetten: `STRAVA_CLIENT_ID` en `STRAVA_CLIENT_SECRET`. `SUPABASE_ACCESS_TOKEN` en de variabele `VITE_SUPABASE_URL` staan er al van de meldingen.
4. De volgende push op main rolt de functie uit (CI-job `strava`, slaat zichzelf over zolang de secrets ontbreken). Daarna is het een kwestie van op **Koppel met Strava** tikken.
5. Optioneel: `APP_URL` als Edge Function-secret als de app ooit naar een ander adres verhuist (standaard het huidige Azure-adres).

### Let op: beperking van nieuwe Strava-apps

Een nieuwe Strava-app staat volgens de documentatie in een soort "single player mode": alleen de maker van de app (één atleet) kan koppelen. Voor de tweede ouder moet je bij Strava om meer atleten vragen (formulier in de developer-documentatie; voor een gezinsapp wordt dat meestal toegestaan). Tot dan kan een partner nog altijd zelf lopen invullen. Controleer dit op de Strava-pagina bij het aanmaken, want Strava past dit beleid soms aan.

## Grenzen van de API

- Tokens van Strava verlopen na 6 uur; de functie vernieuwt ze zelf (de refresh token wisselt dan mee).
- Standaard limiet: 100 oproepen per 15 minuten en 1000 per dag voor de hele app, ruim genoeg voor twee ouders.
- De webhook levert alleen een melding; de details halen we zelf op. Strava probeert een mislukte melding een paar keer opnieuw.
- Strava verbiedt in de voorwaarden om hun gegevens aan anderen te tonen dan de atleet zelf: lopen blijven dus privé per ouder, zoals nu.

## Later

Zie `docs/loop-analyse.md` voor wat we met de lopen kunnen berekenen.
