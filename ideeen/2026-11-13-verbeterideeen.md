# Verbeterideeën 13 november 2026

Derde reeks. Alleen voorstellen, niets gebouwd. De ideeën van 11 en 12 november staan nog open en worden niet herhaald. Gecontroleerd in de code: geen "spel van de dag", geen rustmoment, geen ingesproken voorlezen door ouders, geen vakantie- of ziekenstand, geen beurtrol en geen sterrenoverzicht per maand. (Taken aan meerdere kinderen tegelijk en de geschiedenis per kind bestaan al.)

## De zes titels
1. Spelletje van de dag (kind, klein)
2. Een rustmoment na een tijdje spelen (kind, klein tot middel)
3. Mama of papa leest voor (kind, groot)
4. Vakantie- en ziekenstand (ouder, klein tot middel)
5. Beurtrol voor gedeelde taken (ouder, klein tot middel)
6. Sterren per maand: verdiend en uitgegeven (ouder, middel)

---

## 1. Spelletje van de dag
**Voor:** kind (Luca en Yuna, Feline met prentje en voorleesknop)
**Kans:** met zoveel spelletjes kiezen kinderen telkens hetzelfde of raken ze verloren.
**Voorstel:** bovenaan Spelen een grote kaart "Probeer vandaag eens …" met één spel dat het kind bezit maar al lang niet speelde. Elke dag een ander, willekeurig maar vast per kind en dag. Spelen blijft gewoon: een tik opent het spel. Geen extra sterren.
**Omvang:** klein. Geen migratie (laatst gespeeld per toestel). Nieuwtje nodig.

## 2. Een rustmoment na een tijdje spelen
**Voor:** kind en ouder
**Kans:** spelletjes tellen mee voor de app-tijd en een kind speelt soms een uur zonder pauze.
**Voorstel:** na 30 minuten spelletjes verschijnt een zacht prentje "Even uitrusten?" met een tikken-keuze: een verhaaltje, een kleurplaat of gewoon doorgaan. Er wordt niets geblokkeerd. Een ouder zet het aan of uit en kiest de minuten per kind in Spelregels.
**Omvang:** klein tot middel. Instelling per kind (migratie). Nieuwtje nodig.

## 3. Mama of papa leest voor
**Voor:** kind (vooral Feline en Yuna), ouders
**Kans:** de voorleesstem is een computerstem; een kind luistert liever naar mama of papa, ook als die er niet is.
**Voorstel:** in het ouderdeel bij een verhaal een knop "Inspreken": de ouder leest alinea per alinea voor en kan een alinea opnieuw doen. Het kind ziet bij dat verhaal een tweede voorleesknop met een foto-rondje van mama of papa. Opnames staan op de server per gezin, alleen leesbaar voor dat gezin.
**Omvang:** groot. Opslag en migratie, een opnamescherm op de gsm. Nieuwtje nodig.

## 4. Vakantie- en ziekenstand
**Voor:** ouder (gsm)
**Kans:** bij ziekte of vakantie staan er taken open die niets te maken hebben met die dag, en herhalingen lopen door.
**Voorstel:** in Kinderen en tijd per kind of voor iedereen "Pauzeer taken tot …". Taken verdwijnen van het startscherm, herhalingen schuiven mee, er is geen enkele straf. Het kind ziet een prentje "Rustdag". Na de einddatum komt alles vanzelf terug.
**Omvang:** klein tot middel. Datumveld per kind (migratie) en aanpassing in `src/lib/takenstatus.ts`. Nieuwtje nodig.

## 5. Beurtrol voor gedeelde taken
**Voor:** ouder (stelt in), kind (ziet "Vandaag is het jouw beurt")
**Kans:** voor tafel dekken of de hond uitlaten moet je nu elke dag opnieuw bepalen wie het doet, of geef je ze aan iedereen.
**Voorstel:** bij een taak de keuze "Om de beurt": de taak is elke dag voor één kind, in een vaste volgorde. Het kind ziet het groot op zijn startscherm, de anderen zien "Vandaag is het de beurt van Yuna". Sterren zoals elke goedgekeurde taak.
**Omvang:** klein tot middel. Veld bij taken en een rotatieregel in `takenstatus.ts` (migratie). Nieuwtje nodig.

## 6. Sterren per maand: verdiend en uitgegeven
**Voor:** ouder (gsm)
**Kans:** ouders zien de geschiedenis per kind, maar niet of de sterren in balans zijn: verdient een kind te veel of te weinig, zijn de prijzen te hoog?
**Voorstel:** onder Kinderen een overzicht per kind en per maand: verdiend (taken, activiteiten, ouder) en uitgegeven (tijd, winkel, huisdier, pot) met een eenvoudig staafje. Een zin als "Luca spaarde 120 sterren niet uit" helpt bij het bijstellen van prijzen en daglimieten. Alleen lezen.
**Omvang:** middel. Afgeleid van het puntenlog (geen migratie). Nieuwtje nodig.
