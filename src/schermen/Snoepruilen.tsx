import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { ruilBord, ruilRondes, type RuilDoel, type RuilNiveau } from '../data/snoepruilen.ts'
import { ruilNiveaus, startRuilNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { doeRuil, nieuwSpel, opnieuwRonde, tip, volgende, type Bord, type RuilSpel, type Stadium } from '../lib/spelletjes/snoepruilen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './ruil.css'

/** Zes snoepjes (eigen ontwerp), elk met een eigen kleur én vorm. */
function Snoep({ soort }: { soort: number }) {
  switch (soort) {
    case 0: return (  // speculaasje: een bruin koekje met een patroon
      <g><rect x="14" y="14" width="72" height="72" rx="14" fill="#B5703A" stroke="#7A4A22" strokeWidth="4" />
        <path d="M30 30h40M30 50h40M30 70h40" stroke="#E2B27C" strokeWidth="6" strokeLinecap="round" /></g>)
    case 1: return (  // pepernoot: een ronde noot met stippen
      <g><circle cx="50" cy="50" r="38" fill="#D9A15B" stroke="#8C5B24" strokeWidth="4" />
        <circle cx="38" cy="40" r="5" fill="#8C5B24" /><circle cx="60" cy="38" r="5" fill="#8C5B24" /><circle cx="50" cy="60" r="5" fill="#8C5B24" /></g>)
    case 2: return (  // marsepeinhartje
      <g><path d="M50 86C14 60 10 34 28 22C40 15 48 22 50 30C52 22 60 15 72 22C90 34 86 60 50 86Z" fill="#F277A8" stroke="#B83B72" strokeWidth="4" strokeLinejoin="round" />
        <path d="M30 32Q34 26 42 28" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".7" /></g>)
    case 3: return (  // chocoladeletter: een donkere reep met gouden folie
      <g><rect x="26" y="10" width="48" height="80" rx="10" fill="#5B3A29" stroke="#2F1D13" strokeWidth="4" />
        <rect x="26" y="34" width="48" height="30" fill="#E9B93A" /><path d="M38 49h24" stroke="#5B3A29" strokeWidth="6" strokeLinecap="round" /></g>)
    case 4: return (  // bonbon: een ingepakt snoepje met strikjes
      <g><path d="M6 32L26 46L26 54L6 68Z" fill="#7FA6F5" stroke="#2F5BC0" strokeWidth="3" strokeLinejoin="round" />
        <path d="M94 32L74 46L74 54L94 68Z" fill="#7FA6F5" stroke="#2F5BC0" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="50" cy="50" rx="32" ry="26" fill="#4B7BE5" stroke="#2F5BC0" strokeWidth="4" />
        <path d="M30 40Q40 32 52 34" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6" /></g>)
    default: return (  // strooigoedster
      <g><path d="M50 8L61 36L92 38L68 57L76 88L50 71L24 88L32 57L8 38L39 36Z" fill="#F2C530" stroke="#B08A00" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="42" cy="46" r="3.5" fill="#E94B5B" /><circle cx="58" cy="52" r="3.5" fill="#43A047" /><circle cx="48" cy="62" r="3.5" fill="#2F80C9" /></g>)
  }
}

/** Het tegeltje van een vak: ijs eronder, het snoepje, en eventueel een strooizakje of kettingen. */
function Vak({ bord, i, weg, kies, hint, zwaai, tik, neer, los }: {
  bord: Bord; i: number; weg: boolean; kies: boolean; hint: boolean; zwaai: boolean
  tik: () => void; neer: (e: React.PointerEvent) => void; los: (e: React.PointerEvent) => void
}) {
  const s = bord.vak[i]
  return (
    <button type="button" className={`ruil-vak${bord.ijs[i] ? ' ijs' : ''}${weg ? ' weg' : ''}${kies ? ' kies' : ''}${hint ? ' hint' : ''}${zwaai ? ' zwaai' : ''}`}
            aria-label={s < 0 ? 'leeg' : `snoepje ${s + 1}`} onClick={tik} onPointerDown={neer} onPointerUp={los}>
      {s >= 0 && (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <Snoep soort={s} />
          {bord.zakje[i] && <g><circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray="10 8" /><path d="M50 22L56 44L78 50L56 56L50 78L44 56L22 50L44 44Z" fill="#fff" stroke="#8A6D00" strokeWidth="3" /></g>}
          {bord.vast[i] && <g><rect x="6" y="6" width="88" height="88" rx="14" fill="rgba(190,225,245,.55)" stroke="#6FA8C8" strokeWidth="5" /><path d="M14 14L86 86M86 14L14 86" stroke="#7B8794" strokeWidth="7" strokeLinecap="round" /></g>}
        </svg>
      )}
    </button>
  )
}

function DoelIcoon({ soort }: { soort: number }) { return <svg viewBox="0 0 100 100" className="ruil-doelsnoep" aria-hidden="true"><Snoep soort={soort} /></svg> }

/** De doelen van de ronde met wat er nog nodig is. */
function Doelen({ doel, spel }: { doel: RuilDoel; spel: RuilSpel }) {
  const rest = (n: number, g: number) => Math.max(0, n - g)
  return (
    <div className="ruil-doelen" aria-label="Wat je nog moet doen">
      {doel.totaal !== undefined && <div className={`ruil-doel${spel.stand.totaal >= doel.totaal ? ' af' : ''}`}><span className="ruil-icoon">🍬</span><b>{rest(doel.totaal, spel.stand.totaal)}</b></div>}
      {doel.soorten?.map(([s, n]) => (
        <div key={s} className={`ruil-doel${spel.stand.soorten[s] >= n ? ' af' : ''}`}><DoelIcoon soort={s} /><b>{rest(n, spel.stand.soorten[s])}</b></div>
      ))}
      {doel.ijs !== undefined && <div className={`ruil-doel${spel.stand.ijs >= doel.ijs ? ' af' : ''}`}><span className="ruil-icoon">❄️</span><b>{rest(doel.ijs, spel.stand.ijs)}</b></div>}
      {doel.bevrijd !== undefined && <div className={`ruil-doel${spel.stand.bevrijd >= doel.bevrijd ? ' af' : ''}`}><span className="ruil-icoon">🔓</span><b>{rest(doel.bevrijd, spel.stand.bevrijd)}</b></div>}
    </div>
  )
}

export default function Snoepruilen() {
  return (
    <SpelKader titel="Snoepjes ruilen" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <RuilScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function RuilScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RuilNiveau>(() => gekozenNiveau(kind.id, 'snoepruilen', startRuilNiveau(kind, kinderen), Object.keys(ruilNiveaus)))
  const [spel, setSpel] = useState<RuilSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const [toon, setToon] = useState<Bord>(spel.bord)
  const [weg, setWeg] = useState<number[]>([])
  const [bezig, setBezig] = useState(false)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [hint, setHint] = useState<[number, number] | null>(null)
  const [tipsOver, setTipsOver] = useState(() => ruilNiveaus[niveau].tips)
  const [feest, setFeest] = useState(false)
  const [mislukt, setMislukt] = useState(false)
  const [begin, setBegin] = useState(() => Date.now())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const raak = useRef<{ i: number; x: number; y: number } | null>(null)
  const lezer = kind.kan_lezen
  const n = ruilNiveaus[niveau]
  const bordMaat = ruilBord[niveau]
  const rd = ruilRondes[niveau][Math.min(spel.ronde, ruilRondes[niveau].length - 1)]
  const af = spel.klaar

  function bewaar(na: RuilSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.snoepruilenUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Makkelijk: na tien seconden zonder zet wiebelen twee snoepjes die je kan ruilen.
  useEffect(() => {
    setHint(null)
    if (!n.hulp || af || feest || bezig) return
    const t = setTimeout(() => setHint(tip(spelRef.current)), 10000)
    return () => clearTimeout(t)
  }, [n.hulp, af, feest, bezig, spel.zetten, spel.ronde])

  function opnieuw(nv: RuilNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    const s = nieuwSpel(nv, rand)
    bewaar(s); setToon(s.bord); setWeg([]); setBezig(false); setGekozen(null); setHint(null)
    setTipsOver(ruilNiveaus[nv].tips); setFeest(false); setMislukt(false); setBegin(Date.now())
  }
  function kiesNiveau(nv: RuilNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'snoepruilen', nv); opnieuw(nv) }

  /** Speelt de tussenstanden af: de rijen lichten op en verdwijnen, dan vallen de snoepjes. */
  function speelAf(stadia: Stadium[], daarna: () => void) {
    let t = 0
    for (const st of stadia) {
      wacht(t, () => { setToon(st.zonder); setWeg(st.weg); geluid.paar() })
      t += 380
      wacht(t, () => { setToon(st.na); setWeg([]) })
      t += 320
    }
    wacht(t, daarna)
  }

  function ruilen(a: number, c: number) {
    if (bezig || feest || mislukt) return
    const voor = spelRef.current
    const u = doeRuil(voor, a, c, rand)
    setGekozen(null); setHint(null)
    if (!u.gelukt) {
      // Geen rij: de twee snoepjes wisselen even en gaan terug.
      const w = { ...voor.bord, vak: voor.bord.vak.slice() }
      ;[w.vak[a], w.vak[c]] = [w.vak[c], w.vak[a]]
      setBezig(true); geluid.oei(); setToon(w)
      wacht(260, () => { setToon(voor.bord); setBezig(false) })
      return
    }
    setBezig(true)
    bewaar(u.spel)
    speelAf(u.stadia, () => {
      setToon(u.spel.bord); setBezig(false)
      if (u.rondeKlaar) rondeGehaald()
      else if (u.teKort) { setMislukt(true); geluid.oei() }
    })
  }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    wacht(1800, () => {
      const vol = volgende(spelRef.current, rand)
      bewaar(vol); setToon(vol.bord); setFeest(false)
      if (vol.klaar) {
        if (!lezer) wacht(400, () => leesVoor(zin.snoepruilenKlaar))
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'snoepruilen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function nogEens() {
    const s = opnieuwRonde(spelRef.current, rand, true)
    bewaar(s); setToon(s.bord); setMislukt(false); setGekozen(null)
  }

  function tikken(i: number) {
    if (bezig || feest || mislukt) return
    if (gekozen === null) { setGekozen(i); return }
    if (gekozen === i) { setGekozen(null); return }
    const b = spelRef.current.bord
    const dichtbij = Math.abs(gekozen - i) === b.kol || (Math.abs(gekozen - i) === 1 && Math.floor(gekozen / b.kol) === Math.floor(i / b.kol))
    if (dichtbij) ruilen(gekozen, i); else setGekozen(i)
  }
  // Veeg naar een buur of tik twee buren na elkaar.
  function neer(e: React.PointerEvent, i: number) { raak.current = { i, x: e.clientX, y: e.clientY } }
  function los(e: React.PointerEvent, i: number) {
    const t = raak.current; raak.current = null
    if (!t || t.i !== i) return
    const dx = e.clientX - t.x, dy = e.clientY - t.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return
    const b = spelRef.current.bord, r = Math.floor(i / b.kol), c = i % b.kol
    const doel = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? (c < b.kol - 1 ? i + 1 : -1) : (c > 0 ? i - 1 : -1)) : (dy > 0 ? (r < b.rijen - 1 ? i + b.kol : -1) : (r > 0 ? i - b.kol : -1))
    if (doel >= 0) { e.preventDefault(); ruilen(i, doel) }
  }

  function tipKnop() {
    if (bezig || feest || mislukt || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); setHint(tip(spelRef.current))
    wacht(2500, () => setHint(null))
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = ruilRondes[niveau].length * 3

  return (
    <div className={`ruil ruil-${niveau}`}>
      <Chips label="Niveau" opties={ruilNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="ruil-eind">
          <svg className="ruil-feest" viewBox="0 0 100 100" aria-hidden="true">
            <g transform="translate(-4 14) scale(.55)"><Snoep soort={0} /></g><g transform="translate(26 -4) scale(.6)"><Snoep soort={2} /></g>
            <g transform="translate(56 14) scale(.55)"><Snoep soort={5} /></g><g transform="translate(14 42) scale(.6)"><Snoep soort={4} /></g>
            <g transform="translate(46 44) scale(.6)"><Snoep soort={1} /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Wat een lekker feest!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="ruil-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="ruil-balk">
            <div className="ruil-teller" aria-label={`Ronde ${spel.ronde + 1} van ${ruilRondes[niveau].length}`}>
              {ruilRondes[niveau].map((_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <Doelen doel={rd.doel} spel={spel} />
            {rd.zetten > 0 && <div className={`ruil-zetten${spel.zettenOver <= 3 ? ' laag' : ''}`} aria-label={`${spel.zettenOver} zetten over`}>↔ {spel.zettenOver}</div>}
          </div>
          <div className="ruil-veld">
            <div className={`ruil-tafel${feest ? ' klaar' : ''}`} style={{ ['--rijen' as string]: bordMaat.rijen, ['--kol' as string]: bordMaat.kol }}>
              <div className="ruil-rooster">
                {toon.vak.map((_, i) => (
                  <Vak key={i} bord={toon} i={i} weg={weg.includes(i)} kies={gekozen === i} hint={!!hint && (hint[0] === i || hint[1] === i)} zwaai={feest}
                       tik={() => tikken(i)} neer={(e) => neer(e, i)} los={(e) => los(e, i)} />
                ))}
              </div>
              {mislukt && (
                <div className="ruil-mislukt">
                  <div className="display">{lezer ? 'Bijna! Nog eens proberen?' : 'Bijna!'}</div>
                  <button type="button" className="groot-knop" onClick={nogEens}>↻ Nog eens</button>
                </div>
              )}
            </div>
            <div className="ruil-zij">
              <button type="button" className="groot-knop ruil-actie" onClick={() => { setMislukt(false); const s = opnieuwRonde(spelRef.current, rand, false); bewaar(s); setToon(s.bord); setGekozen(null) }} disabled={bezig || feest}>⟲ <span>Opnieuw</span></button>
              {n.tips > 0 && <button type="button" className="groot-knop ruil-actie" onClick={tipKnop} disabled={bezig || feest || mislukt || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
