# Mijn verlanglijstje (plan, 15 november 2026, nog niet gebouwd)

Idee van de nachtelijke verbeterideeën (14 november, nr. 1); Frederique vond het de moeite om uit te werken. Sinterklaas is op 6 december, Kerstmis volgt. Dit document is het plan; er is nog niets gebouwd.

## Wat het is
Elk kind heeft op Ik een bladzijde **Mijn verlanglijstje**. Het kiest daar prentjes (of tekent of typt) van wat het graag zou krijgen. De ouders zien de lijsten op hun gsm en vinken af wat al gekocht is. Het kind ziet dat afvinken nooit. Geen sterren, geen winkel, geen prijzen.

## Regels
- Maximaal 10 wensen per kind (genoeg voor Sint én Kerstmis; een ouder kan de grens later aanpassen).
- Een wens is een **prentje** uit een vaste set, een **tekening** (zoals Zelf tekenen, lijnen in een vlak van 600 × 260) of, voor kinderen die lezen, een **korte tekst** (tot 40 tekens).
- Feline (4) tikt prentjes en hoort ze voorgelezen; zonder lezen kan ze alles. Yuna (6) en Luca (8) kunnen daarnaast tekenen en typen.
- Eén tik op het hartje maakt een wens "allerliefste" (maximaal 3, met een gouden rand).
- Het kind kan zelf een wens weghalen. De ouders wijzigen de wens niet; ze zetten enkel een **status** die alleen zij zien: nieuw, gekocht, later of liever niet.
- Het kind weet dat mama en papa meelezen: bovenaan staat een zinnetje met voorleesknop ("Mama en papa lezen mee").
- Geen foto's, geen links, geen prijzen, geen winkelnamen: niets verlaat de app. Maxim heeft geen lijst.
- Standaard **uit**; een ouder zet het per kind aan (Kinderen → Verlanglijstjes), zoals het Dagboek en het Huisdier. Geen sterren in het spel, dus geen gevolgen voor saldo of dagplafond.

## Schermen
1. **Kind: Mijn verlanglijstje** (`/kind/:id/verlanglijstje`, `src/schermen/Verlanglijst.tsx`, tegel op Ik in `KindHubs.tsx`, `<KindBalk>` onderaan). Raster van de wensen met een groot plusvak. Past op tablet liggend en staand en op een lage gsm liggend zonder scrollen (`Bladzijden` met `maat` bij veel wensen).
2. **Kind: wens toevoegen**: drie grote tegels (Prentje, Tekenen, Typen; zonder lezen enkel Prentje en Tekenen met prentjes). Prentjeskeuze: een set van ongeveer 24 eigen lijnprentjes in `src/data/verlanglijst.ts` (bal, pop, knuffel, trein, blokken, puzzel, boek, fiets, step, verkleedkleren, tekenspullen, bouwdoos, muziekdoosje, autootjes, dino, spel, enz.; geen merken of personages).
3. **Ouder: Kinderen → Verlanglijstjes** (gsm, `src/data/ouderMenu.ts`, `alleenOuderGsm`): per kind de wensen met het gouden hartje voor de allerliefste, een tik zet de status. Bovenaan een aan/uit per kind. Een teller "nieuw" in het menu voor wensen die nog niemand bekeek.

## Data en server
- Tabel `verlanglijst`: `id`, `gezin_id`, `kind_id`, `soort` (`prent` | `tekening` | `tekst`), `prent` (sleutel), `tekst`, `tekening` (jsonb), `favoriet`, `status` (nieuw | gekocht | later | liever_niet), `aangemaakt`. Instelling `verlanglijst_aan` per kind, naast `dagboek_aan`.
- Maximum van 10 en het maximum van 3 favorieten **op de server**, net als de andere spelregels. RLS volgt de migratie van het Dagboek: een kind leest en schrijft enkel zijn eigen rijen, een ouder leest alle rijen van het gezin en zet enkel `status`.
- `src/lib/bron/`: `verlanglijst(kindId)`, `verlanglijstToevoegen`, `verlanglijstVerwijderen`, `verlanglijstFavoriet`, `verlanglijstStatus` (ouder), `verlanglijstInstellen` (ouder), in `supabaseBron` én `demoBron`. De nieuwe kindschermen met schrijfacties komen in `GEBLOKKEERD` van `src/lib/proef.tsx`, zodat Spelletjes proberen niets bewaart.

## Tests en afwerking
- `src/lib/verlanglijst.test.ts`: maximum van 10, maximum van 3 favorieten, tekstlengte, ouder wijzigt enkel de status, kind ziet de status nooit.
- Een flow in `e2e/werking.spec.ts` (wens kiezen, ouder vinkt af) en het nieuwe scherm in `SCHERMEN` van `scripts/schermmeting.cjs` (tablet liggend en staand, lage gsm liggend, licht en donker).
- Nieuwtje met het volgende versienummer bovenaan `src/data/nieuwtjes.ts` (0.168 of hoger), in dezelfde push.

## Omvang
Middel: één migratie, twee schermen, een prentjesset en een testset; één bouwronde.

## Open vragen voor Frederique
1. Standaard uit (voorstel) of meteen aan voor alle drie?
2. Maximaal 10 wensen goed, of liever meer of minder?
3. Mogen Yuna en Luca ook zelf typen (en dus dingen schrijven die we niet bedacht hebben), of enkel prentjes en tekenen?
4. Moet het afvinken achter de pincode, of volstaat het ouder-account op de gsm? (Voorstel: ouder-account volstaat, het raakt geen sterren of tijd.)
5. Een ouder kan later een lijstje delen met opa en oma als tekst? (Voorstel: niet nu.)
