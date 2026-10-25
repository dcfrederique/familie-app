// Vaste zinnen die de app voorleest aan wie (nog) niet leest. scripts/maak-stem.ts spreekt ze vooraf in met
// de Vlaamse stemmen; leesVoor() speelt dan de opname. Teksten met een naam of taaktitel blijven op de tabletstem.
import { huisdieren, versieringen } from './huisdieren.ts'
import { ingredienten, recepten } from './recepten.ts'

export const zin = {
  basketHint: 'Veeg van de bal naar de ring en laat los. Hoe langer de veeg, hoe harder!',
  racenUitleg: 'Tik naast je auto om opzij te gaan. Pak de sterretjes!',
  touwUitleg: 'Tik op het scherm om te springen als het touw onderaan is!',
  kleerkast: 'Kies je kleren. Tik op het vinkje als je klaar bent.',
  sparen: 'Nog even sterren sparen!',
  kopenVraag: 'Wil je dit kopen met je sterren? Tik op het vinkje.',
  gekocht: 'Hoera! Dat is nu van jou.',
  huisBouwen: 'Maak je huis mooi! Tik op het vinkje als je klaar bent.',
  huisGegroeid: 'Hoera! Je huis is gegroeid!',
  kokenKiezen: 'Wat ga je koken?',
  kokenZoeken: 'Zoek wat er op het kaartje staat.',
  kokenRoeren: 'Roer maar goed rond!',
  welkDier: 'Welk diertje ga je wassen?',
  puzzelKiezen: 'Welke prent wil je puzzelen?',
  puzzelUitleg: 'Sleep de stukjes naar hun plekje!',
  puzzelKlaar: 'Goed gedaan! De puzzel is af.',
  pompoenUitleg: 'Maak de pompoen zoals op het kaartje. Tik dan op het lichtje!',
  pompoenKlaar: 'Mooi! De pompoen straalt.',
  wieBenJij: 'Wie ben jij? Tik op je naam.',
  welkomFiguur: 'Maak je eigen figuurtje! Kies je haar en je kleren.',
  welkomJarig: 'Wanneer ben je jarig?',
  welkomThema: 'Kies je kleur. Zo ziet jouw app eruit.',
  hoeraDag: 'Hoera! Een nieuwe dag!',
  hoeraNieuwSpel: 'Er is een nieuw spelletje in de winkel.',
  hoeraCadeau: 'En kijk, een cadeautje voor jou!',
  welkomFeest: 'Hoera! Je hebt je eerste tien sterren!',
}

/** Wat Huisdier wassen zegt bij elke stap. */
export const wasZeg = {
  schrobben: 'Schrob de modder weg met de spons!',
  spoelen: 'Spoel het schuim eraf met de douche!',
  drogen: 'Droog je diertje af met de handdoek!',
  versieren: 'Kies iets moois voor je diertje!',
}

export const dierProper = (naam: string) => `Hoera! ${naam} is helemaal proper!`

/** Alle zinnen om in te spreken. */
export const vasteZinnen: string[] = [...new Set([
  ...Object.values(zin),
  ...Object.values(wasZeg),
  ...Object.values(huisdieren).flatMap((d) => [d.naam, dierProper(d.naam)]),
  ...Object.values(versieringen).map((v) => v.naam),
  ...Object.values(recepten).flatMap((r) => [r.naam, r.zeg]),
  ...Object.values(ingredienten).map((i) => i.naam),
  // Touwspringen telt hardop tot 20.
  ...Array.from({ length: 20 }, (_, i) => String(i + 1)),
])]
