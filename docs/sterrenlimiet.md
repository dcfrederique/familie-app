# Sterrenlimiet per spelletje

Gevraagd door de ouders op 25 oktober 2026: de limiet voor het aantal sterren dat een kind per spelletje kan verdienen, instelbaar.

- Gaat over de lerende activiteiten die sterren opleveren: `rekenen`, `verhaal`, `zelf_gelezen`, `kleurplaat`, `schrijven`.
- Een limiet is het hoogste aantal sterren per dag voor dat spelletje (0 tot 120). Geen rij = geen eigen limiet.
- Tabel `activiteit_limiet` (migratie 20261025000800): `kind_id` null geldt voor het hele gezin; een rij voor één kind gaat voor.
- Instellen: ouder-account, Spelregels → Sterren per spelletje per dag; RPC `activiteit_limiet_zetten(kind, activiteit, max)` (max null wist).
- Server: `activiteit_opslaan` rekent eerst de sterren van de ronde uit, past het gezamenlijke dagplafond voor activiteiten toe (`gezinnen.activiteit_sterren_per_dag`, 20) en daarna de limiet van het spelletje (al verdiend vandaag met dat spelletje). Het spaarmaximum blijft gelden.
- Sterren per ronde zelf (bv. 5 per verhaal) blijven vast; alleen het dagmaximum is instelbaar.
- Test: `supabase/tests/sterrenlimiet.test.sql`; demo-bron rekent hetzelfde.
