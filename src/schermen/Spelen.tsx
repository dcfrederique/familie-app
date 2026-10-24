import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { inAanbod, leegAanbod, metPrijs } from '../data/aanbod.ts'
import { bezitSleutel } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { spelIsVrij, spelMenu, spelPrijs, type SpelInfo } from '../data/spelletjes.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { spelGeopend, spelOpenen } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import KoopVraag from './KoopVraag.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaNieuw, ThemaSlot, ThemaVoortgang, useThema } from './ThemaDelen.tsx'
import { zin } from '../data/zinnen.ts'
import Bladzijden from './Bladzijden.tsx'

// Hoogte gedeeld door breedte van een tegel per thema (kasteel: wimpel erboven, tuin: paddenstoel met steel).
const VERHOUDING = { race: 1, kasteel: 1.3, tuin: 1.2 }

const SLOT = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'

// Kiezen wat je speelt. Rekenen levert sterren op, de andere spelletjes zijn gewoon voor de fun.
// Nieuwe spelletjes koopt het kind zelf met sterren (docs/winkel.md); die gaan van het saldo af.
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
  const { data, ververs } = useGegevens(bron ? async () => {
    const [aankopen, saldi, aanbod] = await Promise.all([bron.aankopen(), bron.saldi(), bron.aanbod()])
    return { eigen: new Set(aankopen[kind.id] ?? []), vrij: saldi[kind.id]?.vrij ?? 0, aanbod }
  } : null, [bron, kind.id])
  const [tip, setTip] = useState<{ sleutel: string; tekst: string } | null>(null)
  const [koop, setKoop] = useState<SpelInfo | null>(null)
  const tipKlok = useRef(0)
  useEffect(() => () => window.clearTimeout(tipKlok.current), [])

  const v = { eigen: data?.eigen ?? new Set<string>(), allesVrij: kind.figuurtje_alles_vrij, kanLezen: kind.kan_lezen }
  const vrij = data?.vrij ?? 0
  // Wat de ouders niet in de winkel legden of voor dit kind verbergen, staat er niet (docs/winkelaanbod.md).
  const aanbod = data?.aanbod ?? leegAanbod
  const spellen = spelMenu.map((s) => metPrijs(aanbod, 'spel', s.sleutel, s)).filter((s) => {
    const sleutel = bezitSleutel('spel', s.sleutel)
    return inAanbod(aanbod, kind.id, sleutel, v.eigen.has(sleutel))
  })

  function opSlot(s: SpelInfo, prijs: number) {
    if (!data) return
    if (vrij >= prijs) return setKoop(s)
    geluid.oei()
    const nog = prijs - vrij
    const tekst = kind.kan_lezen
      ? `Nog ${nog} ${nog === 1 ? 'ster' : 'sterren'} sparen, dan kun je ${s.naam} kopen.`
      : zin.sparen
    if (!kind.kan_lezen) leesVoor(tekst)
    setTip({ sleutel: s.sleutel, tekst })
    window.clearTimeout(tipKlok.current)
    tipKlok.current = window.setTimeout(() => setTip(null), 2600)
  }

  const icoon = (s: SpelInfo, maat: number) => (
    <svg className="ic" viewBox="0 0 24 24" width={maat} height={maat} aria-hidden="true"><path d={s.icoon} /></svg>
  )

  return (
    <>
      {data && spellen.some((s) => !spelIsVrij(s, v)) && (
        <p className="spel-saldo" aria-live="polite"><SterrenPil aantal={vrij} metWoord={kind.kan_lezen} /></p>
      )}
      <Bladzijden items={spellen} maat={{ breed: 170, hoog: 190, gap: 24, verhouding: thema ? VERHOUDING[thema] : 1 }} className="spel-menu" label="Meer spelletjes" toon={(s) => {
          const i = spellen.indexOf(s)
          const prijs = spelPrijs(s, v)
          // Zolang de aankopen niet geladen zijn, staat wat iets kost nog op slot.
          const dicht = !spelIsVrij(s, v)
          const tegel = (
            <span className="spel-tegel">
              {icoon(s, 56)}
              {dicht && thema && <ThemaSlot thema={thema} />}
              {dicht && !thema && (
                <span className="spel-slot" aria-hidden="true">
                  <svg className="ic" viewBox="0 0 24 24" width="26" height="26"><path d={SLOT} /></svg>
                </span>
              )}
              {thema === 'race' && <span className="spel-nr display" aria-hidden="true">{i + 1}</span>}
            </span>
          )
          if (dicht) {
            const deel = Math.min(1, vrij / prijs)
            return (
              <button key={s.sleutel} type="button" className={`spel-knop op-slot${vrij >= prijs ? ' te-koop' : ''}`}
                      aria-label={`${s.naam}, kost ${prijs} sterren`} onClick={() => opSlot(s, prijs)}>
                {tegel}
                <span className="display spel-naam">{s.naam}</span>
                {thema ? <ThemaVoortgang thema={thema} deel={deel} label={`${Math.min(vrij, prijs)} van ${prijs} sterren`} /> : (
                  <span className="spel-balk" role="img" aria-label={`${Math.min(vrij, prijs)} van ${prijs} sterren`}>
                    <span style={{ width: `${Math.round(deel * 100)}%` }} />
                  </span>
                )}
                <span className="spel-uitleg spel-prijs"><Ster grootte={18} /> {prijs}{kind.kan_lezen && vrij >= prijs ? ' · kopen' : ''}</span>
                {tip?.sleutel === s.sleutel && <span className="spel-tip" role="status">{tip.tekst}</span>}
              </button>
            )
          }
          const nieuw = s.prijs > 0 && !v.allesVrij && !spelGeopend(kind.id, s.sleutel)
          return (
            <Link key={s.sleutel} to={`/kind/${kind.id}/${s.sleutel}`} className="spel-knop" aria-label={s.naam}
                  onClick={() => spelOpenen(kind.id, s.sleutel)}>
              {tegel}
              <span className="display spel-naam">{s.naam}</span>
              {kind.kan_lezen && <span className="spel-uitleg">{s.uitleg}</span>}
              {nieuw && (thema ? <ThemaNieuw thema={thema} /> : <span className="spel-nieuw display">Nieuw!</span>)}
            </Link>
          )
        }} />
      {koop && bron && (
        <KoopVraag kind={kind} naam={koop.naam} prijs={spelPrijs(koop, v)} vrij={vrij} prent={icoon(koop, 110)}
                   koop={async () => { await bron.kopen(kind.id, 'spel', koop.sleutel, koop.naam); await ververs() }}
                   sluit={() => setKoop(null)} />
      )}
    </>
  )
}
