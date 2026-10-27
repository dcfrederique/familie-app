# Resultaat bouw 27 oktober 2026

Thema: herfst, een cadeau maken (verhaal) en De wereld (gebouw bij het nieuwe spelletje).

## Gebouwd
- **Verhaal 33** "De herfstketting van Siep" (Grote ogen, 6+, 10 bladzijden), meteen beschikbaar.
- **Spelletje Herfstketting** (`src/lib/spelletjes/ketting.ts` + test, `src/schermen/Ketting.tsx`), 20 sterren, drie niveaus, 6 kettingen per ronde. Bediening door te tikken (geen slepen). Hint na 4 seconden, een verkeerde kraal kost niets. Staat in het menu Spelen en in `spel_prijzen`; niet vrijgegeven.
- **Stukken** (niet vrijgegeven): figuurtje Eikelmuts 15, Met eekhoorn 20, Paraplu 15; Mijn huis Notenboom 25, Egel 15, Herfstkrans 20. Migratie `20261027000100_eekhoornboom.sql`.
- **Springland**: Het paddenstoelenpad, vijfde en laatste level van Zonnevallei. Het robotje speelt het uit. De volgende nacht moet een nieuwe wereld beginnen.
- **De wereld**: Eekhoornboom op (47,2; 11,6) tegels, `spel: 'ketting'`, gouden rand tot 10 november, slot tot aankoop. De reachability- en deurmattests blijven groen.
- Nieuwtje 0.39 en `docs/wereld.md` bijgewerkt.

## Controles
Lint, 286 tests, build en `scripts/test-db.sh` zijn groen. Browsercheck in de demo: Herfstketting speelbaar tot het einde zonder scrollen op 1194 × 834; tekeningen van de stukken en het gebouw bekeken.

## Open
- Het ontwerp van vannacht was door een API-fout niet gemaakt; het plan is door de bouw zelf geschreven.
- Niet op een echte tablet bekeken. Voorleesopnames voor het verhaal en de nieuwe zinnen ontbreken nog.
- Het gebouw in de wereld is in de demo niet zichtbaar zolang het spel niet vrijgegeven is (zo hoort het).
