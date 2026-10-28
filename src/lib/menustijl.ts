import { useSyncExternalStore } from 'react'

// Hoe het ouderdeel zijn menu toont (Mijn profiel → Menu). Per toestel bewaard, geen server nodig.
export type Menustijl = 'klassiek' | 'snel' | 'onderbalk'

export const menustijlen: { sleutel: Menustijl; naam: string; uitleg: string }[] = [
  { sleutel: 'snel', naam: 'Snel', uitleg: 'Snelknoppen bovenaan en inklapbare groepen. Past op één scherm.' },
  { sleutel: 'klassiek', naam: 'Klassiek', uitleg: 'Eén lange lijst met alle groepen open.' },
  { sleutel: 'onderbalk', naam: 'Onderbalk', uitleg: 'Vier tabs onderaan (Vandaag, Kinderen, Gezin, Meer) met een overzicht per tab.' },
]

const SLEUTEL = 'ouder-menustijl'
const luisteraars = new Set<() => void>()

export function leesMenustijl(): Menustijl {
  try {
    const w = localStorage.getItem(SLEUTEL)
    if (w === 'klassiek' || w === 'snel' || w === 'onderbalk') return w
  } catch { /* geen opslag: standaard */ }
  return 'snel'
}

export function zetMenustijl(s: Menustijl) {
  try { localStorage.setItem(SLEUTEL, s) } catch { /* niet bewaard, wel voor nu */ }
  luisteraars.forEach((l) => l())
}

export function useMenustijl(): Menustijl {
  return useSyncExternalStore(
    (l) => { luisteraars.add(l); return () => { luisteraars.delete(l) } },
    leesMenustijl,
  )
}
