import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { vlekKleuren, vlekNiveaus, vlekRondesAantal, type VlekNiveau } from '../data/vlek.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { isKlaar, kies, nieuwSpel, op, opnieuwRonde, rondeKlaar, vlek, volgende, type VlekSpel } from '../lib/spelletjes/vlek.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './vlek.css'

export default function Vlek() {
  return (
    <SpelKader titel="Verflopen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <VlekScherm kind={kind} />}
    </SpelKader>
  )
}

function VlekScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<VlekNiveau>(() =>
    gekozenNiveau(kind.id, 'vlek', startDrieNiveau(kind, kinderen), Object.keys(vlekNiveaus)))
  const [spel, setSpel] = useState<VlekSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = vlekNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: VlekSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.vlekUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: VlekNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false)
  }
  function kiesNiveau(nv: VlekNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'vlek', nv); opnieuw(nv) }

  function verf(k: number) {
    if (feest || af) return
    const s = spelRef.current
    const na = kies(s, k)
    if (na === s) return
    bewaar(na); geluid.toon(440 + k * 60)
    if (op(na)) { geluid.oei(); return }
    if (!rondeKlaar(na)) return
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.vlekKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'vlek', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1600)
  }

  if (af) {
    return (
      <div className="vl">
        <Chips label="Niveau" opties={vlekNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 90" className="vl-eindprent" aria-hidden="true">
            {vlekKleuren.slice(0, 5).map((k, i) => <circle key={k.naam} cx={30 + i * 25} cy={45 + (i % 2 ? 10 : -10)} r="20" fill={k.kleur} opacity=".9" />)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle bladen zijn geverfd!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={vlekRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const mijn = vlek(spel.vak, spel.breed, spel.hoog)
  const isOp = op(spel)
  return (
    <div className="vl">
      <Chips label="Niveau" opties={vlekNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="vl-spel">
        <div className="vl-plek">
          <div className={`vl-blad${feest ? ' viert' : ''}`} style={{ '--kol': spel.breed, '--rij': spel.hoog } as React.CSSProperties} aria-label="Het blad">
            {spel.vak.map((k, i) => (
              <span key={i} className={`vl-vak${mijn.has(i) ? ' mijn' : ''}`} style={{ background: vlekKleuren[k].kleur }} />
            ))}
          </div>
        </div>
        <div className="vl-zij">
          <RondeTeller ronde={spel.ronde} aantal={vlekRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          <div className="vl-beurten" aria-label={`${spel.beurten} beurten${spel.max !== null ? ` van ${spel.max}` : ''}`}>
            🖌 <b>{spel.beurten}</b>{spel.max !== null && <> / {spel.max}</>}
          </div>
          <div className="vl-potten" role="group" aria-label="Kies een kleur">
            {vlekKleuren.slice(0, spel.kleuren).map((k, i) => (
              <button key={k.naam} type="button" className={`vl-pot${spel.vak[0] === i ? ' nu' : ''}`} style={{ background: k.kleur }}
                      aria-label={k.naam} disabled={feest || isOp || spel.vak[0] === i} onClick={() => verf(i)}>
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d={k.vorm} fill="#fff" opacity=".85" /></svg>
              </button>
            ))}
          </div>
          {isOp && <div className="vl-op" role="status">{lezer ? 'Geen beurten meer. Probeer opnieuw!' : '🖌 ✕'}</div>}
          <button type="button" className={`groot-knop rk-knop${isOp ? '' : ' licht'}`} disabled={feest} onClick={() => bewaar(opnieuwRonde(spelRef.current))}>
            ⟲ {lezer && <span>Opnieuw</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
