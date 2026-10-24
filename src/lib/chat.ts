// Hulp voor de chat (docs/chat.md): tijdstippen en het groeperen van berichten per dag.
import type { Bericht } from './bron/types.ts'

export const uurVan = (iso: string) => new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })

/** 'Vandaag', 'Gisteren' of '24 oktober'. */
export function dagKop(iso: string, nu = new Date()): string {
  const d = new Date(iso)
  const dagen = Math.round((new Date(nu.getFullYear(), nu.getMonth(), nu.getDate()).getTime()
    - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400_000)
  if (dagen === 0) return 'Vandaag'
  if (dagen === 1) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
}

/** Berichten (oudste eerst) in blokken per dag, elk met een kop. */
export function perDag(berichten: Bericht[], nu = new Date()): { kop: string; berichten: Bericht[] }[] {
  const blokken: { kop: string; berichten: Bericht[] }[] = []
  for (const b of berichten) {
    const kop = dagKop(b.aangemaakt_op, nu)
    const laatste = blokken[blokken.length - 1]
    if (laatste?.kop === kop) laatste.berichten.push(b)
    else blokken.push({ kop, berichten: [b] })
  }
  return blokken
}

/** Korte weergave voor een overzicht: de tekst, of bij een lege tekst een streepje. */
export const voorbeeld = (tekst: string | null | undefined) => (tekst ?? '').replace(/\s+/g, ' ').slice(0, 60)
