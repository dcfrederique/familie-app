import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { schuifNiveaus, schuifPrenten, schuifRondesAantal, type SchuifNiveau } from '../data/schuif.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { isKlaar, kanSchuiven, nieuwSpel, opnieuwRonde, rondeKlaar, schuif, volgende, type SchuifSpel } from '../lib/spelletjes/schuif.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './schuif.css'

export default function Schuif() {
  return (
    <SpelKader titel="Schuifpuzzel" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <SchuifScherm kind={kind} />}
    </SpelKader>
  )
}

function SchuifScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SchuifNiveau>(() =>
    gekozenNiveau(kind.id, 'schuif', startDrieNiveau(kind, kinderen), Object.keys(schuifNiveaus)))
  const [spel, setSpel] = useState<SchuifSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = schuifNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: SchuifSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.schuifUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: SchuifNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false)
  }
  function kiesNiveau(nv: SchuifNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'schuif', nv); opnieuw(nv) }

  function druk(i: number) {
    if (feest || af) return
    const s = spelRef.current
    if (!kanSchuiven(s, i)) { geluid.draai(); return }
    const na = schuif(s, i)
    bewaar(na); geluid.toon(600)
    if (!rondeKlaar(na)) return
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.schuifKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'schuif', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1900)
  }

  if (af) {
    return (
      <div className="sf">
        <Chips label="Niveau" opties={schuifNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <div className="sf-galerij" aria-hidden="true">
            {schuifPrenten.slice(0, schuifRondesAantal).map((p) => <svg key={p.naam} viewBox="0 0 300 300" dangerouslySetInnerHTML={{ __html: p.svg }} />)}
          </div>
          <div className="hoera display">{lezer ? 'Alle prenten kloppen weer!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={schuifRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const prent = schuifPrenten[spel.ronde % schuifPrenten.length]
  const m = spel.maat, d = 300 / m
  const lg = m * m - 1
  return (
    <div className="sf">
      <Chips label="Niveau" opties={schuifNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="sf-spel">
        <div className="sf-plek">
          <div className={`sf-bord${feest ? ' viert' : ''}`} style={{ '--m': m } as React.CSSProperties} role="grid" aria-label={`Schuifpuzzel: ${prent.naam}`}>
            {spel.vak.map((stuk, plek) => ({ stuk, plek })).sort((a, b) => a.stuk - b.stuk).map(({ stuk, plek }) => (
              stuk === lg && !feest ? null : (
                <button key={stuk} type="button" role="gridcell" className={`sf-stuk${kanSchuiven(spel, plek) && !feest ? ' kan' : ''}`}
                        style={{ '--x': plek % m, '--y': Math.floor(plek / m) } as React.CSSProperties}
                        aria-label={`Stukje ${stuk + 1}`} onClick={() => druk(plek)}>
                  <svg viewBox={`${(stuk % m) * d} ${Math.floor(stuk / m) * d} ${d} ${d}`} preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: prent.svg }} />
                  {n.cijfers && !feest && <span className="sf-cijfer">{stuk + 1}</span>}
                </button>
              )
            ))}
          </div>
        </div>
        <div className="sf-zij">
          <RondeTeller ronde={spel.ronde} aantal={schuifRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {n.voorbeeld && <svg className="sf-voorbeeld" viewBox="0 0 300 300" aria-label="Zo moet het worden" dangerouslySetInnerHTML={{ __html: prent.svg }} />}
          <div className="sf-zetten">↔ <b>{spel.zetten}</b></div>
          <button type="button" className="groot-knop licht rk-knop" disabled={feest} onClick={() => bewaar(opnieuwRonde(spelRef.current))}>
            ⟲ {lezer && <span>Opnieuw</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
