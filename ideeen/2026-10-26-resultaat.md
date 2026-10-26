# Resultaat 2026-10-26

Thema: Sint-Maarten en de herfst. Alles uit `ideeen/2026-10-26.md` is gebouwd.

## Gebouwd
- **Verhaal 32, De lampion van Sint-Maarten** (Grote ogen, 10 bladzijden, 317 woorden): `src/data/verhalen/32-de-lampion-van-sint-maarten.json`, alleen bestaande figuren. Meteen beschikbaar.
- **Bladeren sorteren** (sleutel `bladeren`, **20 sterren**, 10 voor wie niet leest): logica + 6 tests (`src/lib/spelletjes/bladeren.ts`), scherm `Bladeren.tsx` (slepen of op een mandje tikken, juiste mandje wipt na 4 seconden, fout mandje kost niets), in het spelmenu en op route `bladeren`. Niveaus: makkelijk (2 kleuren), middel (3 kleuren), moeilijk (3 vormen). Activiteit `bladeren` (speeltijd, geen sterren).
- **Stukken** (alle niet vrijgegeven): figuurtje Herfstmuts 15, Met herfstblad 20, Lampion 15; Mijn huis Bladerhoop 15, Paddenstoelen 20, Lampionnenslinger 25 (zonder prenten-vlag, zodat Feline er niet te veel krijgt).
- **Springland: Het herfstbos**, vierde level in Zonnevallei (bos, egel, appel, 126 kolommen). Het robotje speelt het uit (vanzelf en zelf).
- **Gebouw in de wereld: het bladerhuisje** (zie `docs/wereld.md`, "Gebouwen van spelletjes"): gouden rand de eerste 14 dagen, slot zolang het spel niet gekocht is, alleen zichtbaar na vrijgave in Winkelaanbod (ouders zien het als het in de winkel ligt), stoepje naar de hoofdstraat, terugknop komt in de wereld uit. Een volgend spel hoeft alleen een rij in `gebouwen` en een tekening.
- Migratie `20261026000100_sint_maarten.sql`: activiteit-check en omschrijving met `bladeren`, `spel_prijzen`, `figuurtje_stukken`, `huis_stukken` (alles `standaard_vrij` false).
- Nieuwtje 0.38 bovenaan `src/data/nieuwtjes.ts`.

## Wijzigingen buiten het plan
- De catalogustests (`spelletjes`, `figuurtje`, `huis`) lazen elk één vaste migratie. Nu lezen ze alle migraties vanaf 25 oktober via `src/lib/laterMigraties.ts`, zodat een nieuwe nacht geen test hoeft aan te passen.
- `Gebouw` kreeg `spel` en `nieuwSinds`; `maakKaart`, `wegen` en `obstakels` nemen een lijst gebouwen aan (standaard alle), zodat elk kind zijn eigen set heeft.

## Tests
- `npm run lint`, `npm test` (277 + nieuwe wereldtests), `npm run build` groen; `scripts/test-db.sh` groen.
- Browsercheck (Playwright, demo): wereld met bladerhuisje (gouden gloed, slot, stoepje), tik op het gebouw geeft de slotzin, het spel is met slepen uit te spelen op alle drie de niveaus, terugknop naar de wereld; geen console-fouten. Tekeningen van de stukken bekeken.

## Open punten
- Voorleesopnames voor verhaal 32 en de zinnen `bladerenUitleg`, `bladerenKlaar` en `spelSlot` komen met de volgende ronde van de stemworkflow.
- Het bladerhuisje en het spel zijn niet op een echte tablet bekeken; het slot gebruikt `ctx.filter` (Chrome/Android, niet Safari).
- Een thema-prentje voor het spel in `themaPrenten.ts` is niet gemaakt (het spelmenu gebruikt het gewone icoon).
- Het spel en de stukken liggen pas in de winkel nadat jullie ze vrijgeven in Kinderen → Winkelaanbod.
