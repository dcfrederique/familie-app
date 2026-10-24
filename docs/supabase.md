# Supabase opzetten

Project: `https://oyqwhrttwaatqymjomtc.supabase.co`

## 1. Database

Voer in de Supabase-console, **SQL Editor**, de bestanden in `supabase/migrations/` uit, in volgorde van naam.
Een script dat al gedraaid heeft, draai je niet opnieuw. `20261022000300_voorbeeldtaken_fotos.sql` maakt ook de privé-opslag `fotos` aan voor bewijsfoto's; `20261022000400_activiteiten.sql` voegt het activiteitlog toe (sterren uit rekenen, na goedkeuring). `20261022001000_figuurtje.sql` voegt het eigen figuurtje per kind toe; zonder die migratie toont de app het basisfiguurtje maar kan een kind niets bewaren. `20261024000200_tablet_per_kind.sql` laat elke tablet bij één kind horen en voegt het welkomstpad toe (`docs/tablet-per-kind.md`); zonder die migratie werkt de tablet zoals vroeger (Wie speelt er?). `20261024000400_leesoefening.sql` voegt **Ik lees zelf** toe (`docs/azure-extra.md`, stap 2); daarvoor is ook de Edge Function `spraak-token` nodig (zie onder). Of met de Supabase CLI:
`supabase link --project-ref oyqwhrttwaatqymjomtc` en daarna `supabase db push`.

## 2. Instellingen bij Authentication

- **Sign In / Providers > Allow anonymous sign-ins**: aanzetten. Tablets melden zich anoniem aan en koppelen met een code.
- **Sign In / Providers > Email > Confirm email**: mag aan blijven (dan krijg je een bevestigingsmail) of uit voor sneller testen.
- **URL Configuration > Site URL**: het adres van de app (de Azure-URL uit `docs/hosting.md`), zodat de link in de bevestigingsmail klopt.

## 3. In de app

1. Op de gsm van de eerste ouder: **Ik ben mama of papa**, account maken, gezin aanmaken (kinderen staan al ingevuld), pincode instellen.
2. **Toestellen > Tablet koppelen** geeft een code van 8 tekens, 30 minuten geldig. Op de tablet: **Tablet van de kinderen** en de code intypen. Daarna kiest het kind **Wie ben jij?** en doorloopt het welkomstpad; vanaf dan opent de tablet altijd bij dat kind.
3. **Toestellen > Gsm van … koppelen** geeft een code voor de andere ouder. Die maakt eerst een account en kiest dan **Ik heb een code**.

## 4. Edge Function spraak-token (Ik lees zelf)

1. **Edge Functions → Deploy a new function → Via Editor**. Naam `spraak-token`, plak de inhoud van `supabase/functions/spraak-token/index.ts`. **Verify JWT** blijft **aan** (alleen een aangemelde tablet of gsm mag een token vragen).
2. **Edge Functions → Secrets**: `AZURE_SPEECH_KEY` en `AZURE_SPEECH_REGION`, dezelfde waarden als de GitHub-secrets van de voorleesstem.
3. Testen: op de tablet van Yuna of Luca een verhaal uit Grote ogen of Avonturiers openen en op **Ik lees zelf** tikken. De eerste keer vraagt de tablet of de app de microfoon mag gebruiken: **Toestaan**. Fouten zie je bij Edge Functions → spraak-token → Logs.

Zonder de functie of de migratie toont de knop een melding en leest het kind gewoon zoals vroeger.

## Regels

Alle sterrenregels zitten in Postgres-functies: indienen, goedkeuren, reserveren, toekennen, terugboeken,
vervallen (elke 5 minuten via pg_cron), dagplafond, tijdvenster en spaarmaximum. Ouder-acties op een tablet
vragen de pincode (na 5 fouten 10 minuten geblokkeerd).
Tests: `scripts/test-db.sh` (lokale Postgres 16 nodig) of de CI-job `database`.

## Back-up terugzetten

Elke zondagnacht zet `.github/workflows/backup.yml` een back-up in Azure (Storage-account → container `backups`, één bestand per week, 90 dagen bewaard; opzetten in `docs/hosting.md` stap 5). Zo'n bestand bevat de gebruikers uit `auth` (alleen data) en het volledige schema `public` (tabellen, functies, RLS, grants en data). Bewijsfoto's zitten er niet in.

Terugzetten in een **nieuw, leeg** Supabase-project (niet over een bestaand project heen):

1. Azure: Storage-account → **Containers → backups** → het bestand → **Download**.
2. Nieuw Supabase-project aanmaken, zelfde instellingen als in stap 2 hierboven. Voer **geen** migraties uit: die zitten al in de back-up.
3. In Supabase: **Connect → Session pooler** en kopieer de URI (met wachtwoord).
4. Op een pc met Postgres 17 (`psql`):
   ```bash
   gunzip -c 2026-10-26.sql.gz | psql "<URI van het nieuwe project>" -v ON_ERROR_STOP=1
   ```
5. De taak van pg_cron (verzoeken laten vervallen) zit niet in de back-up: voer in de **SQL Editor** het bestand `supabase/migrations/20261021000100_vervallen_cron.sql` nog eens uit.
6. Bewijsfoto's opnieuw: de opslag `fotos` aanmaken zoals in `20261022000300_voorbeeldtaken_fotos.sql` (alleen het deel over storage).
7. Pas `VITE_SUPABASE_URL` en `VITE_SUPABASE_PUBLISHABLE_KEY` aan in GitHub (variabelen) en de secrets van `keep-alive.yml` en `backup.yml`; de volgende commit op `main` zet de app over. Tablets en gsm's blijven aangemeld zolang hun token geldig is, anders opnieuw koppelen.

Probeer dit één keer echt uit met een proefproject, anders weet je niet of de back-up deugt.
