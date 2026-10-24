# Meldingen voor ouders (web-push)

Als een kind een taak afvinkt, extra tijd vraagt of sterren verdient met een verhaal of rekenen, krijgen de ouders een melding op hun gsm. Tikken op de melding opent **Goedkeuren**.

Zo werkt het: de gsm van een ouder bewaart een abonnement in `push_abonnementen`. Drie Database Webhooks roepen bij elke nieuwe rij de Edge Function `melding` aan; die vraagt de tekst op met `melding_tekst()` en stuurt de melding naar alle ouder-gsm's van het gezin.

## Eenmalig instellen

1. **Migratie**: voer `supabase/migrations/20261022000500_meldingen.sql` uit in de SQL Editor.
2. **Sleutels maken** (lokaal, in de projectmap): `npx web-push generate-vapid-keys`. Je krijgt een public en een private key.
   - De **public key** zet je in `.env.local` als `VITE_VAPID_PUBLIC_KEY=...` (en als variabele in GitHub, zie `docs/hosting.md` stap 2).
   - De **private key** komt nergens in de code of in git, alleen bij de secrets van stap 3.
3. **Edge Function**: Supabase → Edge Functions → Deploy a new function → Via Editor. Naam `melding`, plak de inhoud van `supabase/functions/melding/index.ts`, en zet **Verify JWT** uit (de functie controleert zelf een geheim).
   Bij Edge Functions → Secrets voeg je toe:
   - `VAPID_PUBLIC_KEY`: de public key
   - `VAPID_PRIVATE_KEY`: de private key
   - `MELDING_GEHEIM`: een lange willekeurige tekst die je zelf kiest
4. **Webhooks**: Database → Webhooks → Create a new hook, drie keer, voor de tabellen `inzendingen`, `tijdverzoeken` en `activiteitlog`:
   - Events: alleen **Insert**
   - Type: **Supabase Edge Functions**, functie `melding`, methode POST
   - HTTP header: `x-melding-geheim` met dezelfde waarde als `MELDING_GEHEIM`
5. **Op de gsm**: open de app (via https, dus de gehoste versie), zet hem op het startscherm, ga naar Ouder → Toestellen → **Meldingen aanzetten** en sta meldingen toe. Doe dit op beide ouder-gsm's.

## Goed om te weten

- Meldingen werken alleen via https, dus pas als de app gehost is (op Azure, zie `docs/hosting.md`); op `localhost` van je pc niet op de gsm.
- Spelletjes zonder sterren (memory, penalty's) geven geen melding.
- Een gsm die de melding niet meer kan ontvangen, wordt automatisch uit de lijst gehaald.
- Testen zonder kind: voeg een taak in via de app op de tablet en kijk of de melding binnenkomt; bij Edge Functions → melding → Logs zie je eventuele fouten.
