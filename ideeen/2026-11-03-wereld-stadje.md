# Dagverslag wereld, 3 november 2026 (tweede stuk): Stadje

Gebied: **Stadje**. Erbij: een grindstraat naar het oosten (rijen 12-13), een plein van 8 × 4 tegels met fontein, tien stadshuizen in drie kleuren (nieuwe tekeningen `stadshuis`, `stadshuis2`, `stadshuis3`), 3 geparkeerde auto's (geen autowegen), fontein en auto (nieuwe tekeningen, ook bij Decor), 8 lantaarns, 4 banken en 13 bomen in een parkje. Ids `ding:<soort>:stadje:N`, `pad:stadje:X:Y`. Het stuk x 17-24, y 5-11 blijft open voor de Kaart-bewerken-tests.

Gecontroleerd: gebieden.test.ts (huizen, fontein, auto's; poorten onderling bereikbaar, pad naar plein en parkje), schermafdruk van Kaart bewerken (project: schermen/wereld-gebieden/stadje.png). Daarna blijft alleen extra decor in het Dorp over; de bestaande tests die een leeg gebied nodig hebben wijzen nu naar het Stadje (open plek) en blijven werken zolang die plek vrij blijft.
