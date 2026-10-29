import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { lichtjesNiveaus, lichtjesRondes, startLichtjesNiveau, type LichtjesNiveau, type LichtKleur } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { huidigeReeks, isKlaar, nieuwSpel, tik, type LichtjesSpel } from '../lib/spelletjes/lichtjes.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './lichtjes.css'

const kleurNaam: Record<LichtKleur, string> = { rood: 'Rood', geel: 'Geel', blauw: 'Blauw', groen: 'Groen' }
const kleurCode: Record<LichtKleur, string> = { rood: '#E04A3A', geel: '#F2C32E', blauw: '#3C7BE0', groen: '#3DAA55' }
const toonHoogte: Record<LichtKleur, number> = { rood: 392, geel: 523, blauw: 659, groen: 784 }
/** Plek van elk lichtje op de boom, in procenten van de boom. */
const plek: Record<LichtKleur, { x: number; y: number }> = {
  geel: { x: 50, y: 28 }, rood: { x: 28, y: 58 }, blauw: { x: 72, y: 58 }, groen: { x: 50, y: 84 },
}

/** De kerstboom: drie groene lagen, een ster en een bruine stam. */
function BoomPrent() {
  return (
    <svg className="licht-boom" viewBox="0 0 200 240" aria-hidden="true">
      <rect x={86} y={198} width={28} height={36} rx={4} fill="#8A5A33" />
      <path d="M100 70L170 140H30Z" fill="#2E7D3E" /><path d="M100 36L160 100H40Z" fill="#3A9150" /><path d="M100 120L186 206H14Z" fill="#26692F" />
      <path d="M100 4L106 20L123 20L109 30L115 46L100 36L85 46L91 30L77 20L94 20Z" fill="#F2B33D" stroke="#C48A12" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

export default function Lichtjes() {
  return (
    <SpelKader titel="Lichtjesboom" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <LichtjesScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'kijken' | 'jij' | 'rondeaf'

function LichtjesScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<LichtjesNiveau>(() =>
    gekozenNiveau(kind.id, 'lichtjes', startLichtjesNiveau(kind, kinderen), Object.keys(lichtjesNiveaus)))
  const [spel, setSpel] = useState<LichtjesSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('kijken')
  const [aan, setAan] = useState<LichtKleur | null>(null)
  const [wip, setWip] = useState(0)
  // Telt elk nieuw spel, zodat de lichtjes ook opnieuw aangaan als de fase al 'kijken' was.
  const [nummer, setNummer] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)

  function wis() { timers.current.forEach(clearTimeout); timers.current = [] }
  function later(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.lichtjesUitleg) }, [lezer])
  useEffect(() => wis, [])
  // Bij elke nieuwe ronde (en na een foutje) gaan de lichtjes één voor één aan.
  useEffect(() => {
    if (af || fase !== 'kijken') return
    const reeks = huidigeReeks(spel)
    wis()
    reeks.forEach((k, i) => {
      later(700 + i * 900, () => { setAan(k); geluid.toon(toonHoogte[k]) })
      later(700 + i * 900 + 600, () => setAan(null))
    })
    later(700 + reeks.length * 900, () => { setFase('jij'); if (!lezer) leesVoor(zin.lichtjesNa) })
    return wis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, spel.ronde, spel.misser, af, nummer])

  function opnieuw(nv: LichtjesNiveau = niveau) {
    wis(); setAan(null); setSpel(nieuwSpel(nv)); setBegin(Date.now()); setFase('kijken'); setNummer((n) => n + 1)
  }
  function kiesNiveau(nv: LichtjesNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'lichtjes', nv); opnieuw(nv) }
  function tikLicht(k: LichtKleur) {
    if (fase !== 'jij') return
    const { spel: na, zet } = tik(spel, k)
    setSpel(na)
    if (zet === 'fout') {
      geluid.oei(); setWip((n) => n + 1); setFase('kijken')
      if (!lezer) leesVoor(zin.lichtjesFout)
      return
    }
    setAan(k); geluid.toon(toonHoogte[k]); later(350, () => setAan(null))
    if (zet === 'rondeaf') { setFase('rondeaf'); later(1100, () => setFase('kijken')) }
    if (zet === 'klaar') {
      later(600, () => {
        geluid.hoera()
        if (!lezer) later(400, () => leesVoor(zin.lichtjesKlaar))
      })
      // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
      void bron?.activiteitOpslaan(kind.id, 'lichtjes', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
    }
  }

  return (
    <div className="lichtjes">
      <Chips label="Niveau" opties={lichtjesNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="licht-teller" aria-label={`Ronde ${Math.min(spel.ronde + 1, lichtjesRondes)} van ${lichtjesRondes}`}>
        {Array.from({ length: lichtjesRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
      </div>
      <div className={`licht-veld${af ? ' feest' : ''}${fase === 'rondeaf' ? ' blij' : ''}`} key={wip}>
        <BoomPrent />
        {spel.kleuren.map((k) => (
          <button key={k} type="button" aria-label={kleurNaam[k]} disabled={fase !== 'jij' || af}
                  className={`licht-lamp${aan === k || af ? ' aan' : ''}${fase === 'jij' && !af ? ' tik' : ''}`}
                  style={{ left: `${plek[k].x}%`, top: `${plek[k].y}%`, ['--lk' as string]: kleurCode[k] }}
                  onClick={() => tikLicht(k)} />
        ))}
      </div>
      {af ? (
        <div className="licht-eind">
          <div className="hoera display">{lezer ? 'De hele boom straalt!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <div className="licht-stippen" aria-hidden="true">
          {huidigeReeks(spel).map((_, i) => <i key={i} className={fase === 'jij' && i < spel.ingevoerd ? 'goed' : ''} />)}
        </div>
      )}
    </div>
  )
}
