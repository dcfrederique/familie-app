# Backend naar Azure? (beslissingsdocument)

Stand: 24 oktober 2026. Nog niets gemigreerd; dit document vergelijkt de opties en geeft een aanbeveling.

## Waarom deze vraag

De app draait nu op **Supabase Free**: Postgres met al onze spelregels als SQL-functies (8 migraties, ±1070 regels, met tests), pg_cron die elke 5 minuten verzoeken laat vervallen, Supabase Auth (ouders met e-mail, tablets anoniem + koppelcode van 8 tekens), Storage voor bewijsfoto's en een Edge Function `melding` die via Database Webhooks web-push stuurt.

Het probleem: **een gratis Supabase-project wordt gepauzeerd na 7 dagen zonder activiteit.** In een vakantieweek waarin de kinderen niets doen, staat de app daarna stil tot een ouder hem in het Supabase-dashboard terug opstart. Er zijn ongeveer **€130 per maand aan Azure-tegoed** (Visual Studio-abonnement) beschikbaar.

## Eerst iets belangrijks over het Azure-tegoed

Microsoft schrijft bij het tegoed: *"Monthly Azure credits for Visual Studio subscribers are specifically for individual dev/test usage only."* Een app die het gezin elke dag echt gebruikt, is strikt genomen geen dev/test meer. Niemand gaat een gezinsapp controleren, maar het is wel een grijze zone, en het tegoed hangt aan je licentie. Twee andere dingen om te weten:

- Op dat abonnement staat standaard een **bestedingslimiet**: is het tegoed op, dan **stoppen de diensten** tot volgende maand. Geen verrassingsfactuur, maar wel een app die stilvalt.
- Wie het netjes wil doen, kan dezelfde Azure-opzet ook op een **gewoon pay-as-you-go-abonnement** zetten. Optie C hieronder kost daar bijna niets.

## De opties

### A. Supabase houden + automatische "keep-alive" (basislijn)

Een GitHub Actions-workflow doet twee keer per week een kleine vraag aan de database. Dan is het project nooit 7 dagen inactief en wordt het niet gepauzeerd.

- **Kost**: €0 (een paar seconden GitHub Actions-tijd per week, ruim binnen de gratis minuten van een privé-repo).
- **Werk**: 15 minuten. De workflow staat al klaar in `.github/workflows/keep-alive.yml`; Frederique moet alleen twee secrets toevoegen (zie onderaan).
- **Nadelen**: de andere grenzen van Supabase Free blijven: 500 MB database, 1 GB opslag voor foto's, en **geen back-ups** die je zelf kunt terugzetten. Als Supabase de regels voor gratis projecten verandert, moeten we opnieuw kijken.

### B. Azure Database for PostgreSQL – Flexible Server (SQL behouden)

Dezelfde Postgres, maar dan bij Azure. Onze SQL-functies, triggers en tests blijven bijna ongewijzigd, en **pg_cron wordt ondersteund**. Wat Supabase "gratis rondom" levert, moeten we zelf vervangen:

| Supabase-onderdeel | Op Azure |
|---|---|
| Postgres + pg_cron | Flexible Server, Burstable **B1ms** (1 vCore, 2 GB) |
| Auto-API (PostgREST) | **PostgREST** als container in Azure Container Apps, óf een eigen kleine API in Azure Functions |
| Auth (e-mail ouders) | **Entra External ID** (eerste 50.000 gebruikers per maand gratis) of eigen e-mail-login in de API |
| Anoniem + koppelcode (tablets) | Eigen Azure Function die na de koppelcode een token voor het toestel uitgeeft |
| `auth.uid()` in onze RLS-regels | Kleine shimfunctie die de gebruiker uit het token leest (PostgREST zet dat token al in de sessie, net als bij Supabase) |
| Storage (foto's) | **Blob Storage**, uploaden via een tijdelijke SAS-link uit de API |
| Database Webhook + Edge Function `melding` | Azure Function die na een nieuwe inzending/verzoek de push stuurt (web-push werkt even goed vanuit Node of C#) |
| Hosting | **Static Web Apps Free** (sinds 24 oktober 2026, `docs/hosting.md`) |

- **Kost per maand** (West-Europa, ongeveer): B1ms ±€13–15, 32 GB opslag ±€3,5, back-ups 7 dagen inbegrepen, Container Apps / Functions / Blob / Static Web Apps binnen de gratis hoeveelheden ±€0–1. **Totaal ±€18–20 per maand, ongeveer 15% van het tegoed.** Er pauzeert niets.
- **Werk**: middelgroot, ±2 à 3 werksessies. De spelregels blijven, het werk zit in login, foto's, meldingen en de koppeling in `src/lib/bron/` (die laag hebben we al apart gehouden, dus de schermen veranderen niet).
- **Taal**: kan in TypeScript blijven (Functions in Node) of de API-stukjes in C#; de database blijft SQL.

### C. Azure Functions in C#/.NET + Azure SQL Database (gratis aanbod)

De "Microsoft-manier": een API in C# (Azure Functions, isolated worker) en **Azure SQL Database**, waarvoor er een **levenslang gratis aanbod** is: per database 100.000 vCore-seconden rekentijd en 32 GB per maand, tot 10 databases per abonnement.

- **Kost**: €0 zolang het binnen de gratis rekentijd blijft. Daar zit de adder: de gratis database pauzeert zichzelf na een uur zonder verbinding en wordt pas wakker bij de volgende vraag (de eerste keer dan enkele seconden tot een minuut wachten op de tablet). 100.000 vCore-seconden is ongeveer **55 uur "wakker" per maand**. Met kinderen die 's ochtends en 's avonds iets doen, zitten we daar snel boven. Dan kies je bij het aanmaken: pauzeren tot volgende maand (app ligt plat) of doorbetalen aan het gewone serverless-tarief (±€10–15 per extra 100.000 seconden). Realistisch: **€0–15 per maand.**
- **Werk**: groot, ±5 à 8 werksessies. Alle spelregels (nu Postgres-functies en RLS) moeten herschreven worden in T-SQL of C#, inclusief tests. De cron van elke 5 minuten moet weg (die zou de database altijd wakker houden): verzoeken laten vervallen wordt dan "lui" berekend bij het lezen, of een Timer-Function die maar af en toe draait. Auth, foto's en meldingen zoals bij B.
- **Pluspunt**: volledig in een taal die je kent, en dit is ook de optie die op een gewoon pay-as-you-go-abonnement bijna gratis is.

### D. Cosmos DB (gratis laag)

Cosmos DB heeft een gratis laag (1000 RU/s en 25 GB). Maar het is een documentdatabase zonder SQL-functies, triggers of transacties over meerdere tabellen heen, terwijl onze sterrenlus net daarop steunt (reserveren, toekennen, terugboeken in één transactie). **Afgeraden**: het meeste werk en het minst passend.

## Vergelijking

| | A. Supabase + keep-alive | B. Azure Postgres | C. .NET + Azure SQL free | D. Cosmos DB |
|---|---|---|---|---|
| Kost per maand | €0 | ±€18–20 (tegoed) | €0–15 | €0–5 |
| Pauzeert na een vakantie? | Nee (met keep-alive) | Nee | Wordt traag wakker, kan uit gratis rekentijd lopen | Nee |
| Spelregels herschrijven | Nee | Nee | Ja, alles | Ja, alles |
| Werk | 15 min | 2–3 sessies | 5–8 sessies | 8+ sessies |
| Back-ups | Geen op Free | 7 dagen inbegrepen | 7 dagen inbegrepen | Inbegrepen |
| Licentie-risico tegoed | Geen | Dev/test-grijze zone | Geen op pay-as-you-go | Geen op pay-as-you-go |

## Aanbeveling

1. **Nu: optie A.** De keep-alive lost het echte probleem (pauzeren na een stille week) vandaag op, voor €0 en zonder iets te herschrijven. Ik zou er ook een wekelijkse export bij overwegen, omdat Supabase Free geen back-ups heeft.
2. **Als we toch naar Azure gaan: optie B**, Azure Database for PostgreSQL Flexible Server. Het is de enige Azure-optie die al onze geteste spelregels behoudt, het pauzeert nooit, en ±€20 per maand past ruim in het tegoed. Hou wel rekening met de dev/test-voorwaarde van het tegoed.
3. **Optie C** alleen als je de backend uitdrukkelijk in C# wilt hebben (om te leren of om het zelf te onderhouden). Dan is het een herschrijving, geen verhuis.

Goede momenten om alsnog over te stappen naar B: de database of foto's komen in de buurt van de gratis grenzen (500 MB / 1 GB), Supabase verandert zijn gratis regels, of we willen echte back-ups.

## Keep-alive aanzetten (optie A)

De workflow `.github/workflows/keep-alive.yml` draait op maandag en donderdag en doet één kleine leesvraag aan de database (die de anonieme sleutel mag weigeren; de vraag komt wel tot in Postgres). Zolang de secrets ontbreken, slaat hij zichzelf over.

1. GitHub → repo **familie-app** → Settings → Secrets and variables → Actions → **New repository secret**:
   - `SUPABASE_URL`: `https://oyqwhrttwaatqymjomtc.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: dezelfde publishable key als in `.env.local`
2. Actions → **Supabase wakker houden** → **Run workflow** om het meteen te testen. Een groen vinkje betekent dat de database geantwoord heeft.

## Bronnen

- [Azure SQL Database free offer](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer)
- [Prijzen Azure Database for PostgreSQL](https://azure.microsoft.com/en-gb/pricing/details/postgresql/) en [B1ms per regio](https://www.bytebase.com/dbcost/azure-flexible/instance/B1ms/)
- [Maandelijks Azure-tegoed voor Visual Studio-abonnees](https://azure.microsoft.com/en-us/pricing/member-offers/credit-for-visual-studio-subscribers/)
