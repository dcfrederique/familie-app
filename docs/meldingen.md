# Meldingen voor ouders (web-push)

Als een kind een taak afvinkt, extra tijd vraagt of sterren verdient met een verhaal of rekenen, krijgen de ouders een melding op hun gsm. Tikken op de melding opent **Goedkeuren**.

Zo werkt het: de gsm van een ouder bewaart een abonnement in `push_abonnementen`. Bij elke nieuwe rij in `inzendingen`, `tijdverzoeken` of `activiteitlog` roept een trigger (`melding_versturen`, via pg_net) de Edge Function `melding` aan; die vraagt de tekst op met `melding_tekst()` en stuurt de melding naar alle ouder-gsm's van het gezin.

**Waarom een geheim?** De Edge Function staat open op internet. Zonder controle kon iedereen die het adres kent valse meldingen naar jullie gsm's laten sturen. De trigger zet daarom een wachtwoord (`x-melding-geheim`) in de aanvraag en de functie controleert het. Dat wachtwoord maakt de database zelf aan (tabel `melding_instellingen`) en CI geeft hetzelfde door aan de functie: niemand moet het ooit typen.

## Eenmalig instellen (alles verder gaat vanzelf via CI)

1. **Sleutels maken** (lokaal): `npx web-push generate-vapid-keys`. De **public key** staat als variabele `VITE_VAPID_PUBLIC_KEY` in GitHub (en in `.env.local`); de **private key** komt alleen als GitHub-secret `VAPID_PRIVATE_KEY`.
2. **Toegangstoken**: Supabase → klik rechtsboven op je profiel → **Access Tokens** → **Generate new token**. Als GitHub-secret `SUPABASE_ACCESS_TOKEN`. Hiermee mag CI de Edge Function uitrollen.
3. Klaar. Bij de volgende push naar `main` draait CI de migratie (trigger + `pg_net`), zet het adres en het geheim, en rolt de functie `melding` uit (job `meldingen` in `ci.yml`).
4. **Op de gsm**: open de gehoste app, zet hem op het startscherm, ga naar Ouder → Toestellen → **Meldingen aanzetten** en sta meldingen toe. Doe dit op beide ouder-gsm's.

Werkt het niet? Start in GitHub → Actions → **Meldingen nakijken**: die toont of de functie bestaat, of er gsm's zijn aangemeld en wat de laatste aanroepen antwoordden.

## Goed om te weten

- Meldingen werken alleen via https, dus pas als de app gehost is (op Azure, zie `docs/hosting.md`); op `localhost` van je pc niet op de gsm.
- Spelletjes zonder sterren (memory, penalty's) geven geen melding.
- Een gsm die de melding niet meer kan ontvangen, wordt automatisch uit de lijst gehaald.
- Testen zonder kind: voeg een taak in via de app op de tablet en kijk of de melding binnenkomt; bij Edge Functions → melding → Logs zie je eventuele fouten.
