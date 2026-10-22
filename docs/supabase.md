# Supabase opzetten

Project: `https://oyqwhrttwaatqymjomtc.supabase.co`

## 1. Database

Voer in de Supabase-console, **SQL Editor**, de bestanden in `supabase/migrations/` uit, in volgorde van naam.
Een script dat al gedraaid heeft, draai je niet opnieuw. `20261022000300_voorbeeldtaken_fotos.sql` maakt ook de privé-opslag `fotos` aan voor bewijsfoto's. Of met de Supabase CLI:
`supabase link --project-ref oyqwhrttwaatqymjomtc` en daarna `supabase db push`.

## 2. Instellingen bij Authentication

- **Sign In / Providers > Allow anonymous sign-ins**: aanzetten. Tablets melden zich anoniem aan en koppelen met een code.
- **Sign In / Providers > Email > Confirm email**: mag aan blijven (dan krijg je een bevestigingsmail) of uit voor sneller testen.
- **URL Configuration > Site URL**: het adres van de app (bv. de Vercel-URL), zodat de link in de bevestigingsmail klopt.

## 3. In de app

1. Op de gsm van de eerste ouder: **Ik ben mama of papa**, account maken, gezin aanmaken (kinderen staan al ingevuld), pincode instellen.
2. **Toestellen > Tablet koppelen** geeft een code van 8 tekens, 30 minuten geldig. Op de tablet: **Tablet van de kinderen** en de code intypen.
3. **Toestellen > Gsm van … koppelen** geeft een code voor de andere ouder. Die maakt eerst een account en kiest dan **Ik heb een code**.

## Regels

Alle sterrenregels zitten in Postgres-functies: indienen, goedkeuren, reserveren, toekennen, terugboeken,
vervallen (elke 5 minuten via pg_cron), dagplafond, tijdvenster en spaarmaximum. Ouder-acties op een tablet
vragen de pincode (na 5 fouten 10 minuten geblokkeerd).
Tests: `scripts/test-db.sh` (lokale Postgres 16 nodig) of de CI-job `database`.
