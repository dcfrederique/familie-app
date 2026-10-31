import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startWinterslaapNiveau, winterslaapNiveaus, winterslaapRondes, type WinterslaapNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import {
  dierVan, hint, isKlaar, nieuwSpel, opnieuwBeginnen, terug, tik, volgende, wissel, zettenOver, type Dier as DierSoort, type WinterSpel,
} from '../lib/spelletjes/winterslaap.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './winterslaap.css'

/** Eén dier in zijn bedje: wakker met open ogen en een gele gloed, slapend met dichte ogen, een blauwe deken en een zzz. */
function Dier({ soort, slaapt }: { soort: DierSoort; slaapt: boolean }) {
  const huid = { egel: '#C99A6B', eekhoorn: '#D9833F', beer: '#9C6B45', muis: '#B9BDC6' }[soort]
  return (
    <svg viewBox="-50 -50 100 100" className={`slaap-dier${slaapt ? ' slaapt' : ''}`} aria-hidden="true">
      {!slaapt && <circle cx={0} cy={-2} r={46} fill="#F8D96B" opacity={0.45} className="slaap-gloed" />}
      <ellipse cx={0} cy={30} rx={40} ry={14} fill="#B98A4E" /><ellipse cx={0} cy={27} rx={34} ry={10} fill="#D6AD6F" />
      <g className="slaap-lijf">
        {soort === 'egel' && <path d="M-34 6Q-36 -34 0 -38Q36 -34 34 6Z" fill="#6B4A2E" />}
        {soort === 'eekhoorn' && <path d="M26 20C52 20 54 -22 36 -34C42 -16 34 -4 24 -4Z" fill="#B8662C" />}
        {soort === 'beer' && <><circle cx={-22} cy={-26} r={10} fill={huid} /><circle cx={22} cy={-26} r={10} fill={huid} /></>}
        {soort === 'muis' && <><circle cx={-24} cy={-26} r={13} fill={huid} /><circle cx={24} cy={-26} r={13} fill={huid} /><circle cx={-24} cy={-26} r={7} fill="#F2A7B5" /><circle cx={24} cy={-26} r={7} fill="#F2A7B5" /></>}
        {soort === 'eekhoorn' && <><path d="M-18 -26L-22 -42L-8 -32Z" fill={huid} /><path d="M18 -26L22 -42L8 -32Z" fill={huid} /></>}
        <circle cx={0} cy={0} r={26} fill={huid} />
        <ellipse cx={0} cy={8} rx={15} ry={11} fill={soort === 'egel' ? '#F1DDBE' : '#F5E6C8'} />
        <ellipse cx={0} cy={3} rx={4.5} ry={3.4} fill="#4A2F22" />
        {slaapt
          ? <path d="M-15 -6Q-10 -1 -5 -6M5 -6Q10 -1 15 -6" stroke="#2B2233" strokeWidth={3} fill="none" strokeLinecap="round" />
          : <><circle cx={-10} cy={-6} r={4.6} fill="#fff" /><circle cx={10} cy={-6} r={4.6} fill="#fff" /><circle cx={-10} cy={-5.5} r={2.4} fill="#2B2233" /><circle cx={10} cy={-5.5} r={2.4} fill="#2B2233" /></>}
      </g>
      {slaapt && (
        <>
          <path d="M-42 34Q-40 10 0 8Q40 10 42 34Q0 42 -42 34Z" fill="#4C7BD6" /><path d="M-30 20Q0 14 30 20M-34 28Q0 22 34 28" stroke="#9EB9EF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <text x={22} y={-28} className="slaap-z" fontSize={22} fontWeight={800} fill="#6A5BD1">z</text>
          <text x={34} y={-40} className="slaap-z z2" fontSize={16} fontWeight={800} fill="#6A5BD1">z</text>
        </>
      )}
    </svg>
  )
}

/** Een klein maantje voor de tikkenlimiet. */
const Maantje = ({ op }: { op: boolean }) => (
  <svg viewBox="-12 -12 24 24" className={op ? 'op' : ''} aria-hidden="true"><path d="M7 7A9 9 0 0 1-4-7A9 9 0 1 0 7 7Z" fill="#F8D96B" /></svg>
)

export default function Winterslaap() {
  return (
    <SpelKader titel="Winterslaap" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <WinterslaapScherm kind={kind} />}
    </SpelKader>
  )
}

function WinterslaapScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<WinterslaapNiveau>(() =>
    gekozenNiveau(kind.id, 'winterslaap', startWinterslaapNiveau(kind, kinderen), Object.keys(winterslaapNiveaus)))
  const [spel, setSpel] = useState<WinterSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [tip, setTip] = useState<number | null>(null)
  const [vast, setVast] = useState(false)
  const [kriebel, setKriebel] = useState<{ i: number; n: number }>({ i: -1, n: 0 })
  const [schud, setSchud] = useState(0)
  // Telt elk nieuw spel, zodat de hint ook opnieuw start als niets anders veranderde.
  const [nummer, setNummer] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const { breed, hoog, kriebel: buren, hints } = winterslaapNiveaus[niveau]
  const af = isKlaar(spel)
  const over = zettenOver(spel)
  const limiet = over === null ? null : spel.kortste + (winterslaapNiveaus[niveau].extra ?? 0)

  function bewaar(na: WinterSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.winterslaapUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Doet het kind een tijdje niets, dan tintelt een bedje uit een goede oplossing (niet op moeilijk).
  useEffect(() => {
    setTip(null)
    if (af || vast || !hints) return
    const t = setTimeout(() => setTip(hint(spelRef.current)), buren ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [spel.tikken.length, spel.ronde, af, vast, nummer, hints, buren])

  function opnieuw(nv: WinterslaapNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setVast(false); setNummer((n) => n + 1)
  }
  function kiesNiveau(nv: WinterslaapNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'winterslaap', nv); opnieuw(nv) }

  function bed(i: number) {
    if (vast) return
    const uit = tik(spelRef.current, i)
    bewaar(uit.spel); setKriebel((k) => ({ i, n: k.n + 1 }))
    if (uit.zet === 'slaapt') {
      setVast(true); geluid.paar()
      timer.current = setTimeout(() => {
        const vol = volgende(spelRef.current)
        bewaar(vol); setVast(false); setNummer((n) => n + 1)
        if (isKlaar(vol)) {
          geluid.hoera()
          if (!lezer) setTimeout(() => leesVoor(zin.winterslaapKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'winterslaap', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1300)
    } else if (uit.zet === 'reset') { geluid.oei(); setSchud((n) => n + 1) } else geluid.draai()
  }
  function stapTerug() { if (!vast) { bewaar(terug(spelRef.current)); geluid.draai() } }
  function vanVoren() { if (!vast) { bewaar(opnieuwBeginnen(spelRef.current)); geluid.draai() } }

  const geraakt = kriebel.i >= 0 ? wissel(kriebel.i, breed, hoog, buren) : []

  return (
    <div className={`slaap slaap-${niveau}`}>
      <Chips label="Niveau" opties={winterslaapNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="slaap-eind">
          <svg className="slaap-feest" viewBox="-120 -60 240 110" aria-hidden="true">
            {(['egel', 'eekhoorn', 'beer', 'muis'] as const).map((d, i) => <g key={d} transform={`translate(${-90 + i * 60} 0)`}><svg x={-50} y={-50} width={100} height={100} viewBox="-50 -50 100 100"><Dier soort={d} slaapt /></svg></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Welterusten!' : 'Hoera!'}</div>
          {niveau === 'moeilijk' && lezer && (
            <div className="slaap-pluim" aria-label={`${spel.schoon} van ${winterslaapRondes} rasters zonder opnieuw beginnen`}>
              {Array.from({ length: winterslaapRondes }, (_, i) => <span key={i} className={i < spel.schoon ? 'op' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="slaap-balk">
            <div className="slaap-teller" aria-label={`Raster ${spel.ronde + 1} van ${winterslaapRondes}`}>
              {Array.from({ length: winterslaapRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {limiet !== null && (
              <div key={schud} className={`slaap-maantjes${schud ? ' schud' : ''}`} aria-label={`Nog ${over} tikken`}>
                {Array.from({ length: limiet }, (_, i) => <Maantje key={i} op={i >= spel.tikken.length} />)}
              </div>
            )}
            <div className="slaap-knoppen">
              <button type="button" className="slaap-knop" aria-label="Terug" disabled={!spel.tikken.length || vast} onClick={stapTerug}>
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 11h-4" /></svg>
                {lezer && <span>Terug</span>}
              </button>
              <button type="button" className="slaap-knop" aria-label="Van voor af" disabled={!spel.tikken.length || vast} onClick={vanVoren}>
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg>
                {lezer && <span>Van voor af</span>}
              </button>
            </div>
          </div>
          <div key={`v${schud}`} className={`slaap-veld${schud ? ' schud' : ''}`} style={{ aspectRatio: `${breed} / ${hoog}`, gridTemplateColumns: `repeat(${breed}, 1fr)` }} role="group" aria-label="Bedjes">
            {spel.wakker.map((w, i) => (
              <button key={i} type="button" className={`slaap-bed${tip === i ? ' tip' : ''}`} onClick={() => bed(i)} disabled={vast}
                      aria-label={`${dierVan(i, breed)}, ${w ? 'wakker' : 'slaapt'}`}>
                <span key={geraakt.includes(i) ? kriebel.n : 0} className={geraakt.includes(i) && kriebel.n ? (i === kriebel.i ? 'slaap-tik' : 'slaap-rimpel') : ''}>
                  <Dier soort={dierVan(i, breed)} slaapt={!w} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
