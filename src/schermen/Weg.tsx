import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startWegNiveau, voorwerpen, wegNiveaus, wegRondes, type Voorwerp, type WegNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { huidige, isKlaar, kies, nieuwSpel, overgebleven, type WegSpel } from '../lib/spelletjes/weg.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './weg.css'

const naam: Record<Voorwerp, string> = {
  pakje: 'Pakje', schoen: 'Schoen', wortel: 'Wortel', pepernoot: 'Pepernoot', mijter: 'Mijter', ster: 'Ster', kaars: 'Kaars', sok: 'Sok',
}

/** Eigen tekeningen (vlakke vormen) van de voorwerpen, in een kader van 100 × 100. */
export function VoorwerpTekening({ soort }: { soort: Voorwerp }) {
  return (
    <svg className="weg-tekening" viewBox="0 0 100 100" aria-hidden="true">
      {soort === 'pakje' && (
        <>
          <rect x={16} y={34} width={68} height={52} rx={6} fill="#D8452B" /><rect x={44} y={34} width={12} height={52} fill="#F2C14E" />
          <rect x={16} y={52} width={68} height={12} fill="#F2C14E" />
          <path d="M50 34Q34 12 28 26Q30 36 50 34ZM50 34Q66 12 72 26Q70 36 50 34Z" fill="#F2C14E" />
        </>
      )}
      {soort === 'schoen' && (
        <>
          <path d="M30 12H58V56Q80 58 90 70Q94 78 86 84H20Q14 84 14 78V26Q14 12 30 12Z" fill="#2D6BD6" />
          <rect x={14} y={12} width={44} height={11} rx={5} fill="#fff" opacity={0.9} /><rect x={10} y={80} width={84} height={10} rx={5} fill="#2B2B2B" />
        </>
      )}
      {soort === 'wortel' && (
        <>
          <path d="M62 24L80 80Q82 88 76 84L26 50Q18 44 28 40Z" fill="#F2994A" transform="rotate(-20 50 50)" />
          <path d="M26 30Q18 14 30 12Q34 22 32 32ZM34 36Q30 18 44 18Q46 28 40 38Z" fill="#4F8A3C" />
          <path d="M44 56L58 62M52 70L62 74" stroke="#C86F1C" strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {soort === 'pepernoot' && (
        <>
          <circle cx={34} cy={62} r={20} fill="#A8693A" /><circle cx={64} cy={56} r={22} fill="#C08246" /><circle cx={50} cy={38} r={18} fill="#8A5A33" />
          <circle cx={58} cy={48} r={4} fill="#fff" opacity={0.35} />
        </>
      )}
      {soort === 'mijter' && (
        <>
          <path d="M50 8Q80 30 78 84H22Q20 30 50 8Z" fill="#E8C14A" /><rect x={22} y={76} width={56} height={12} rx={4} fill="#D8452B" />
          <path d="M50 24V68M38 44H62" stroke="#D8452B" strokeWidth={8} strokeLinecap="round" />
        </>
      )}
      {soort === 'ster' && <path d="M50 8L61 38L92 38L67 57L77 88L50 69L23 88L33 57L8 38L39 38Z" fill="#F2B33D" stroke="#C48A12" strokeWidth={4} strokeLinejoin="round" />}
      {soort === 'kaars' && (
        <>
          <rect x={34} y={38} width={32} height={50} rx={5} fill="#F5EBD5" /><rect x={34} y={38} width={32} height={9} fill="#D8452B" />
          <path d="M50 8Q64 22 58 34Q50 38 42 34Q36 22 50 8Z" fill="#F2994A" /><path d="M50 18Q56 26 52 32Q46 32 46 28Q46 22 50 18Z" fill="#F2D24E" />
        </>
      )}
      {soort === 'sok' && (
        <>
          <path d="M34 10H62V50L88 66Q94 74 86 82Q76 88 62 80L34 62Z" fill="#D8452B" />
          <rect x={34} y={10} width={28} height={14} fill="#fff" opacity={0.92} />
          <path d="M34 36H62M34 46H62" stroke="#fff" strokeWidth={5} opacity={0.7} />
        </>
      )}
    </svg>
  )
}

export default function Weg() {
  return (
    <SpelKader titel="Wat is er weg?" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <WegScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'kijken' | 'doek' | 'kiezen' | 'goed'

function WegScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<WegNiveau>(() => gekozenNiveau(kind.id, 'weg', startWegNiveau(kind, kinderen), Object.keys(wegNiveaus)))
  const [spel, setSpel] = useState<WegSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('kijken')
  const [fout, setFout] = useState<Voorwerp | null>(null)
  const [tip, setTip] = useState(false)
  // Telt elk nieuw spel, zodat het kijken ook opnieuw begint als de fase al 'kijken' was.
  const [nummer, setNummer] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const ronde = huidige(spel)
  const af = isKlaar(spel)

  useEffect(() => { if (!lezer) leesVoor(zin.wegUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Kijken duurt even, dan gaat de doek erover en verdwijnt er één.
  useEffect(() => {
    if (af || fase !== 'kijken') return
    timer.current = setTimeout(() => setFase('doek'), wegNiveaus[niveau].kijktijd)
    return () => clearTimeout(timer.current)
  }, [fase, spel.ronde, niveau, af, nummer])
  useEffect(() => {
    if (fase !== 'doek') return
    timer.current = setTimeout(() => { setFase('kiezen'); if (!lezer) leesVoor(zin.wegWeg) }, 1300)
    return () => clearTimeout(timer.current)
  }, [fase, lezer])
  useEffect(() => {
    setTip(false)
    if (fase !== 'kiezen') return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [fase, fout, spel.ronde])

  function opnieuw(nv: WegNiveau = niveau) {
    clearTimeout(timer.current)
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setFase('kijken'); setFout(null); setNummer((n) => n + 1)
  }
  function kiesNiveau(nv: WegNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'weg', nv); opnieuw(nv) }
  function tikKeuze(v: Voorwerp) {
    if (fase !== 'kiezen') return
    const { spel: na, zet } = kies(spel, v)
    if (zet === 'fout') {
      setSpel(na); setFout(v); geluid.oei()
      if (!lezer) leesVoor(zin.wegFout)
      return
    }
    setFout(null); setFase('goed'); geluid.paar()
    timer.current = setTimeout(() => {
      setSpel(na); setFase('kijken')
      if (isKlaar(na)) {
        geluid.hoera()
        if (!lezer) setTimeout(() => leesVoor(zin.wegKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'weg', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1100)
  }

  return (
    <div className="weg">
      <Chips label="Niveau" opties={wegNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="weg-eind">
          <div className="weg-tafel eind">{voorwerpen.slice(0, 6).map((v) => <span key={v} className="weg-stuk"><VoorwerpTekening soort={v} /></span>)}</div>
          <div className="hoera display">{lezer ? 'Goed gekeken!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : ronde && (
        <>
          <div className="weg-teller" aria-label={`Ronde ${spel.ronde + 1} van ${wegRondes}`}>
            {Array.from({ length: wegRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
          </div>
          <div className="weg-tafel" role="group" aria-label="Op tafel" style={{ '--n': ronde.getoond.length } as CSSProperties}>
            {(fase === 'kijken' || fase === 'doek' || fase === 'goed' ? ronde.getoond : overgebleven(ronde)).map((v) => (
              <span key={v} className={`weg-stuk${fase === 'goed' && v === ronde.weg ? ' terug' : ''}`}><VoorwerpTekening soort={v} /></span>
            ))}
            {fase === 'kiezen' && <span className="weg-stuk leeg" aria-hidden="true">?</span>}
            {fase === 'doek' && <div className="weg-doek" aria-hidden="true" />}
          </div>
          {fase === 'kijken' ? (
            <div className="weg-balk" aria-hidden="true"><i key={`${spel.ronde}-${niveau}`} style={{ animationDuration: `${wegNiveaus[niveau].kijktijd}ms` }} /></div>
          ) : <div className="weg-balk leeg" aria-hidden="true" />}
          <div className={`weg-keuzes${fase === 'kiezen' ? '' : ' weg-verstopt'}${tip ? ' tip' : ''}`} role="group" aria-label="Wat is er weg?"
               style={{ '--n': ronde.getoond.length } as CSSProperties}>
            {ronde.getoond.map((v) => (
              <button key={v} type="button" className={`weg-keuze${fout === v ? ' fout' : ''}`} aria-label={naam[v]} onClick={() => tikKeuze(v)}
                      tabIndex={fase === 'kiezen' ? 0 : -1}>
                <VoorwerpTekening soort={v} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
