import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { karvrijRondes, type KarvrijNiveau } from '../data/karvrij.ts'
import { karvrijNiveaus, startKarvrijNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { bereik, nieuwSpel, opnieuwRonde, stap, terugMag, terugzetten, tip, volgende, type Kar, type KarSpel } from '../lib/spelletjes/karvrij.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './karvrij.css'

const KLEUREN = ['#D63A32', '#2F80C9', '#43A047', '#8E5BD1', '#E8772E', '#2FA5A5', '#C2569B', '#6B7A8F', '#A8693A', '#3F51B5', '#7CB342', '#D4A017', '#8D6E63']
const PIJLEN = ['▲', '▶', '▼', '◀']
const PIJL_NAMEN = ['Omhoog', 'Rechts', 'Omlaag', 'Links']
/** Per pijl: de kar die ermee schuift (horizontaal of verticaal) en de richting. */
const PIJL: { hor: boolean; teken: 1 | -1 }[] = [{ hor: false, teken: -1 }, { hor: true, teken: 1 }, { hor: false, teken: 1 }, { hor: true, teken: -1 }]
const TOETSEN: Record<string, number> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }

/** Een kar (eigen ontwerp): een kleine kar met pakjes, een lange kar met hooi, of de rode kar van de Sint met een mijtertje. */
function KarTekening({ kar, kleur }: { kar: Kar; kleur: string }) {
  const l = kar.len * 10
  const rood = kar.id === 0
  return (
    <g transform={kar.hor ? '' : `translate(10 0) rotate(90)`}>
      <rect x="0.8" y="2.2" width={l - 1.6} height="6.6" rx="1.6" fill={kleur} stroke="rgba(0,0,0,.35)" strokeWidth=".5" />
      <rect x="1.6" y="2.9" width={l - 3.2} height="1.1" rx=".5" fill="#fff" opacity=".28" />
      {rood ? (
        <g>
          <path d="M11 6.2V3.2L13.5 1L16 3.2V6.2Z" fill="#F2C530" stroke="#B08A00" strokeWidth=".4" />
          <path d="M13.5 1.6V5.6M12 3.6H15" stroke="#D63A32" strokeWidth=".6" />
        </g>
      ) : kar.len >= 3 ? (
        <path d={`M2 2.6Q4 -.4 7 .6Q10 -1.2 13 .8Q ${l - 6} -.6 ${l - 2} 2.6Z`} fill="#E8C766" stroke="#B8923A" strokeWidth=".4" />
      ) : (
        <g>
          <rect x="3" y="0.6" width="5" height="3" rx=".5" fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth=".3" />
          <rect x="9" y="1.2" width="4.5" height="2.4" rx=".5" fill="#FFD54F" stroke="rgba(0,0,0,.35)" strokeWidth=".3" />
        </g>
      )}
      <circle cx="3.6" cy="8.8" r="1.4" fill="#333" /><circle cx={l - 3.6} cy="8.8" r="1.4" fill="#333" />
    </g>
  )
}

export default function KarVrij() {
  return (
    <SpelKader titel="Kar vrij!" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <KarScherm kind={kind} />}
    </SpelKader>
  )
}

function KarScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KarvrijNiveau>(() =>
    gekozenNiveau(kind.id, 'karvrij', startKarvrijNiveau(kind, kinderen), Object.keys(karvrijNiveaus)))
  const [spel, setSpel] = useState<KarSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState(0)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [tipsOver, setTipsOver] = useState(() => karvrijNiveaus[niveau].tips)
  const [wijs, setWijs] = useState<{ id: number; teken: number; hor: boolean } | null>(null)
  const [sleep, setSleep] = useState<{ id: number; x: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const svgRef = useRef<SVGSVGElement>(null)
  const raak = useRef<{ id: number; start: number; hor: boolean; min: number; max: number; schaal: number; verplaatst: boolean } | null>(null)
  const lezer = kind.kan_lezen
  const n = karvrijNiveaus[niveau]
  const af = spel.klaar
  const aantalRondes = karvrijRondes[niveau].length

  function bewaar(na: KarSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.karvrijUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function toonHulp() {
    const z = tip(spelRef.current)
    if (!z) return
    setGekozen(z.id); setWijs({ id: z.id, teken: z.n > 0 ? 1 : -1, hor: spelRef.current.bord.karren[z.id].hor })
  }
  // Makkelijk: na tien seconden zonder zet wiebelt de kar die als eerste moet schuiven.
  useEffect(() => {
    setWijs(null)
    if (!n.hulp || af || feest) return
    const t = setTimeout(toonHulp, 10000)
    return () => clearTimeout(t)
  }, [n.hulp, af, feest, spel.ronde, spel.zetten]) // eslint-disable-line react-hooks/exhaustive-deps

  function opnieuw(nv: KarvrijNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen(0); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0)
    setFeest(false); setTipsOver(karvrijNiveaus[nv].tips); setSleep(null)
  }
  function kiesNiveau(nv: KarvrijNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'karvrij', nv); opnieuw(nv) }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current)
      bewaar(vol); setFeest(false); setGekozen(0); rondeBegin.current = Date.now(); setSeconden(0)
      if (vol.klaar) {
        if (!lezer) setTimeout(() => leesVoor(zin.karvrijKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'karvrij', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1800)
  }

  /** Schuift een kar `aantal` vakjes (vakje voor vakje, zodat het één zet blijft). */
  function schuifKar(id: number, aantal: number) {
    if (feest || spelRef.current.klaar || aantal === 0) return false
    const teken = aantal > 0 ? 1 : -1
    let s = spelRef.current, gelukt = false, klaar = false
    const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
    for (let i = 0; i < Math.abs(aantal); i++) {
      const u = stap(s, id, teken, secs, n.seconden)
      if (!u.gelukt) break
      s = u.spel; gelukt = true
      if (u.rondeKlaar) { klaar = true; break }
    }
    if (!gelukt) { geluid.oei(); return false }
    bewaar(s)
    if (klaar) rondeGehaald(); else geluid.toon(300 + id * 20)
    return true
  }

  function pijl(i: number) {
    const p = PIJL[i]
    const kar = spelRef.current.bord.karren[gekozen]
    if (!kar || kar.hor !== p.hor) return
    schuifKar(gekozen, p.teken)
  }
  const pijlRef = useRef(pijl)
  pijlRef.current = pijl
  useEffect(() => {
    const f = (e: KeyboardEvent) => { const d = TOETSEN[e.key]; if (d !== undefined) { e.preventDefault(); pijlRef.current(d) } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  function terug() {
    if (feest || !terugMag(spelRef.current, n.maxTerug)) return
    bewaar(terugzetten(spelRef.current, n.maxTerug)); geluid.draai()
  }
  function ronde() {
    if (feest) return
    bewaar(opnieuwRonde(spelRef.current)); rondeBegin.current = Date.now(); setSeconden(0)
  }
  function tipKnop() {
    if (feest || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); toonHulp(); setTimeout(() => setWijs(null), 2500)
  }

  // Slepen: de kar volgt de vinger langs zijn eigen as en springt bij het loslaten naar het dichtstbijzijnde vakje.
  function neer(e: React.PointerEvent, kar: Kar) {
    if (feest) return
    const svg = svgRef.current
    if (!svg) return
    const b = bereik(spelRef.current.bord, kar.id)
    const schaal = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
    raak.current = { id: kar.id, start: kar.hor ? e.clientX : e.clientY, hor: kar.hor, min: b.min, max: b.max, schaal, verplaatst: false }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setGekozen(kar.id)
  }
  function beweeg(e: React.PointerEvent) {
    const t = raak.current
    if (!t) return
    const d = ((t.hor ? e.clientX : e.clientY) - t.start) / t.schaal / 10
    if (Math.abs(d) > 0.15) t.verplaatst = true
    setSleep({ id: t.id, x: Math.max(t.min, Math.min(t.max, d)) })
  }
  function los() {
    const t = raak.current; raak.current = null
    const x = sleep?.x ?? 0
    setSleep(null)
    if (!t || !t.verplaatst) return
    schuifKar(t.id, Math.round(x))
  }

  const bord = spel.bord
  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = aantalRondes * 3
  const klok = Math.max(0, n.seconden - seconden)
  const gekozenKar = bord.karren[gekozen]
  const tekenKar = (k: Kar) => {
    const dx = sleep && sleep.id === k.id && k.hor ? sleep.x : 0
    const dy = sleep && sleep.id === k.id && !k.hor ? sleep.x : 0
    const uit = feest && k.id === 0
    const x = (k.c + dx) * 10 + (uit ? bord.kol * 10 : 0), y = (k.r + dy) * 10
    return { x, y, trek: !!sleep && sleep.id === k.id, uit }
  }

  return (
    <div className={`karvrij karvrij-${niveau}`}>
      <Chips label="Niveau" opties={karvrijNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="karvrij-eind">
          <svg className="karvrij-feest" viewBox="0 0 160 100" aria-hidden="true">
            <rect x="10" y="74" width="140" height="8" rx="3" fill="#7A4E2A" />
            <rect x="34" y="36" width="64" height="32" rx="6" fill="#D63A32" stroke="rgba(0,0,0,.3)" strokeWidth="2" />
            <path d="M54 36V24L66 14L78 24V36Z" fill="#F2C530" stroke="#B08A00" strokeWidth="2" />
            <circle cx="50" cy="72" r="9" fill="#333" /><circle cx="84" cy="72" r="9" fill="#333" />
            <path d="M104 52H136M136 52L126 44M136 52L126 60" fill="none" stroke="#2F8F5B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="hoera display">{lezer ? 'De kar is vrij!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="karvrij-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="karvrij-balk">
            <div className="karvrij-teller" aria-label={`Puzzel ${spel.ronde + 1} van ${aantalRondes}`}>
              {Array.from({ length: aantalRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <div className="karvrij-zetten" aria-label={`${spel.zetten} zetten`}>↔ {spel.zetten}</div>
            {n.pluimen && <div className="karvrij-klok" aria-label={`${klok} seconden over`}>⏱ {klok}s</div>}
          </div>
          <div className="karvrij-veld">
            <div className={`karvrij-tafel${feest ? ' klaar' : ''}`} style={{ ['--rijen' as string]: bord.rijen, ['--kol' as string]: bord.kol }}>
              <svg ref={svgRef} viewBox={`0 0 ${bord.kol * 10 + 8} ${bord.rijen * 10}`} className="karvrij-bord" role="img" aria-label="De stalstraat met karren">
                <defs><clipPath id="kv-klip"><rect width={bord.kol * 10 + 8} height={bord.rijen * 10} /></clipPath></defs>
                <g clipPath="url(#kv-klip)">
                  <rect width={bord.kol * 10} height={bord.rijen * 10} fill="#E9D6B2" />
                  {Array.from({ length: bord.rijen * bord.kol }, (_, i) => (
                    <rect key={i} x={(i % bord.kol) * 10} y={Math.floor(i / bord.kol) * 10} width="10" height="10" fill={(Math.floor(i / bord.kol) + (i % bord.kol)) % 2 ? '#DEC89D' : '#E9D6B2'} />
                  ))}
                  <rect x={bord.kol * 10} width="8" height={bord.rijen * 10} fill="#CFE3C2" />
                  <path d={`M${bord.kol * 10} ${bord.poortRij * 10}H${bord.kol * 10 + 8}M${bord.kol * 10} ${bord.poortRij * 10 + 10}H${bord.kol * 10 + 8}`} stroke="#B3B3B3" strokeWidth=".6" strokeDasharray="1.5 1" />
                  <g>
                    <rect x={bord.kol * 10 + 5.4} y={bord.poortRij * 10 - 3} width="2" height="16" rx=".6" fill="#8A5A33" />
                    <path d={`M${bord.kol * 10 + 5.4} ${bord.poortRij * 10 - 3}L${bord.kol * 10 + 1} ${bord.poortRij * 10 - 1}L${bord.kol * 10 + 5.4} ${bord.poortRij * 10 + 1}Z`} fill="#F2C530" />
                  </g>
                  {bord.blok.map((b, i) => b && (
                    <g key={`b${i}`} transform={`translate(${(i % bord.kol) * 10} ${Math.floor(i / bord.kol) * 10})`}>
                      <rect x="4.2" y="6" width="1.8" height="3.4" fill="#6E4A28" />
                      <path d="M5 .8L9 6.6H1Z" fill="#2F8F5B" stroke="#1F6B42" strokeWidth=".4" />
                      <path d="M5 3L8.2 7.6H1.8Z" fill="#43A047" />
                    </g>
                  ))}
                  {bord.karren.map((k) => {
                    const t = tekenKar(k)
                    const isGekozen = gekozen === k.id
                    return (
                      <g key={k.id} className={`karvrij-kar${t.trek ? ' trek' : ''}${t.uit ? ' uit' : ''}${isGekozen ? ' gekozen' : ''}${wijs?.id === k.id ? ' hint' : ''}`}
                         style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
                         onPointerDown={(e) => neer(e, k)} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={() => { raak.current = null; setSleep(null) }}>
                        {isGekozen && <rect className="karvrij-rand" x={k.hor ? 0 : 0} y={0} width={k.hor ? k.len * 10 : 10} height={k.hor ? 10 : k.len * 10} rx="2" fill="none" />}
                        <KarTekening kar={k} kleur={k.id === 0 ? KLEUREN[0] : KLEUREN[1 + ((k.id - 1) % (KLEUREN.length - 1))]} />
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>
            <div className="karvrij-zij">
              <div className="karvrij-pijlen" role="group" aria-label="De gekozen kar schuiven">
                {[0, 3, 2, 1].map((i) => {
                  const p = PIJL[i]
                  const mogelijk = !!gekozenKar && gekozenKar.hor === p.hor
                  const bereikt = mogelijk ? bereik(bord, gekozen) : { min: 0, max: 0 }
                  const vrij = p.teken > 0 ? bereikt.max > 0 : bereikt.min < 0
                  return (
                    <button key={i} type="button" aria-label={PIJL_NAMEN[i]}
                            className={`groot-knop karvrij-pijl karvrij-pijl-${i}${wijs && wijs.hor === p.hor && wijs.teken === p.teken ? ' hint' : ''}`}
                            onClick={() => pijl(i)} disabled={feest || !mogelijk || !vrij}>{PIJLEN[i]}</button>
                  )
                })}
              </div>
              <div className="karvrij-knoppen">
                <button type="button" className="groot-knop karvrij-actie" onClick={terug} disabled={feest || !terugMag(spel, n.maxTerug)}>
                  ↶ <span>Terug{n.maxTerug ? ` ${Math.max(0, n.maxTerug - spel.terug)}` : ''}</span>
                </button>
                <button type="button" className="groot-knop karvrij-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
                {n.tips > 0 && <button type="button" className="groot-knop karvrij-actie" onClick={tipKnop} disabled={feest || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
