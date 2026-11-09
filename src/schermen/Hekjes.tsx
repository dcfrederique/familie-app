import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { hekNiveaus, hekSpellen, type HekNiveau } from '../data/hekjes.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { afmakers, eekhoornZet, isKlaar, nieuwSpel, plek, pluimen, spelOver, telling, volgendSpel, zet, type HekSpel } from '../lib/spelletjes/hekjes.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './hekjes.css'

const V = 100 // afstand tussen twee paaltjes in de tekening
const M = 30 // rand

/** Een ster (jouw weitje) of een eikel (van de eekhoorn), getekend rond (0, 0). */
function Teken({ s }: { s: 1 | 2 }) {
  return s === 1
    ? <path d="M0 -26L8 -8L27 -7L12 5L17 24L0 13L-17 24L-12 5L-27 -7L-8 -8Z" fill="#F2C530" stroke="#C99A12" strokeWidth="3" strokeLinejoin="round" />
    : <g><ellipse cy="6" rx="16" ry="19" fill="#B5733A" /><path d="M-19 -6Q0 -26 19 -6Q0 2 -19 -6Z" fill="#7A4A22" /><path d="M0 -18v-8" stroke="#5B3A1E" strokeWidth="4" strokeLinecap="round" /></g>
}

function Eekhoorn({ denkt }: { denkt: boolean }) {
  return (
    <svg className={`hk-eekhoorn${denkt ? ' denkt' : ''}`} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M58 70Q80 52 70 28Q64 14 52 22Q62 34 54 52Z" fill="#C0661A" />
      <ellipse cx="36" cy="54" rx="18" ry="20" fill="#D9853B" /><ellipse cx="36" cy="58" rx="10" ry="12" fill="#F6D6A8" />
      <circle cx="36" cy="28" r="15" fill="#D9853B" /><path d="M24 18L22 6L32 14ZM48 18L50 6L40 14Z" fill="#D9853B" />
      <circle cx="31" cy="27" r="2.5" fill="#1C2433" /><circle cx="41" cy="27" r="2.5" fill="#1C2433" /><circle cx="36" cy="33" r="2.2" fill="#5A3A22" />
    </svg>
  )
}

export default function Hekjes() {
  return (
    <SpelKader titel="Hekjes zetten" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <HekScherm kind={kind} />}
    </SpelKader>
  )
}

function HekScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<HekNiveau>(() =>
    gekozenNiveau(kind.id, 'hekjes', startDrieNiveau(kind, kinderen), Object.keys(hekNiveaus)))
  const [spel, setSpel] = useState<HekSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [uitslag, setUitslag] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = hekNiveaus[niveau]
  const over = spelOver(spel)

  function bewaar(na: HekSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.hekjesUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  // De eekhoorn speelt vanzelf als hij aan zet is.
  useEffect(() => {
    if (af || over || spel.aanZet !== 2) return
    timer.current = setTimeout(() => {
      const s = spelRef.current
      const r = zet(s, eekhoornZet(s))
      bewaar(r.spel)
      if (r.weitjes) geluid.oei(); else geluid.toon(330)
      if (spelOver(r.spel)) klaarMetSpel()
    }, 650)
    return () => clearTimeout(timer.current)
  }, [spel, af, over])

  function klaarMetSpel() {
    setUitslag(true)
    const [ik, hij] = telling(spelRef.current)
    if (ik > hij) geluid.hoera(); else geluid.oei()
  }
  function verder() {
    const vol = volgendSpel(spelRef.current)
    bewaar(vol); setUitslag(false)
    if (isKlaar(vol)) {
      if (!lezer) setTimeout(() => leesVoor(zin.hekjesKlaar), 400)
      const gewonnen = vol.uitslagen.filter(([a, b]) => a > b).length
      void bron?.activiteitOpslaan(kind.id, 'hekjes', { niveau, goed: gewonnen }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
    }
  }

  function opnieuw(nv: HekNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setUitslag(false)
  }
  function kiesNiveau(nv: HekNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'hekjes', nv); opnieuw(nv) }

  function druk(e: number) {
    const s = spelRef.current
    if (af || uitslag || s.aanZet !== 1 || s.hek[e]) return
    const r = zet(s, e)
    bewaar(r.spel)
    if (r.weitjes) geluid.toon(880); else geluid.toon(520)
    if (spelOver(r.spel)) klaarMetSpel()
  }

  if (af) {
    const gewonnen = spel.uitslagen.filter(([a, b]) => a > b).length
    return (
      <div className="hk">
        <Chips label="Niveau" opties={hekNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-60 -40 120 80" className="hk-eindprent" aria-hidden="true"><g transform="translate(-28 0)"><Teken s={1} /></g><g transform="translate(28 0)"><Teken s={2} /></g></svg>
          <div className="hoera display">{lezer ? `Je won ${gewonnen} van de ${hekSpellen} spelletjes!` : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={pluimen(spel)} max={hekSpellen * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const [ik, hij] = telling(spel)
  const tips = n.hint && spel.aanZet === 1 && !uitslag ? new Set(afmakers(spel)) : new Set<number>()
  const W = spel.breed * V + 2 * M, H = spel.hoog * V + 2 * M
  return (
    <div className="hk">
      <Chips label="Niveau" opties={hekNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="hk-spel">
        <div className={`hk-zij mij${spel.aanZet === 1 && !uitslag ? ' beurt' : ''}`}>
          <svg className="hk-teken" viewBox="-30 -30 60 60" aria-hidden="true"><Teken s={1} /></svg>
          {lezer && <span className="hk-naam">{kind.naam}</span>}
          <b className="hk-punten">{ik}</b>
        </div>
        <div className="hk-plek">
          <svg className="hk-bord" viewBox={`0 0 ${W} ${H}`} role="grid" aria-label="De weitjes">
            <rect x="6" y="6" width={W - 12} height={H - 12} rx="22" className="hk-gras" />
            {spel.wei.map((w, i) => {
              const x = M + (i % spel.breed) * V, y = M + Math.floor(i / spel.breed) * V
              return w ? (
                <g key={`w${i}`} className={`hk-wei w${w}`}>
                  <rect x={x + 6} y={y + 6} width={V - 12} height={V - 12} rx="10" />
                  <g transform={`translate(${x + V / 2} ${y + V / 2})`}><Teken s={w} /></g>
                </g>
              ) : null
            })}
            {spel.hek.map((h, e) => {
              const [x1, y1, x2, y2] = plek(spel, e).map((v) => M + v * V)
              return (
                <g key={`h${e}`} className={`hk-hek${h ? ' staat' : ''}${spel.laatste === e ? ' laatste' : ''}${tips.has(e) ? ' tip' : ''}`}
                   role="gridcell" aria-label={h ? 'Hekje' : 'Leeg'} onClick={() => druk(e)}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="hk-raak" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="hk-lijn" />
                </g>
              )
            })}
            {Array.from({ length: (spel.breed + 1) * (spel.hoog + 1) }, (_, i) => (
              <circle key={`p${i}`} cx={M + (i % (spel.breed + 1)) * V} cy={M + Math.floor(i / (spel.breed + 1)) * V} r="9" className="hk-paal" />
            ))}
          </svg>
          {uitslag && (
            <div className="hk-uitslag" role="status">
              <div className="hoera display">{ik > hij ? (lezer ? 'Gewonnen!' : '🎉') : ik === hij ? (lezer ? 'Gelijk!' : '🤝') : (lezer ? 'De eekhoorn wint' : '🐿️')}</div>
              <button type="button" className="groot-knop rk-knop" onClick={verder}>▶ {lezer && <span>Verder</span>}</button>
            </div>
          )}
        </div>
        <div className={`hk-zij hij${spel.aanZet === 2 && !uitslag ? ' beurt' : ''}`}>
          <Eekhoorn denkt={spel.aanZet === 2 && !uitslag} />
          <b className="hk-punten">{hij}</b>
          <RondeTeller ronde={spel.uitslagen.length} aantal={hekSpellen} />
        </div>
      </div>
    </div>
  )
}
