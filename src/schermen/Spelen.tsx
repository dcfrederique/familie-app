import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { nogTeVerdienen, spelDrempel, spelMenu, type SpelInfo } from '../data/spelletjes.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { spelGeopend, spelOpenen } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaNieuw, ThemaSlot, ThemaVoortgang, useThema } from './ThemaDelen.tsx'
import { zin } from '../data/zinnen.ts'

const SLOT = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'

// Kiezen wat je speelt. Rekenen levert sterren op, de andere spelletjes zijn gewoon voor de fun.
// Nieuwe spelletjes gaan open met ooit verdiende sterren (docs/spelletjes.md); het saldo blijft hetzelfde.
export default function Spelen() {
  return (
    <SpelKader titel="Spelen" scherm="spelen" terug={(id) => `/kind/${id}`}>
      {(kind) => <SpelMenu kind={kind} />}
    </SpelKader>
  )
}

function SpelMenu({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const thema = useThema()
  const { data: verdiendPerKind } = useGegevens(bron ? () => bron.verdiend() : null, [bron])
  const [tip, setTip] = useState<{ sleutel: string; tekst: string } | null>(null)
  const tipKlok = useRef(0)
  useEffect(() => () => window.clearTimeout(tipKlok.current), [])

  const geladen = verdiendPerKind !== null
  const v = { verdiend: verdiendPerKind?.[kind.id] ?? 0, allesVrij: kind.figuurtje_alles_vrij, kanLezen: kind.kan_lezen }

  function opSlot(s: SpelInfo, nog: number) {
    geluid.oei()
    const tekst = kind.kan_lezen
      ? `Nog ${nog} ${nog === 1 ? 'ster' : 'sterren'} verdienen, dan is ${s.naam} van jou.`
      : zin.sparen
    if (!kind.kan_lezen) leesVoor(tekst)
    setTip({ sleutel: s.sleutel, tekst })
    window.clearTimeout(tipKlok.current)
    tipKlok.current = window.setTimeout(() => setTip(null), 2600)
  }

  return (
    <div className="spel-menu">
      {spelMenu.map((s, i) => {
        const drempel = spelDrempel(s, v)
        // Zolang de sterren niet geladen zijn, staat wat een drempel heeft nog op slot.
        const nog = geladen ? nogTeVerdienen(s, v) : drempel
        const tegel = (
          <span className="spel-tegel">
            <svg className="ic" viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><path d={s.icoon} /></svg>
            {nog > 0 && thema && <ThemaSlot thema={thema} />}
            {nog > 0 && !thema && (
              <span className="spel-slot" aria-hidden="true">
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26"><path d={SLOT} /></svg>
              </span>
            )}
            {thema === 'race' && <span className="spel-nr display" aria-hidden="true">{i + 1}</span>}
          </span>
        )
        if (nog > 0) {
          return (
            <button key={s.sleutel} type="button" className="spel-knop op-slot" aria-label={`${s.naam}, op slot`}
                    onClick={() => opSlot(s, nog)}>
              {tegel}
              <span className="display spel-naam">{s.naam}</span>
              {thema ? <ThemaVoortgang thema={thema} deel={(drempel - nog) / drempel} label={`${drempel - nog} van ${drempel} sterren`} /> : (
                <span className="spel-balk" role="img" aria-label={`${drempel - nog} van ${drempel} sterren`}>
                  <span style={{ width: `${Math.round(((drempel - nog) / drempel) * 100)}%` }} />
                </span>
              )}
              {kind.kan_lezen && <span className="spel-uitleg"><Ster grootte={18} /> nog {nog}</span>}
              {tip?.sleutel === s.sleutel && <span className="spel-tip" role="status">{tip.tekst}</span>}
            </button>
          )
        }
        const nieuw = s.drempel > 0 && !v.allesVrij && !spelGeopend(kind.id, s.sleutel)
        return (
          <Link key={s.sleutel} to={`/kind/${kind.id}/${s.sleutel}`} className="spel-knop" aria-label={s.naam}
                onClick={() => spelOpenen(kind.id, s.sleutel)}>
            {tegel}
            <span className="display spel-naam">{s.naam}</span>
            {kind.kan_lezen && <span className="spel-uitleg">{s.uitleg}</span>}
            {nieuw && (thema ? <ThemaNieuw thema={thema} /> : <span className="spel-nieuw display">Nieuw!</span>)}
          </Link>
        )
      })}
    </div>
  )
}
