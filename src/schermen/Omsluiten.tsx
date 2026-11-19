import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { omsluitInstellingen, type OmsluitNiveau } from '../data/omsluiten.ts'
import { omsluitNiveaus, startOmsluitNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { computerZet, kiesDiep, kiesGulzig, kindZet, nieuwSpel, tellen, toegelaten, verschil, volgendeRonde, type Bord, type OmsluitSpel, type Steen } from '../lib/spelletjes/omsluiten.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './oms.css'

export default function Omsluiten() {
  return (
    <SpelKader titel="Blaadjes en vlokjes" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <OmsluitScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()
const minder = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Een herfstblaadje (het kind) of een sneeuwvlokje (de computer), getekend in een vak van -50 tot 50. */
function Vorm({ soort }: { soort: 1 | 2 }) {
  if (soort === 1) {
    return (
      <g>
        <path d="M0 -44C28 -36 40 -8 30 18C22 36 8 42 0 44C-8 42 -22 36 -30 18C-40 -8 -28 -36 0 -44Z" fill="#E8742A" stroke="#A8481A" strokeWidth="5" strokeLinejoin="round" />
        <path d="M0 -34V46M0 -6L-16 -20M0 10L16 -4M0 24L-12 14" stroke="#A8481A" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
    )
  }
  return (
    <g>
      <circle r="42" fill="#EAF5FF" stroke="#7DB6E8" strokeWidth="5" />
      <path d="M0 -34V34M-30 -17L30 17M-30 17L30 -17M-8 -28L0 -20L8 -28M-8 28L0 20L8 28" stroke="#4A9BE0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  )
}

function Klein({ soort }: { soort: 1 | 2 }) {
  return <svg className="oms-klein" viewBox="-50 -50 100 100" aria-hidden="true"><Vorm soort={soort} /></svg>
}

function OmsluitScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<OmsluitNiveau>(() => gekozenNiveau(kind.id, 'omsluiten', startOmsluitNiveau(kind, kinderen), Object.keys(omsluitNiveaus)))
  const [spel, setSpel] = useState<OmsluitSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [toon, setToon] = useState<Steen[]>(() => spel.bord.v)
  const [draait, setDraait] = useState<number[]>([])
  const [bezig, setBezigS] = useState(false)
  const bezigRef = useRef(false)
  const [fout, setFout] = useState<number | null>(null)
  const [hint, setHint] = useState<number | null>(null)
  const [tipVak, setTipVak] = useState<number | null>(null)
  const [tipsOver, setTipsOver] = useState(() => omsluitInstellingen[niveau].tips)
  const [slaap, setSlaap] = useState<0 | 1 | 2>(0)
  const [feest, setFeest] = useState(false)
  const [begintijd, setBegintijd] = useState(() => Date.now())
  const rooster = useRef<SVGSVGElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const inst = omsluitInstellingen[niveau]
  const n = spel.bord.n
  const stand = tellen({ n, v: toon })

  const zetBezig = (b: boolean) => { bezigRef.current = b; setBezigS(b) }
  function bewaar(na: OmsluitSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.omsluitenUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Makkelijk: na tien seconden zonder tik wiebelt de zet met de meeste omdraaiers.
  useEffect(() => {
    setHint(null)
    if (!inst.hulp || spel.klaar || spel.einde || spel.beurt !== 1 || bezig) return
    const t = setTimeout(() => setHint(kiesGulzig(spelRef.current.bord, 1, rand, 0)), 10000)
    return () => clearTimeout(t)
  }, [inst.hulp, spel, bezig])

  function opnieuw(nv: OmsluitNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    const s = nieuwSpel(nv)
    bewaar(s); setToon(s.bord.v); setDraait([]); zetBezig(false); setFout(null); setHint(null); setTipVak(null)
    setTipsOver(omsluitInstellingen[nv].tips); setSlaap(0); setFeest(false); setBegintijd(Date.now())
  }
  function kiesNiveau(nv: OmsluitNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'omsluiten', nv); opnieuw(nv) }

  /** Het nieuwe stukje komt meteen, de omgedraaide stukjes draaien een voor een om. */
  function animeer(oud: Bord, nieuw: Bord, vak: number, klaar: () => void) {
    const omgedraaid = nieuw.v.map((_, i) => i).filter((i) => oud.v[i] !== 0 && oud.v[i] !== nieuw.v[i])
    if (minder() || !omgedraaid.length) { setToon(nieuw.v); if (omgedraaid.length) geluid.draai(); klaar(); return }
    const eerste = oud.v.slice(); eerste[vak] = nieuw.v[vak]
    setToon(eerste); setDraait([])
    omgedraaid.forEach((x, k) => wacht(170 * (k + 1), () => {
      setToon((t) => { const c = t.slice(); c[x] = nieuw.v[x]; return c })
      setDraait((d) => [...d, x]); geluid.draai()
    }))
    wacht(170 * omgedraaid.length + 300, () => { setDraait([]); klaar() })
  }

  /** Na elke zet: wie is nu aan de beurt, of is de ronde klaar? */
  function volg(s: OmsluitSpel) {
    bewaar(s)
    if (s.einde) {
      zetBezig(true)
      if (verschil(s.bord) > 0) { setFeest(true); geluid.hoera() }
      wacht(2000, () => {
        const v = volgendeRonde(spelRef.current)
        setFeest(false); bewaar(v); setToon(v.bord.v)
        if (v.klaar) {
          if (!lezer) wacht(400, () => leesVoor(zin.omsluitenKlaar))
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'omsluiten', { niveau }, Math.max(1, Math.round((Date.now() - begintijd) / 1000))).catch(() => {})
        } else zetBezig(false)
      })
      return
    }
    if (s.overgeslagen) { setSlaap(s.overgeslagen); wacht(1600, () => setSlaap(0)) }
    if (s.beurt === 2) {
      zetBezig(true)
      wacht(700, () => {
        const c = computerZet(spelRef.current, rand)
        if (!c) { zetBezig(false); return }
        const oud = spelRef.current.bord
        animeer(oud, c.spel.bord, c.vak, () => volg(c.spel))
      })
    } else zetBezig(false)
  }

  function vakBij(e: React.PointerEvent): number {
    const r = rooster.current!.getBoundingClientRect()
    const c = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)))
    const rij = Math.min(n - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * n)))
    return rij * n + c
  }
  function tik(e: React.PointerEvent) {
    const s = spelRef.current
    if (bezigRef.current || s.einde || s.klaar || s.beurt !== 1) return
    const vak = vakBij(e)
    setHint(null); setTipVak(null)
    const na = kindZet(s, vak)
    if (!na) { geluid.oei(); setFout(vak); wacht(500, () => setFout(null)); return }
    zetBezig(true)
    animeer(s.bord, na.bord, vak, () => volg(na))
  }
  function tipKnop() {
    if (bezig || tipsOver <= 0 || spel.beurt !== 1 || spel.einde) return
    setTipsOver(tipsOver - 1); setTipVak(kiesDiep(spel.bord, 1, 2, rand)); wacht(3000, () => setTipVak(null))
  }

  const toe = inst.gloed && !bezig && spel.beurt === 1 && !spel.einde ? toegelaten(spel.bord, 1) : []
  const pluimenTotaal = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = inst.rondes.length * 3
  const plek = (v: number): [number, number] => [(v % n) + 0.5, Math.floor(v / n) + 0.5]

  return (
    <div className={`oms oms-${niveau}`}>
      <Chips label="Niveau" opties={omsluitNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {spel.klaar ? (
        <div className="oms-eind">
          <div className="oms-feest" aria-hidden="true">
            {[1, 2, 1, 2].map((s, k) => <svg key={k} viewBox="-50 -50 100 100"><Vorm soort={s as 1 | 2} /></svg>)}
          </div>
          <div className="hoera display">{lezer ? 'Mooi gespeeld!' : 'Hoera!'}</div>
          {inst.pluimen && (
            <div className="oms-pluimen" aria-label={`${pluimenTotaal} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < pluimenTotaal ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="oms-balk">
            <div className="oms-teller" aria-label={`Ronde ${spel.ronde + 1} van ${inst.rondes.length}`}>
              {inst.rondes.map((_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <div className="oms-stand" aria-label={`Blaadjes ${stand.blad}, vlokjes ${stand.vlok}`}>
              <span className={stand.blad > stand.vlok ? 'voor' : ''}><Klein soort={1} /> {stand.blad}</span>
              <span className={stand.vlok > stand.blad ? 'voor' : ''}><Klein soort={2} /> {stand.vlok}</span>
            </div>
            {slaap > 0 && <div className="oms-slaap" aria-label="Geen zet: de beurt gaat verder">💤 <Klein soort={slaap as 1 | 2} /></div>}
            {inst.tips > 0 && <button type="button" className="groot-knop oms-tip-knop" onClick={tipKnop} disabled={bezig || tipsOver <= 0 || spel.beurt !== 1}>💡 <span>Tip {tipsOver}</span></button>}
          </div>
          <div className={`oms-tafel${feest ? ' klaar' : ''}`} style={{ ['--n' as string]: n }}>
            <svg ref={rooster} className="oms-bord" viewBox={`0 0 ${n} ${n}`} role="img" aria-label="Het bord met blaadjes en vlokjes" onPointerDown={tik}>
              {Array.from({ length: n * n }, (_, v) => (
                <rect key={v} className={`oms-vak${toe.includes(v) ? ' gloed' : ''}${tipVak === v ? ' tip' : ''}${fout === v ? ' fout' : ''}`}
                      x={v % n + 0.03} y={Math.floor(v / n) + 0.03} width="0.94" height="0.94" rx="0.12" />
              ))}
              {hint !== null && (
                <g transform={`translate(${plek(hint).join(' ')}) scale(.0088)`} className="oms-wiebel" opacity=".6"><Vorm soort={1} /></g>
              )}
              {toon.map((s, v) => s !== 0 && (
                <g key={`${v}-${s}`} transform={`translate(${plek(v).join(' ')}) scale(.0088)`}>
                  <g className={`oms-steen${draait.includes(v) ? ' draai' : ''}`}><Vorm soort={s as 1 | 2} /></g>
                </g>
              ))}
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
