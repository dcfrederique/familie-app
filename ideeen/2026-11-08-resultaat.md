# Resultaat bouw 8 november 2026 (Sinterklaas, de pakjestoren)

- **Verhaal 53** "De pakjestoren" (333 woorden) en **kleurplaat** "De pakjestoren" (15 vlakken): meteen beschikbaar.
- **Spel Pakjestoren** (sleutel `torens`, 25 sterren, niet vrijgegeven): verhuis de toren van pakjes naar de gouden plank. Makkelijk: 2, 2, 3, 3 pakjes, de volgende goede zet licht op. Middel: 3, 3, 4, 4 pakjes, zetten en minimum zichtbaar. Moeilijk: 5, 6, 6, 7 pakjes, geen hulp, kleurregel (rood niet op rood, blauw niet op blauw) in de laatste twee rondes, Terug (telt als zet), klokje en pluimen (gehaald, hoogstens minimum + 20% zetten, binnen 4 minuten). Logica, kortste-wegzoeker (breedte eerst) en tests: `src/lib/spelletjes/torens.ts`.
- Afwijking van het plan: pakjes verplaats je alleen met tik-tik (slepen niet gebouwd); de eerste ronde van moeilijk heeft 5 pakjes op drie planken (geen extra planken).
- **Stukken** (niet vrijgegeven): helm van de pakjesbouwer, werkvest, stapeltje pakjes, pakjestoren, bezorgkar, wimpels; migratie `20261108000100_torens.sql`.
- **Springland**: De regenboogbrug (tweede level van Wolkenrijk, 110 breed, 3 + 2 + 2 gaten, twee vogels, twee vlaggetjes); het robotje speelt het uit in beide besturingen.
- **Wereld**: Pakjestoren op (15,8; 18) in het Meer, met gouden rand; (11,3; 18) viel af omdat de wereldtests dan faalden.
- Nieuwtje 0.111.
- Schermmeting `torens`: 20/20 tablets en 2/2 gsm liggend voor Luca, Yuna en Feline (na CSS-aanpassing voor de gsm).
- Open (niet door deze bouw): twee e2e-schermtests zijn rood sinds de nieuwe data-thema's van 7 november: `luca past op Gsm liggend` (Inpakpuzzel scrollt 12 px met thema Snoepbakkerij) en `yuna past op Galaxy Tab A / Fire HD 10 liggend` (welkomstpad: de Verder-knop bedekt de 12e themakeuze). De schermcontrole van vannacht pakt ze op.
