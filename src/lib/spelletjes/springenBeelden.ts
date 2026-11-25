import type { SpringLevelInfo, SpringStijl } from '../../data/springen.ts'

const urls = import.meta.glob<string>('../../assets/springland/**/*.webp', { eager: true, import: 'default' })
const wortel = '../../assets/springland/'
const tandwiel = 'tandwielpad/'

const terreinen: Record<SpringStijl, string> = {
  weide: 'gras', bos: 'bos', wolken: 'wolk', strand: 'zand', sneeuw: 'sneeuw',
}

const levelAchtergronden: Record<string, string> = {
  bos: 'weidebos',
  wolken: 'zonnelucht',
  herfstbos: 'herfstbos',
  paddenstoelenpad: 'paddenstoelenbos',
  pompoenbaas: 'herfstbos',
  wolkenpad: 'zonnelucht',
  onweerswolkjes: 'onweerswolkjes',
  regenboogeiland: 'regenboogeiland',
  sterrenpad: 'sterrenpad',
  bromwolk: 'bromwolk',
}

const wereldTerreinen: Record<string, string> = {
  speelgoedland: 'speelgoed',
  dakenstad: 'dak',
  speeldoos: 'muziek',
}

const wereldPoorten: Record<string, string> = {
  pepernotenland: 'speelgoed',
  winterbergen: 'sneeuw',
  wolkenrijk: 'wolk',
  speelgoedland: 'speelgoed',
  dakenstad: 'speelgoed',
  speeldoos: 'speelgoed',
}

export function springBeeldUrls(level: SpringLevelInfo) {
  if (level.id === 'tandwielpad') {
    return {
      achtergrond: urls[wortel + tandwiel + 'achtergrond.webp'],
      oppervlak: urls[wortel + tandwiel + 'gras.webp'],
      ondergrond: urls[wortel + tandwiel + 'steen.webp'],
      veer: urls[wortel + tandwiel + 'veer.webp'],
      poort: urls[wortel + tandwiel + 'poort.webp'],
    }
  }
  const achtergrond = levelAchtergronden[level.id] ?? level.wereld
  const terrein = wereldTerreinen[level.wereld] ?? terreinen[level.stijl]
  const poort = level.stijl === 'wolken' && level.wereld === 'zonnevallei' ? 'wolk'
    : wereldPoorten[level.wereld] ?? 'steen'
  const tegelUrl = urls[wortel + 'terrein/' + terrein + '.webp']
  return {
    achtergrond: urls[wortel + 'achtergrond/' + achtergrond + '.webp'],
    oppervlak: tegelUrl,
    ondergrond: tegelUrl,
    veer: level.wereld === 'speeldoos' || level.wereld === 'speelgoedland'
      ? urls[wortel + tandwiel + 'veer.webp'] : undefined,
    poort: urls[wortel + 'poort/' + poort + '.webp'],
  }
}

export const springSpriteNamen = [
  'ster', 'appel', 'aardbei', 'kers', 'egel', 'egelrol', 'slak', 'vogel',
  'checkpoint', 'checkpoint-actief', 'springpaddenstoel', 'water',
  'bal', 'pakje', 'druppel', 'baashekje',
] as const

export function springSpriteUrl(naam: typeof springSpriteNamen[number]) {
  return urls[wortel + 'sprites/' + naam + '.webp']
}
