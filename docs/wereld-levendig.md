# De wereld levendiger en voller maken (plan)

Gevraagd door Frederique op 27 oktober 2026: het grindpad terug zoals het was, dag en nacht met simpel weer, de huizen gespreid, een echte stad in plaats van een lege straat, bruikbare speeltoestellen en een bal om op te schieten. Alles in stappen, en 's nachts bouwt een routine de stad verder uit. De wereld blijft 2D (3D is geschrapt, bouw dat niet).

## Stappen

| Stap | Wat | Status |
| --- | --- | --- |
| 1 | Grindpad terug naar de platte look van vóór de opgehoogde rand | klaar (nieuwtje 0.46) |
| 2 | Dag, schemer en nacht volgens de klok; weer per blok van 3 uur (zon, bewolkt, regen, sneeuw in de winter) | klaar (0.46, `src/lib/wereld/weer.ts`) |
| 3 | Speeltoestellen bruikbaar: schommel (heen en weer), glijbaan (omhoog en naar beneden glijden), wip, zandbak; tik of loop op het toestel | klaar (0.47, `src/lib/wereld/speel.ts`; automatisch bij het toestel, tik of loop ervoor) |
| 4 | Een bal op het veld en op het plein: loop ertegenaan en hij rolt weg, tik op een doel voor een schot, doelpunt-melding | klaar (0.47, eerste versie: schoppen door ertegenaan te lopen) |
| 5 | Huizen gespreid: niet allemaal op één rij maar verspringend, met tuintjes en kleine straatjes ertussen | open |
| 6 | Stadsdesign: pleinen, wijken en randen (zie nachtelijke backlog) | loopt 's nachts |

## Nachtelijke stadsbouw

Elke nacht zet de bouwroutine één stuk stad erbij uit de backlog hieronder (bovenste niet-afgevinkte). Regels:

- Eén stuk per nacht, klein en af: tekening in `src/data/wereldPrenten.ts`, plek en botsvlak in `src/lib/wereld/kaart.ts` of `src/data/wereld.ts`, en `kaart.test.ts` moet groen blijven (alles bereikbaar, geen dingen op paden).
- Zoek een open plek, houd de hoofdstraat vrij, en sta niet op de deurmatten van gebouwen.
- Een nieuw nachtelijk spelgebouw gaat nog altijd via de bestaande regel (docs/wereld.md); dit is alleen decor en stad.
- Nieuwtje met volgend versienummer in `src/data/nieuwtjes.ts`, CI groen, direct naar main, dan hieronder afvinken.
- Eerst lezen wat er al staat: kijk naar `schermen/` screenshots met Playwright als dat kan en let op lege plekken.

### Backlog (volgorde = prioriteit)

- [ ] Bakker en café langs de hoofdstraat (decor, uithangbord, bankjes)
- [ ] Park met vijvertje, bloemperken en een paar banken
- [ ] Bibliotheek (gebouw als decor, later ingang naar Verhalen)
- [ ] Brandweerkazerne met rode auto
- [ ] Tweede straat met kleine huisjes en tuintjes
- [ ] Bushalte, fietsenrek en zebrapad
- [ ] Marktplein met kraampjes
- [ ] Kerkje of dorpstoren in het midden
- [ ] Boerderij met dieren aan de rand
- [ ] Speeltuin 2 bij de vijver (nog een glijbaan en klimrek)
- [ ] Fontein op het plein
- [ ] Sporthal naast het voetbalveld
