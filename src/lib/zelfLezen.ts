// "Ik lees zelf" in de lezer: token halen, meeluisteren, elke minuut het gebruik melden (zo houdt de server
// het plafond per dag bij) en stoppen als de leestijd van vandaag op is.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bron } from './bron/types.ts'
import { startMeeluisteren, type Luisteraar } from './meeluisteren.ts'

export type ZelfStand = 'uit' | 'starten' | 'luistert' | 'op' | { fout: string }

function vriendelijk(fout: unknown): string {
  const m = fout instanceof Error ? fout.message : String(fout)
  if (/permission|notallowed|denied/i.test(m)) return 'Ik mag de microfoon niet gebruiken. Vraag aan mama of papa om dat toe te laten.'
  if (/demo/i.test(m)) return 'Zelf lezen werkt niet in de demo.'
  return 'Meeluisteren lukt nu niet. Lees gewoon verder, of probeer het straks nog eens.'
}

export function useZelfLezen(kindId: string, bron: Bron | null, woorden: string[]) {
  const [stand, setStand] = useState<ZelfStand>('uit')
  const [gehoord, setGehoord] = useState('')
  const luisteraar = useRef<Luisteraar | null>(null)
  const actief = useRef(false)
  const sinds = useRef(0)
  const opKlok = useRef(0)
  const huidigeWoorden = useRef(woorden)
  huidigeWoorden.current = woorden
  const tekst = woorden.join(' ')

  /** Seconden sinds de vorige melding, en de klok opnieuw op nul. */
  const gebruikt = () => {
    const nu = Date.now(), s = sinds.current ? (nu - sinds.current) / 1000 : 0
    sinds.current = nu
    return s
  }

  const stoppen = useCallback(() => {
    actief.current = false
    clearTimeout(opKlok.current)
    luisteraar.current?.stop()
    luisteraar.current = null
    if (sinds.current && bron) void bron.spraakToken(kindId, gebruikt()).catch(() => {})
    sinds.current = 0
  }, [bron, kindId])

  const planEinde = useCallback((resterend: number) => {
    clearTimeout(opKlok.current)
    opKlok.current = window.setTimeout(() => { stoppen(); setStand('op') }, resterend * 1000)
  }, [stoppen])

  async function start() {
    if (!bron || actief.current) return
    actief.current = true
    setStand('starten')
    try {
      const t = await bron.spraakToken(kindId, 0)
      if (!('token' in t)) { actief.current = false; setStand('op'); return }
      const l = await startMeeluisteren(t.token, t.regio, huidigeWoorden.current, setGehoord,
        (melding) => { stoppen(); setStand({ fout: vriendelijk(melding) }) })
      if (!actief.current) { l.stop(); return }
      luisteraar.current = l
      sinds.current = Date.now()
      planEinde(t.resterend)
      setGehoord('')
      setStand('luistert')
    } catch (e) {
      actief.current = false
      setStand({ fout: vriendelijk(e) })
    }
  }

  // Nieuwe bladzijde: opnieuw beginnen met luisteren.
  useEffect(() => {
    setGehoord('')
    luisteraar.current?.nieuweBladzijde(huidigeWoorden.current)
  }, [tekst])

  // Elke minuut: gebruik melden en een verse token (de oude vervalt na 10 minuten).
  useEffect(() => {
    if (stand !== 'luistert' || !bron) return
    const klok = window.setInterval(() => {
      bron.spraakToken(kindId, gebruikt()).then((t) => {
        if ('token' in t) { luisteraar.current?.vernieuw(t.token); planEinde(t.resterend) }
        else { stoppen(); setStand('op') }
      }, () => {})
    }, 60_000)
    return () => clearInterval(klok)
  }, [stand, bron, kindId, planEinde, stoppen])

  useEffect(() => stoppen, [stoppen])

  return {
    stand,
    gehoord,
    start,
    stop: () => { stoppen(); setStand('uit') },
  }
}
