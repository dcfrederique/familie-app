// Meelezen bij "Ik lees zelf" (docs/azure-extra.md, stap 2): vergelijkt wat de spraakherkenning hoorde met de
// woorden van de bladzijde. Bewust vergevingsgezind: geen hoofdletters of leestekens, getallen als woord, een
// lettertje verschil mag, en een kind dat een zin opnieuw begint verliest niets.

const eenheden = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien']
const tientallen = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig']

/** Een getal van 0 tot 100 als Nederlands woord ("21" wordt "eenentwintig"); groter blijft cijfers. */
export function getalAlsWoord(getal: number): string {
  if (getal < 20) return eenheden[getal]
  if (getal === 100) return 'honderd'
  if (getal > 100) return String(getal)
  const tien = tientallen[Math.floor(getal / 10)], een = getal % 10
  if (een === 0) return tien
  // tweeëntwintig: zonder trema, want normaal() haalt accenten toch weg
  return `${eenheden[een]}en${tien}`
}

/** Eén woord zoals we het vergelijken: kleine letters, zonder accenten, leestekens en apostrofs. */
export function normaal(woord: string): string {
  const kaal = woord.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  return /^\d+$/.test(kaal) ? getalAlsWoord(Number(kaal)) : kaal
}

/** Afstand van Levenshtein, met een plafond: verder rekenen dan nodig heeft geen zin. */
function afstand(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let vorige = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const rij = [i]
    for (let j = 1; j <= b.length; j++) {
      rij[j] = Math.min(vorige[j] + 1, rij[j - 1] + 1, vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    vorige = rij
  }
  return vorige[b.length]
}

/** Klinkt het gehoorde woord als het woord uit de tekst? Korte woorden moeten juist zijn, langere mogen wat afwijken. */
export function lijkt(gehoord: string, doel: string): boolean {
  if (gehoord === doel) return true
  const speling = doel.length >= 8 ? 2 : doel.length >= 4 ? 1 : 0
  return speling > 0 && afstand(gehoord, doel, speling) <= speling
}

export interface Meegelezen {
  /** Per woord van de bladzijde: goed gelezen. Woorden zonder letters (een losse "-") tellen altijd als goed. */
  goed: boolean[]
  /** Het eerste woord dat het kind nog moet lezen. */
  positie: number
  /** Aantal echte woorden en hoeveel daarvan goed. */
  woorden: number
  aantalGoed: number
}

/** Hoe ver de app vooruit en achteruit kijkt als een gehoord woord niet het volgende is. */
const VOORUIT = 3
const ACHTERUIT = 6

/**
 * Vergelijkt de woorden van een bladzijde (zoals ze op het scherm staan, gesplitst op spaties) met alles wat er
 * op die bladzijde gehoord is. Wordt telkens opnieuw van voor af berekend, want de spraakherkenning past haar
 * voorlopige tekst nog aan.
 */
export function meelezen(woorden: string[], gehoord: string): Meegelezen {
  const doel = woorden.map(normaal)
  const goed = doel.map((d) => d === '')
  const h = gehoord.split(/\s+/).map(normaal).filter(Boolean)
  let positie = 0
  const schuifDoor = () => { while (positie < doel.length && goed[positie]) positie++ }
  schuifDoor()

  for (let i = 0; i < h.length; i++) {
    let gevonden = false
    // Vooruit: het volgende woord, of een paar verder als het kind een woordje oversloeg.
    for (let j = positie; j < Math.min(doel.length, positie + VOORUIT + 1) && !gevonden; j++) {
      if (goed[j]) continue
      // Een samengesteld woord komt soms in twee stukken binnen ("zonnebloem pit").
      const samen = i + 1 < h.length && lijkt(h[i] + h[i + 1], doel[j]) && !lijkt(h[i], doel[j])
      if (samen || lijkt(h[i], doel[j])) {
        goed[j] = true
        positie = j + 1
        if (samen) i++
        gevonden = true
      }
    }
    // Achteruit: een woord dat eerst niet lukte en nu (bij het opnieuw lezen) wel.
    for (let j = positie - 1; j >= Math.max(0, positie - ACHTERUIT) && !gevonden; j--) {
      if (!goed[j] && lijkt(h[i], doel[j])) { goed[j] = true; gevonden = true }
    }
    schuifDoor()
  }

  const echt = doel.map((d) => d !== '')
  return {
    goed,
    positie,
    woorden: echt.filter(Boolean).length,
    aantalGoed: goed.filter((g, i) => g && echt[i]).length,
  }
}
