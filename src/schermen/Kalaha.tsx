import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { kalahaNiveaus, kalahaSpellen, type KalahaNiveau } from '../data/kalaha.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { eekhoornZet, isKlaar, mag, nieuwSpel, nogEens, pluimen, pot, speel, spelOver, telling, volgendSpel, type KalahaSpel } from '../lib/spelletjes/kalaha.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './kalaha.css'

const P = 100 // breedte van een putje in de tekening
const POT = 110 // breedte van een pot

/** Plaatsen van de pepernoten in een putje (rond het midden, in een spiraaltje). */
const plekjes = Array.from({ length: 14 }, (_, k) => {
  if (k === 0) return [0, 0]
  const h = k * 2.4, r = 11 + 6.4 * Math.sqrt(k)
  return [Math.cos(h) * r, Math.sin(h) * r * 0.9]
})

function Noten({ n, groot }: { n: number; groot?: boolean }) {
  const s = groot ? 1.25 : 1
  return (
    <g>
      {plekjes.slice(0, Math.min(n, 10)).map(([x, y], k) => (
        <g key={k} transform={`translate(${x * s} ${y * s})`}>
          <circle r="9.5" className="kh-noot" />
          <circle r="2.8" cx="-2.6" cy="-2.6" className="kh-glim" />
        </g>
      ))}
    </g>
  )
}

function Eekhoorn({ denkt }: { denkt: boolean }) {
  return (
    <svg className={`kh-eekhoorn${denkt ? ' denkt' : ''}`} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M58 70Q80 52 70 28Q64 14 52 22Q62 34 54 52Z" fill="#C0661A" />
      <ellipse cx="36" cy="54" rx="18" ry="20" fill="#D9853B" /><ellipse cx="36" cy="58" rx="10" ry="12" fill="#F6D6A8" />
      <circle cx="36" cy="28" r="15" fill="#D9853B" /><path d="M24 18L22 6L32 14ZM48 18L50 6L40 14Z" fill="#D9853B" />
      <circle cx="31" cy="27" r="2.5" fill="#1C2433" /><circle cx="41" cy="27" r="2.5" fill="#1C2433" /><circle cx="36" cy="33" r="2.2" fill="#5A3A22" />
    </svg>
  )
}

export default function Kalaha() {
  return (
    <SpelKader titel="Kalaha" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <KalahaScherm kind={kind} />}
    </SpelKader>
  )
}

function KalahaScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KalahaNiveau>(() =>
    gekozenNiveau(kind.id, 'kalaha', startDrieNiveau(kind, kinderen), Object.keys(kalahaNiveaus)))
  const [spel, setSpel] = useState<KalahaSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [uitslag, setUitslag] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = kalahaNiveaus[niveau]
  const over = spelOver(spel)

  function bewaar(na: KalahaSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.kalahaUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  // De eekhoorn speelt vanzelf als hij aan zet is (ook nog eens, als zijn laatste pepernoot in zijn pot viel).
  useEffect(() => {
    if (af || over || uitslag || spel.aanZet !== 2) return
    timer.current = setTimeout(() => {
      const s = spelRef.current
      const na = speel(s, eekhoornZet(s))
      bewaar(na)
      geluid.toon(330)
      if (spelOver(na)) klaarMetSpel()
    }, 300 + spel.spoor.length * 90 + 700)
    return () => clearTimeout(timer.current)
  }, [spel, af, over, uitslag])

  function klaarMetSpel() {
    setTimeout(() => {
      setUitslag(true)
      const [ik, hij] = telling(spelRef.current)
      if (ik > hij) geluid.hoera(); else geluid.oei()
    }, 900)
  }
  function verder() {
    const vol = volgendSpel(spelRef.current)
    bewaar(vol); setUitslag(false)
    if (isKlaar(vol)) {
      if (!lezer) setTimeout(() => leesVoor(zin.kalahaKlaar), 400)
      const gewonnen = vol.uitslagen.filter(([a, b]) => a > b).length
      void bron?.activiteitOpslaan(kind.id, 'kalaha', { niveau, goed: gewonnen }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
    }
  }

  function opnieuw(nv: KalahaNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setUitslag(false)
  }
  function kiesNiveau(nv: KalahaNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'kalaha', nv); opnieuw(nv) }

  function druk(i: number) {
    const s = spelRef.current
    if (af || uitslag || s.aanZet !== 1 || !mag(s, i)) return
    const na = speel(s, i)
    bewaar(na)
    geluid.toon(na.aanZet === 1 && !spelOver(na) ? 880 : 520)
    if (spelOver(na)) klaarMetSpel()
  }

  if (af) {
    const gewonnen = spel.uitslagen.filter(([a, b]) => a > b).length
    return (
      <div className="kh">
        <Chips label="Niveau" opties={kalahaNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-60 -30 120 60" className="kh-eindprent" aria-hidden="true">
            <ellipse rx="56" ry="26" fill="#8A5A33" /><ellipse rx="48" ry="19" fill="#5B3A1E" /><g transform="translate(0 -2)"><Noten n={12} /></g>
          </svg>
          <div className="hoera display">{lezer ? `Je won ${gewonnen} van de ${kalahaSpellen} spelletjes!` : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={pluimen(spel)} max={kalahaSpellen * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const [ik, hij] = telling(spel)
  const tips = n.hint && spel.aanZet === 1 && !uitslag ? new Set(nogEens(spel)) : new Set<number>()
  const W = 2 * POT + spel.n * P + 40, H = 260
  const spoorNr = new Map(spel.spoor.map((i, k) => [i, k]))
  const putje = (i: number, x: number, y: number) => {
    const c = spel.bord[i], k = spoorNr.get(i)
    const kan = spel.aanZet === 1 && mag(spel, i) && !uitslag
    return (
      <g key={i} transform={`translate(${x} ${y})`} className={`kh-putje${kan ? ' kan' : ''}${tips.has(i) ? ' tip' : ''}`}
         role={i < spel.n ? 'button' : undefined} aria-label={`${c} pepernoten`} onClick={() => druk(i)}>
        <ellipse rx="44" ry="44" className="kh-gat" />
        <g key={`${spel.spoor.join('-')}-${k ?? 'x'}`} className={k !== undefined ? 'kh-spoor' : undefined} style={k !== undefined ? { animationDelay: `${k * 90}ms` } : undefined}>
          <Noten n={c} />
        </g>
        {(lezer || c > 10) && <text className="kh-tal" y={i < spel.n ? 64 : -52}>{c}</text>}
      </g>
    )
  }
  const potje = (i: number, x: number, wie: 1 | 2) => (
    <g transform={`translate(${x} ${H / 2})`} className={`kh-pot p${wie}`}>
      <rect x={-POT / 2 + 8} y="-104" width={POT - 16} height="208" rx="46" className="kh-gat" />
      <g transform="scale(1.2)"><Noten n={spel.bord[i]} groot /></g>
      <text className="kh-tal groot" y="6">{spel.bord[i]}</text>
    </g>
  )
  return (
    <div className="kh">
      <Chips label="Niveau" opties={kalahaNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="kh-spel">
        <div className="kh-plek">
          <svg className="kh-bord" viewBox={`0 0 ${W} ${H}`} aria-label="Het kalahabord">
            <rect x="4" y="4" width={W - 8} height={H - 8} rx="60" className="kh-hout" />
            {potje(pot(spel, 2), 20 + POT / 2, 2)}
            {potje(pot(spel, 1), W - 20 - POT / 2, 1)}
            {Array.from({ length: spel.n }, (_, k) => putje(k, 20 + POT + P * k + P / 2, H - 70))}
            {Array.from({ length: spel.n }, (_, k) => putje(spel.n + 1 + k, 20 + POT + P * (spel.n - 1 - k) + P / 2, 70))}
          </svg>
          {uitslag && (
            <div className="kh-uitslag" role="status">
              <div className="hoera display">{ik > hij ? (lezer ? 'Gewonnen!' : '🎉') : ik === hij ? (lezer ? 'Gelijk!' : '🤝') : (lezer ? 'De eekhoorn wint' : '🐿️')}</div>
              <button type="button" className="groot-knop rk-knop" onClick={verder}>▶ {lezer && <span>Verder</span>}</button>
            </div>
          )}
        </div>
        <div className="kh-zij">
          <div className={`kh-wie hij${spel.aanZet === 2 && !uitslag && !over ? ' beurt' : ''}`}>
            <Eekhoorn denkt={spel.aanZet === 2 && !uitslag && !over} />
            <b>{hij}</b>
          </div>
          <RondeTeller ronde={spel.uitslagen.length} aantal={kalahaSpellen} />
          <div className={`kh-wie mij${spel.aanZet === 1 && !uitslag && !over ? ' beurt' : ''}`}>
            {lezer ? <span className="kh-naam">{kind.naam}</span> : <svg viewBox="-12 -12 24 24" className="kh-ik" aria-hidden="true"><circle r="10" className="kh-noot" /></svg>}
            <b>{ik}</b>
          </div>
        </div>
      </div>
    </div>
  )
}
