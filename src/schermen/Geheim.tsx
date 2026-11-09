import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { geheimNiveaus, geheimRondes, type GeheimNiveau } from '../data/geheim.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { controleer, hoort, isKlaar, klopt, nieuwSpel, rondeKlaar, tik, volgende, wis, type GeheimSpel } from '../lib/spelletjes/geheim.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './geheim.css'

export default function Geheim() {
  return (
    <SpelKader titel="Geheime prent" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <GeheimScherm kind={kind} />}
    </SpelKader>
  )
}

function GeheimScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<GeheimNiveau>(() =>
    gekozenNiveau(kind.id, 'geheim', startDrieNiveau(kind, kinderen), Object.keys(geheimNiveaus)))
  const [spel, setSpel] = useState<GeheimSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [stand, setStand] = useState<'kleur' | 'kruis'>('kleur')
  const [fout, setFout] = useState<string | null>(null)
  const [melding, setMelding] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = geheimNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: GeheimSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.geheimUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: GeheimNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setStand('kleur'); setMelding('')
  }
  function kiesNiveau(nv: GeheimNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'geheim', nv); opnieuw(nv) }

  function haalde() {
    setFeest(true); setMelding(''); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setStand('kleur')
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.geheimKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'geheim', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 2200)
  }

  function druk(r: number, c: number) {
    if (feest || af) return
    const { spel: na, fout: mis } = tik(spelRef.current, r, c, stand)
    if (mis) { geluid.oei(); setFout(`${r},${c}`); setTimeout(() => setFout(null), 500); return }
    bewaar(na); setMelding('')
    geluid.toon(na.vak[r][c] === 1 ? 660 : 440)
    if (rondeKlaar(na)) haalde()
  }
  function controleerKnop() {
    if (feest) return
    const c = controleer(spelRef.current)
    bewaar(c.spel)
    if (c.klaar) { haalde(); return }
    geluid.oei()
    setMelding(`${c.nogNiet} ${c.nogNiet === 1 ? 'rij of kolom klopt' : 'rijen en kolommen kloppen'} nog niet`)
  }

  if (af) {
    return (
      <div className="gh">
        <Chips label="Niveau" opties={geheimNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <div className="gh-galerij" aria-hidden="true">
            {spel.reeks.map((p) => (
              <div key={p.naam} className="gh-mini" style={{ '--b': p.vakken[0].length } as React.CSSProperties}>
                {p.vakken.join('').split('').map((v, i) => <span key={i} style={v === '#' ? { background: p.kleur } : undefined} />)}
              </div>
            ))}
          </div>
          <div className="hoera display">{lezer ? 'Alle geheime prenten gevonden!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={geheimRondes * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const hoog = spel.vak.length, breed = spel.vak[0].length
  const kc = Math.max(...spel.kolomCijfers.map((k) => k.length))
  const kr = Math.max(...spel.rijCijfers.map((k) => k.length))
  const k = n.live ? null : klopt(spel)
  return (
    <div className="gh">
      <Chips label="Niveau" opties={geheimNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="gh-spel">
        <div className="gh-plek">
          <div className={`gh-rooster${feest ? ' viert' : ''}`} role="grid" aria-label="Het geheime prentje"
               style={{ '--b': breed, '--h': hoog, '--kc': kc, '--kr': kr, '--prent': spel.prent.kleur } as React.CSSProperties}>
            <div className="gh-hoek" />
            {spel.kolomCijfers.map((cs, c) => (
              <div key={`k${c}`} className={`gh-kc${k?.kolommen[c] ? ' ok' : ''}`}>{cs.map((x, i) => <span key={i}>{x}</span>)}</div>
            ))}
            {spel.vak.map((rij, r) => [
              <div key={`r${r}`} className={`gh-rc${k?.rijen[r] ? ' ok' : ''}`}>{spel.rijCijfers[r].map((x, i) => <span key={i}>{x}</span>)}</div>,
              ...rij.map((v, c) => (
                <button key={`${r}-${c}`} type="button" role="gridcell"
                        className={`gh-vak${v === 1 ? ' aan' : ''}${v === 2 ? ' kruis' : ''}${n.schaduw && hoort(spel, r, c) ? ' schaduw' : ''}${fout === `${r},${c}` ? ' fout' : ''}${c % 5 === 4 && c < breed - 1 ? ' vijf-r' : ''}${r % 5 === 4 && r < hoog - 1 ? ' vijf-o' : ''}`}
                        aria-label={v === 1 ? 'Gekleurd' : v === 2 ? 'Kruisje' : 'Leeg'} onClick={() => druk(r, c)} />
              )),
            ])}
          </div>
        </div>
        <div className="gh-zij">
          <RondeTeller ronde={spel.ronde} aantal={geheimRondes} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {feest && lezer && <div className="gh-naam">Een {spel.prent.naam}!</div>}
          {n.kruisjes && (
            <div className="gh-stand" role="group" aria-label="Wat doet een tik?">
              <button type="button" className={`gh-standknop${stand === 'kleur' ? ' gekozen' : ''}`} aria-pressed={stand === 'kleur'} onClick={() => setStand('kleur')}>
                <span className="gh-blokje" /> {lezer && 'Kleuren'}
              </button>
              <button type="button" className={`gh-standknop${stand === 'kruis' ? ' gekozen' : ''}`} aria-pressed={stand === 'kruis'} onClick={() => setStand('kruis')}>
                ✕ {lezer && 'Kruisje'}
              </button>
            </div>
          )}
          {!n.live && <button type="button" className="groot-knop rk-knop" disabled={feest} onClick={controleerKnop}>✓ {lezer && <span>Controleer</span>}</button>}
          <button type="button" className="groot-knop licht rk-knop" disabled={feest} onClick={() => { bewaar(wis(spelRef.current)); setMelding('') }}>
            ⟲ {lezer && <span>Opnieuw</span>}
          </button>
          <div className="gh-melding" role="status">{melding}</div>
        </div>
      </div>
    </div>
  )
}
