# Resultaat reeks van vijf nachtrondes, 6 november 2026

Op vraag van Frederique in één keer gebouwd (plan: `ideeen/2026-11-06-reeks.md`). Alles wat met sterren te koop is, staat **nog niet in de winkel**: de ouders geven het vrij in Kinderen → Winkelaanbod.

- **Verhalen 47 tot 51**, meteen te lezen: Het lantaarnpad (Sint-Maarten, 317 woorden), De kist met het kleurenslot (Sinterklaas, avonturiers, 446), Chocomelk voor de hele straat (eerste vorst, 315), Wat is er anders? (de ochtend na het schoen zetten, kleine oortjes: bewust kort, 165 woorden, want die reeks heeft 3 tot 4 bladzijden) en Storm buiten, spelletjes binnen (herfststorm, 332).
- **Kleurplaten**, meteen beschikbaar: Lantaarns in de tuin, De kist met het kleurenslot, Warme chocomelk, Wat zit er in de schoen?, Regenboog na de storm.
- **Vijf spelletjes** (elk met tests die nagaan dat elke gemaakte ronde op te lossen is):
  - Lantaarns aansteken (25): Lights Out met een GF(2)-oplosser; moeilijk tot 6 × 5 en 11 aangetikte lantaarns.
  - Het kleurenslot (25): kleurencode raden; moeilijk is klassiek (alleen tellen, niet welke), 4 of 5 bolletjes uit 6 of 7 kleuren.
  - Chocomelkbuizen (25): buizen draaien; moeilijk is een volledig buizennet (opspannende boom) met tot drie bekers.
  - Zoek de verschillen (25): twee prenten; moeilijk tot 24 dingen en 8 verschillen, ook gespiegeld of kleiner, misstappen tellen.
  - Vier op een rij (30): tegen de eekhoorn; moeilijk denkt hij zes zetten vooruit (minimax met alfa-beta) en wint van een kind dat zomaar speelt.
- **Vijftien stukken** (3 per ronde): figuurtje Pakjesmuts, Muts met grote pompon, Met maan en sterren, Met speculaasje, Vier op een rij-shirt, Lichtpotje, Gouden sleutel, Beker chocomelk, Vergrootglas, Windmolentje; Mijn huis Lichtjesboog, Schatkist, Vogelhuisje, Speelgoedtrein, Vlieger. Migratie `20261106000200_reeks.sql` (ook de vijf activiteiten); `scripts/test-db.sh` groen.
- **Springland**: Zonnestrand kreeg De schelpenbaai, De hoge duinen (pittig), De lange pier, Het vuurtorenpad (pittig) en de **krabbaas** (nieuwe baas-soort `krab`). Het robotje speelt alles uit in beide besturingen. Zonnestrand is vol: de volgende nacht begint een vijfde wereld.
- **De wereld**: het dorp had geen vrije plek meer. Een gebouw kan nu een gebied hebben (`gebied` in `src/data/wereld.ts`); de vijf gebouwen staan in het **Meer** langs de weg die van het dorp komt (Lantaarnhuisje, Schatkamer, Chocomelkhuis, Speurdershuis, Spelletjesboom). Gouden rand, slot en vrijgave werken zoals altijd. Ouders kunnen ze verplaatsen in Kaart bewerken.
- **Nieuwtjes 0.99 tot 0.103** (één per ronde).

## Voor de nachtroutine
- Volgende nieuwtje: 0.104. Volgende migratie na `20261106000200`.
- Springland: Zonnestrand is vol, begin een nieuwe wereld.
- De wereld: in het Meer is nog plaats onder de westweg (rond y 18, links van de noord-zuidweg); zet `gebied: 'meer'` op het gebouw.
