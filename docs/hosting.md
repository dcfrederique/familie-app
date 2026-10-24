# Hosting en de hele Azure-setup

Stand: 24 oktober 2026. De app draait op **Azure Static Web Apps (Free)**. Elke commit op `main` gaat automatisch online zodra CI groen is; elke PR krijgt een eigen voorbeeld-adres. De backend blijft Supabase (zie `docs/azure.md`).

## Adres van de app

| Wat | Adres |
| --- | --- |
| App (tablets en gsm's van de kinderen) | https://thankful-meadow-0d992b403.5.azurestaticapps.net |
| Ouderschermen | https://thankful-meadow-0d992b403.5.azurestaticapps.net/ouder |

Het hoofdadres stuurt zelf door: een ouder-gsm komt op `/ouder`, een gekoppelde tablet op het eigen kind, een nieuwe tablet op het koppelscherm. Scan de QR-codes hieronder met de camera van het toestel.

De app heet op het startscherm **Familie**. Staat ze nog als "Sterren" op een toestel (van vóór 24 oktober 2026), verwijder het icoon dan en zet de app opnieuw op het startscherm: Android en iOS nemen een nieuwe naam niet altijd vanzelf over. De gegevens blijven gewoon bewaard.

| App | Ouderschermen |
| --- | --- |
| ![QR-code app](qr/app.svg) | ![QR-code ouderschermen](qr/ouder.svg) |

## Hoe het werkt

```
commit op main ──► CI: lint + tests + build ──┐
                   CI: databasetests ─────────┴─► deployen ──► https://<naam>.azurestaticapps.net
PR open/bijgewerkt ─► zelfde tests ─────────────► deployen ──► voorbeeld-adres (staat als reactie in de PR)
PR gesloten/gemerged ───────────────────────────► voorbeeld opruimen
```

- Alles staat in `.github/workflows/ci.yml`. Faalt een test, dan wordt er niets gedeployed en blijft de vorige versie online.
- De app wordt in GitHub gebouwd met de VITE_-waarden uit de repository-variabelen en als kant-en-klare map `dist/` naar Azure gestuurd.
- `public/staticwebapp.config.json` regelt in Azure: elke route (`/kind/2`, `/ouder/...`) toont de app (SPA-fallback), de service worker (`sw.js`) en `index.html` worden altijd opnieuw gecontroleerd zodat een update meteen doorkomt, en de bestanden in `/assets/` worden een jaar bewaard (hun naam verandert bij elke versie).
- Https zit er standaard bij, dus web-push (`docs/meldingen.md`), installeren op het startscherm en de camera werken.
- Zonder het secret `AZURE_STATIC_WEB_APPS_API_TOKEN` slaat de deploy-job zich over; CI blijft dan gewoon groen.

**Kost:** Static Web Apps Free, Speech Free F0 en een Storage-account van enkele MB: samen ±€0,05 per maand. Free geeft 100 GB verkeer per maand, 2 eigen domeinen en 3 voorbeeld-adressen tegelijk.

**Over het Visual Studio-abonnement:** dit alles kost (bijna) niets van het tegoed. De voorwaarde "dev/test only" (`docs/azure.md`) blijft gelden; wie dat strikt wil, maakt dezelfde resources op een gratis pay-as-you-go-abonnement. Valt het abonnement weg, dan gaat de app offline tot je hem opnieuw aanmaakt (de deploy is één secret wisselen), de gegevens in Supabase blijven.

## Wat Frederique doet (±40 minuten in totaal)

Plak nooit een sleutel of wachtwoord in de chat; ze gaan alleen in GitHub of Supabase. Zeg in de chat gewoon welke stap klaar is.

Waar de GitHub-instellingen staan: repo `dcfrederique/familie-app` → **Settings** → links **Secrets and variables → Actions**. Daar zijn twee tabbladen: **Secrets** (geheim, niet meer te lezen na opslaan) en **Variables** (zichtbaar, voor publieke waarden).

### 1. Static Web App aanmaken (±10 minuten)

1. Ga naar [portal.azure.com](https://portal.azure.com) en log in met het account van je Visual Studio-abonnement.
2. Typ bovenaan in de zoekbalk **Static Web Apps** en klik erop, dan **+ Create**.
3. Tabblad **Basics**:
   - **Subscription**: je Visual Studio-abonnement
   - **Resource group**: **Create new** → `familie-app` (hierin komt alles van deze app)
   - **Name**: `familie-app` (dit wordt niet het adres; Azure kiest zelf een naam zoals `happy-river-0a1b2c3d`)
   - **Plan type**: **Free**
   - **Source**: **Other** (niet GitHub: anders maakt Azure zelf een tweede workflow in de repo, wij hebben er al een)
   - Staat er een vraag naar een regio voor de API: **West Europe**
4. **Review + create**, daarna **Create**. Wacht tot "Your deployment is complete" en klik **Go to resource**.
5. Noteer op **Overview** de **URL** (`https://...azurestaticapps.net`). Dat is het adres van de app.
6. Klik bovenaan op **Manage deployment token** en kopieer het token.
7. In GitHub, tabblad **Secrets** → **New repository secret**: naam `AZURE_STATIC_WEB_APPS_API_TOKEN`, waarde het token.

### 2. Supabase-gegevens voor de build (±3 minuten)

In GitHub, tabblad **Variables** → **New repository variable**, drie keer:

| Naam | Waarde |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://oyqwhrttwaatqymjomtc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys**, de **publishable** key (begint met `sb_publishable_`). Niet de secret key. |
| `VITE_VAPID_PUBLIC_KEY` | de public key uit `docs/meldingen.md` stap 2. Heb je die nog niet, laat deze dan voorlopig weg; meldingen staan dan uit. |

Dit zijn publieke waarden (ze zitten sowieso in de app), daarom variabelen en geen secrets.

### 3. Eerste deploy en Supabase laten verwijzen naar het nieuwe adres

1. In GitHub: **Actions → CI** → de laatste run op `main` → **Re-run all jobs** (of wacht op de volgende commit). De job **deployen** wordt groen en toont het adres.
2. In Supabase: **Authentication → URL Configuration → Site URL** = het adres uit stap 1.5, en **Save**. Dan klopt de link in de bevestigingsmail.
3. Open het adres op de gsm, zet de app op het startscherm (menu ⋮ → **App installeren**) en zet de meldingen aan (`docs/meldingen.md` stap 5).

### 4. Speech-resource voor de voorleesstem (±10 minuten)

Zoals in `docs/voorleesstem.md` stap 1, kort:

1. Zoekbalk: **Speech services** → **+ Create**.
2. **Resource group** `familie-app`, **Region** **West Europe**, **Name** bv. `familie-app-stem`, **Pricing tier** **Free F0** (niet Standard S0).
3. **Review + create** → **Create** → **Go to resource** → links **Keys and Endpoint**.
4. In GitHub, tabblad **Secrets**: `AZURE_SPEECH_KEY` = **KEY 1**, `AZURE_SPEECH_REGION` = `westeurope`.

### 5. Opslag voor de wekelijkse back-up (±15 minuten)

1. Zoekbalk: **Storage accounts** → **+ Create**.
2. Tabblad **Basics**: **Resource group** `familie-app`, **Storage account name** bv. `familieappopslag` (alleen kleine letters en cijfers, wereldwijd uniek), **Region** **West Europe**, **Primary service** **Azure Blob Storage**, **Performance** **Standard**, **Redundancy** **Locally-redundant storage (LRS)**. De andere tabbladen laat je zoals ze staan.
3. **Review + create** → **Create** → **Go to resource**.
4. Links **Data storage → Containers** → **+ Container**: naam `backups`, **Anonymous access level** **Private**, **Create**.
5. Links **Data management → Lifecycle management** → **Add a rule**: naam `oud-weg`, **Rule scope** alle blobs, **Blob type** Block blobs → **Next** → **Base blobs**: *Created* *More than* `90` days ago → **Delete the blob** → **Add**.
6. Links **Security + networking → Access keys** → bij **key1** naast **Connection string** op **Show** en kopiëren.
7. In GitHub, tabblad **Secrets**: `AZURE_BACKUP_CONNECTION_STRING` = die connection string.
8. In Supabase: bovenaan op **Connect** → **Connection string** → bij **Method** kies **Session pooler** (de directe verbinding werkt niet vanuit GitHub). Kopieer de URI en vervang `[YOUR-PASSWORD]` door je databasewachtwoord (vergeten? **Project Settings → Database → Reset database password**; kies er een zonder `@`, `:` of `/`, dat vermijdt problemen in de URI).
9. In GitHub, tabblad **Secrets**: `SUPABASE_DB_URL` = die URI.

De back-up draait elke zondagnacht (`.github/workflows/backup.yml`). Terugzetten: zie `docs/supabase.md`.

### 6. Alles controleren (±2 minuten)

In GitHub: **Actions → Azure controleren → Run workflow**. Na een halve minuut zie je per onderdeel een vinkje of wat er nog ontbreekt. Onderaan de run staat **proefopnames-stem** met dezelfde zin door Dena en door Arnaud: download, luister met de kinderen en kies een stem. Daarna meteen ook **Actions → Back-up database → Run workflow** om de eerste back-up te maken.

## Overzicht van wat waar staat

| Naam | Soort in GitHub | Waarvoor | Workflow |
| --- | --- | --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | secret | deployen | `ci.yml` |
| `VITE_SUPABASE_URL` | variabele | build | `ci.yml` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | variabele | build | `ci.yml` |
| `VITE_VAPID_PUBLIC_KEY` | variabele | build, meldingen | `ci.yml` |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | secret | voorleesstem | `azure-check.yml`, later `stem.yml` |
| `AZURE_BACKUP_CONNECTION_STRING` | secret | back-up | `backup.yml` |
| `SUPABASE_DB_URL` | secret | back-up | `backup.yml` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | secret | wakker houden | `keep-alive.yml` |

In Azure staat alles in één resource group `familie-app`: de Static Web App, de Speech-resource en het Storage-account. Later komt daar de container `prenten` bij (`docs/azure-extra.md` deel 3).

## Later, optioneel

- **Eigen domein** (bv. `familie.jouwdomein.be`): Static Web App → **Custom domains** → **+ Add**, een CNAME bij je domeinregistrar. Https blijft gratis. Pas daarna ook de Site URL in Supabase aan.
- **Kostenalarm**: **Cost Management → Budgets** → budget van €5 per maand met een mail bij 80%. Het Visual Studio-abonnement heeft ook een bestedingslimiet, maar een mail is vroeger.
