# Verbeterideeën 11 november 2026

Eerste reeks. Alleen voorstellen, niets gebouwd. Gecontroleerd in de code: geen van de zes bestaat al (geen weekkaart, dagritme, kindvoorstel, weekrapport, herinneringen of gezinsagenda gevonden).

## De zes titels
1. Mijn weekkaart met stickers (kind, middel)
2. Ochtend- en avondroutine met prentjes (kind, klein tot middel)
3. "Ik deed iets extra's" (kind, klein)
4. Weekoverzicht op zondagavond (ouder, middel)
5. Zachte herinneringen (ouder, klein tot middel)
6. Gezinsagenda met "Wat doen we vandaag?" (ouder en kind, groot)

---

## 1. Mijn weekkaart met stickers
**Voor:** kind (vooral Feline en Yuna)
**Kans:** een kind ziet nu enkel het saldo, niet wat de hele week opleverde; Feline kan sterren tellen maar ziet geen verloop.
**Voorstel:** op Ik een kaart met maandag tot zondag. Elke goedgekeurde taak plakt een sticker (eigen prentje, geen merken) op de dag. Zijn alle taken van een dag klaar, dan komt er een groot sterretje en een voorleesknop zegt "Dat was een goede dag". Geen extra sterren, enkel overzicht en trots.
**Omvang:** middel. Geen migratie (afgeleid van inzendingen). Nieuwtje nodig.

## 2. Ochtend- en avondroutine met prentjes
**Voor:** kind (Feline en Yuna), ouders winnen tijd
**Kans:** tanden poetsen, schoenen aan en tas inpakken zijn elke dag dezelfde vraag van de ouders.
**Voorstel:** taken krijgen een moment (ochtend, middag, avond). Het kindstartscherm groepeert ze met een zon, een zon in de lucht en een maan, en toont "nu" groter. Voor Feline een prentje en een voorleesknop per stap. Een ouder zet de routine in Taken van de kinderen met een sjabloon "Ochtend" met drie standaardtaken.
**Omvang:** klein tot middel. Nieuw veld `moment` bij taken (migratie). Nieuwtje nodig.

## 3. "Ik deed iets extra's"
**Voor:** kind (Luca en Yuna)
**Kans:** een kind dat uit zichzelf helpt, bijvoorbeeld de tafel dekken of Maxim helpen, kan dat nergens melden.
**Voorstel:** een knop "Ik deed iets extra's" met een kort prentjeskeuzelijstje (tafel, afwas, opruimen, helpen) en eventueel een foto. Het komt bij Goedkeuren als vrije taak; de ouder bepaalt zelf het aantal sterren of tikt Afkeuren zonder gevolg. Past binnen de regel dat sterren pas na goedkeuring komen.
**Omvang:** klein. Hergebruikt het inzendingen-pad; kleine migratie voor een vrije taak. Nieuwtje nodig.

## 4. Weekoverzicht op zondagavond
**Voor:** ouder (gsm)
**Kans:** het staat sinds de spec als fase 2 (weekoverzicht) maar bestaat niet: ouders zien enkel vandaag.
**Voorstel:** een pagina Wij → Week (en een push op zondag 19:00) met per kind: taken gedaan van de totaal, sterren verdiend en besteed, extra tijd toegekend en een regel over wat het kind het meest speelde. Plus wat de week vooruit staat (weekmenu en Onze taken). Alleen lezen.
**Omvang:** middel. Geen migratie nodig, wel een plan voor het meldingsmoment. Nieuwtje nodig.

## 5. Zachte herinneringen
**Voor:** ouder (gsm)
**Kans:** goedkeuringen blijven uren liggen en Onze taken met een tijdstip komen niet naar boven, terwijl kinderen wachten.
**Voorstel:** een push als iets langer dan twee uur wacht (eenmalig, binnen 7:00–20:00) en een instelbare herinnering per Onze taak ("om 17:00 herinneren"). Instelbaar in Toestellen en meldingen, standaard uit.
**Omvang:** klein tot middel. Server-cron en kleine migratie voor het tijdstip. Nieuwtje nodig.

## 6. Gezinsagenda met "Wat doen we vandaag?"
**Voor:** ouders (beheren) en kinderen (zien)
**Kans:** schooluitstappen, verjaardagen, zwemmen of "oma komt" staan nu in notities of in het hoofd. Kinderen vragen dagelijks wat er gebeurt.
**Voorstel:** Wij → Agenda met afspraken per dag (titel, uur, wie meegaat, prentje uit een vaste set). Op het kindstartscherm een strook "Vandaag" met prentjes en voorleesknop, net als het weekmenu. Verjaardagen uit de kindgegevens komen er vanzelf in, met een aftelling in dagen. Maxim kan als "gezin" meegaan zonder account.
**Omvang:** groot. Nieuwe tabel met RLS, ouderscherm en kindstrook. Nieuwtje nodig.
