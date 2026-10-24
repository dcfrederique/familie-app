import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Banner } from '../data/banners.tsx'
import {
  categorie, figuurtjeVan, haarKleuren, huidKleuren, isVrij, kledingKleuren, verrassing, zichtbareStukken,
  type Figuurtje as FiguurtjeData, type Vrijspelen,
} from '../data/figuurtje.ts'
import type { Gebruiker, Kleur } from '../data/gezin.ts'
import { bannerVoorKleur, themaKeuzes } from '../data/thema.ts'
import { zin } from '../data/zinnen.ts'
import { dagenInMaand, leeftijd, nachtjesTotVerjaardag } from '../lib/datum.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Figuurtje from './Figuurtje.tsx'
import { Ster } from './onderdelen.tsx'
import './figuurtje.css'
import './schermen.css'
import './welkom.css'

// Welkomstpad, de eerste keer dat een kind zijn tablet opent (docs/tablet-per-kind.md):
// hoi, figuurtje maken, verjaardag, thema kiezen en dan feest met de welkomstbonus.
// Pas op het einde wordt alles bewaard (welkom_afronden), zodat half afgebroken niets telt.

type Stap = 'hoi' | 'figuurtje' | 'jarig' | 'thema' | 'feest'
const stappen: Stap[] = ['hoi', 'figuurtje', 'jarig', 'thema', 'feest']

const maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober',
  'november', 'december']

const pijl = (d: string, grootte = 34) => (
  <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true"><path d={d} /></svg>
)
const VERDER = 'M5 12h14M13 6l6 6l-6 6'
const TERUG = 'M19 12H5M11 6l-6 6l6 6'

export default function Welkomstpad() {
  const { id } = useParams()
  const { kinderen } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  if (!kind) return <Navigate to="/kinderen" replace />
  return <Pad kind={kind} />
}

function Pad({ kind }: { kind: Gebruiker }) {
  const navigate = useNavigate()
  const { bron, herlaad } = useSessie()
  const lezer = kind.kan_lezen
  const [stap, setStap] = useState<Stap>('hoi')
  const [figuurtje, setFiguurtje] = useState<FiguurtjeData>(() => figuurtjeVan(kind))
  const [verjaardag, setVerjaardag] = useState<string | null>(kind.geboortedatum)
  const [thema, setThema] = useState<Kleur>(kind.thema ?? 'blauw')
  const [bewaren, setBewaren] = useState<{ status: 'bezig' } | { status: 'klaar'; bonus: number } | { status: 'fout'; tekst: string }>(
    { status: 'bezig' })

  useEffect(() => { gebruikStem(kind.voorleesstem) }, [kind.voorleesstem])
  const uitleg: Record<Stap, string> = {
    hoi: `Hoi ${kind.naam}! Welkom in je eigen app.`,
    figuurtje: zin.welkomFiguur,
    jarig: zin.welkomJarig,
    thema: zin.welkomThema,
    feest: zin.welkomFeest,
  }

  function ga(naar: Stap) {
    setStap(naar)
    // Wie niet leest hoort bij elke stap wat er moet gebeuren (na een tik, dus het geluid mag).
    if (!lezer && naar !== 'feest') leesVoor(uitleg[naar])
  }

  async function bewaar() {
    if (!bron) return
    setBewaren({ status: 'bezig' })
    try {
      const bonus = await bron.welkomAfronden(kind.id, { figuurtje, geboortedatum: verjaardag, thema })
      setBewaren({ status: 'klaar', bonus })
      if (!lezer && bonus > 0) leesVoor(zin.welkomFeest)
    } catch (e) {
      setBewaren({ status: 'fout', tekst: foutmelding(e as Error) })
    }
  }

  function naarFeest() {
    setStap('feest')
    void bewaar()
  }

  async function naarStart() {
    await herlaad()
    navigate(`/kind/${kind.id}`, { replace: true })
  }

  const nr = stappen.indexOf(stap)
  const vorige = nr > 0 && stap !== 'feest' ? stappen[nr - 1] : null
  const volgende = stap === 'thema' ? naarFeest : () => ga(stappen[nr + 1])

  return (
    <div className={`kind kleur-${thema} welkom-pad${lezer ? '' : ' prenten'}`}>
      <header className="welkom-kop">
        {!lezer && kanVoorlezen() && stap !== 'feest' ? (
          <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(uitleg[stap])}>
            <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
          </button>
        ) : <span className="welkom-kop-plek" />}
        <ol className="welkom-stappen" aria-label={`Stap ${Math.min(nr + 1, 4)} van 4`}>
          {stappen.slice(0, 4).map((s, i) => (
            <li key={s} className={i < nr ? 'gedaan' : i === nr ? 'nu' : ''}>
              {i < nr ? <Ster grootte={26} /> : null}
            </li>
          ))}
        </ol>
        <span className="welkom-kop-plek" />
      </header>

      <main className="welkom-inhoud" key={stap}>
        {stap === 'hoi' && <Hoi kind={kind} figuurtje={figuurtje} />}
        {stap === 'figuurtje' && <FiguurtjeMaken kind={kind} figuurtje={figuurtje} wijzig={setFiguurtje} />}
        {stap === 'jarig' && <Jarig kind={kind} verjaardag={verjaardag} kies={setVerjaardag} />}
        {stap === 'thema' && <ThemaKiezen lezer={lezer} thema={thema} kies={(t) => { setThema(t); if (!lezer) leesVoor(themaKeuzes.find((k) => k.kleur === t)!.naam) }} />}
        {stap === 'feest' && <Feest kind={kind} figuurtje={figuurtje} bewaren={bewaren} />}
      </main>

      <footer className="welkom-voet">
        {stap === 'feest' ? (
          bewaren.status === 'fout'
            ? <button type="button" className="welkom-knop verder" onClick={bewaar}>Opnieuw proberen</button>
            : <button type="button" className="welkom-knop verder" disabled={bewaren.status === 'bezig'} onClick={naarStart}
                      aria-label="Naar mijn startscherm">
                {lezer ? 'Naar mijn startscherm' : null}{pijl(VERDER, 40)}
              </button>
        ) : (
          <>
            {vorige
              ? <button type="button" className="welkom-knop terug" aria-label="Terug" onClick={() => ga(vorige)}>
                  {pijl(TERUG)}{lezer ? 'Terug' : null}
                </button>
              : <span />}
            {stap === 'jarig' && (
              <button type="button" className="welkom-knop overslaan" onClick={() => { setVerjaardag(kind.geboortedatum); volgende() }}>
                {lezer ? 'Weet ik niet' : '?'}
              </button>
            )}
            <button type="button" className="welkom-knop verder" aria-label={stap === 'hoi' ? 'Starten' : 'Verder'} onClick={volgende}>
              {lezer ? (stap === 'hoi' ? 'Starten' : 'Verder') : null}{pijl(VERDER, 40)}
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

/** Glinsterende sterretjes rond het figuurtje. */
function Fonkel() {
  const plekken = [[8, 18], [86, 10], [14, 70], [90, 62], [50, 4], [72, 86], [24, 40], [78, 36]]
  return (
    <span className="fonkel" aria-hidden="true">
      {plekken.map(([x, y], i) => (
        <span key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.27}s` } as CSSProperties}>
          <Ster grootte={i % 3 === 0 ? 34 : 24} />
        </span>
      ))}
    </span>
  )
}

function Hoi({ kind, figuurtje }: { kind: Gebruiker; figuurtje: FiguurtjeData }) {
  return (
    <div className="welkom-hoi">
      <div className="welkom-podium">
        <Fonkel />
        <Figuurtje figuurtje={figuurtje} className="welkom-figuur zwaai" label={`Figuurtje van ${kind.naam}`} />
      </div>
      <div className="welkom-tekst">
        <h1 className="display">Hoi {kind.naam}!</h1>
        {kind.kan_lezen
          ? <p>Welkom in jouw eigen app. Eerst maken we samen jouw figuurtje, dan kies je jouw kleur. En daarna wacht er een verrassing!</p>
          : <p className="welkom-prent-uitleg" aria-hidden="true"><Ster grootte={48} /><Ster grootte={56} /><Ster grootte={48} /></p>}
      </div>
    </div>
  )
}

function FiguurtjeMaken({ kind, figuurtje, wijzig }: {
  kind: Gebruiker; figuurtje: FiguurtjeData; wijzig: (f: FiguurtjeData) => void
}) {
  const lezer = kind.kan_lezen
  const [huppel, setHuppel] = useState(0)
  // Bij de start is er nog niets verdiend: alleen de basisstukken.
  const v: Vrijspelen = { verdiend: 0, allesVrij: kind.figuurtje_alles_vrij, kanLezen: lezer }
  const haar = categorie('haar')
  const kapsels = zichtbareStukken(haar, lezer).filter((s) => isVrij(s, v))
  const zet = (veld: keyof FiguurtjeData, waarde: string, naam?: string) => {
    if (!lezer && naam) leesVoor(naam)
    wijzig({ ...figuurtje, [veld]: waarde })
    setHuppel((n) => n + 1)
  }

  const rij = (titel: string, icoon: string, inhoud: ReactNode) => (
    <section className="welkom-rij" aria-label={titel}>
      <h2 className="welkom-rij-titel">
        <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d={icoon} /></svg>
        {lezer && <span>{titel}</span>}
      </h2>
      <div className="welkom-rij-keuzes">{inhoud}</div>
    </section>
  )
  const kleuren = (veld: keyof FiguurtjeData, palet: Record<string, string>) =>
    Object.entries(palet).map(([naam, hex]) => (
      <button key={naam} type="button" className="kast-kleur" style={{ background: hex }} aria-label={naam}
              aria-pressed={figuurtje[veld] === naam} onClick={() => zet(veld, naam, naam)} />
    ))

  return (
    <div className="welkom-maken">
      <section className="podium welkom-maken-podium" aria-label="Je figuurtje">
        <Figuurtje key={huppel} figuurtje={figuurtje} className={`podium-figuur${huppel ? ' huppel' : ''}`}
                   label={`Figuurtje van ${kind.naam}`} />
      </section>
      <div className="welkom-maken-keuzes">
        {lezer && <h1 className="display welkom-titel">Maak je figuurtje</h1>}
        {rij('Huid', categorie('huid').icoon, kleuren('huid', huidKleuren))}
        {rij('Haar', haar.icoon, kapsels.map((s) => (
          <button key={s.id} type="button" className="kast-keuze welkom-kapsel" aria-label={s.naam}
                  aria-pressed={figuurtje.haar === s.id} onClick={() => zet('haar', s.id, s.naam)}>
            <Figuurtje figuurtje={{ ...figuurtje, haar: s.id }} uitsnede={haar.uitsnede} className="kast-prent" />
          </button>
        )))}
        {rij('Haarkleur', 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z', kleuren('haarKleur', haarKleuren))}
        {rij('Shirt', categorie('shirt').icoon, kleuren('shirtKleur', kledingKleuren))}
        <button type="button" className="welkom-verrassing" aria-label="Verrassing"
                onClick={() => { if (!lezer) leesVoor('Verrassing!'); wijzig(verrassing(v, figuurtje)); setHuppel((n) => n + 1) }}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" /></svg>
          {lezer && 'Verrassing'}
        </button>
      </div>
    </div>
  )
}

/** Drie draaiknoppen (dag, maand, jaar) en een taart met evenveel kaarsjes als je oud bent. */
function Jarig({ kind, verjaardag, kies }: { kind: Gebruiker; verjaardag: string | null; kies: (d: string) => void }) {
  const lezer = kind.kan_lezen
  const nu = new Date()
  const start = verjaardag ?? `${nu.getFullYear() - (lezer ? 8 : 4)}-01-01`
  const [j, m, d] = start.split('-').map(Number)
  const jaarMin = nu.getFullYear() - 14
  const jaarMax = nu.getFullYear() - 2
  const datum = (jj: number, mm: number, dd: number) =>
    `${jj}-${String(mm).padStart(2, '0')}-${String(Math.min(dd, dagenInMaand(jj, mm))).padStart(2, '0')}`
  const rond = (x: number, van: number, tot: number) => (x < van ? tot : x > tot ? van : x)

  const jaren = verjaardag ? leeftijd(verjaardag, nu) : null
  const nachtjes = verjaardag ? nachtjesTotVerjaardag(verjaardag, nu) : null

  return (
    <div className="welkom-jarig">
      <div className="welkom-jarig-kiezen">
        {lezer && <h1 className="display welkom-titel">Wanneer ben je jarig?</h1>}
        <div className="draaiers">
          <Draaier label="Dag" waarde={String(Math.min(d, dagenInMaand(j, m)))}
                   min={() => kies(datum(j, m, rond(d - 1, 1, dagenInMaand(j, m))))}
                   plus={() => kies(datum(j, m, rond(d + 1, 1, dagenInMaand(j, m))))} />
          <Draaier label="Maand" waarde={maanden[m - 1]} breed
                   min={() => kies(datum(j, rond(m - 1, 1, 12), d))} plus={() => kies(datum(j, rond(m + 1, 1, 12), d))} />
          <Draaier label="Jaar" waarde={String(j)}
                   min={() => kies(datum(Math.max(jaarMin, j - 1), m, d))} plus={() => kies(datum(Math.min(jaarMax, j + 1), m, d))} />
        </div>
      </div>
      <div className="welkom-taart">
        <Taart kaarsjes={jaren ?? 0} />
        {jaren !== null && nachtjes !== null ? (
          <div className="welkom-taart-tekst" role="status">
            <p className="display welkom-leeftijd" key={jaren}>{jaren} jaar</p>
            {lezer && <p>{nachtjes === 0 ? 'Vandaag ben je jarig. Hoera!' : nachtjes === 1
              ? 'Nog 1 nachtje slapen tot je verjaardag!' : `Nog ${nachtjes} nachtjes slapen tot je verjaardag!`}</p>}
          </div>
        ) : (
          <p className="welkom-taart-tekst">{lezer ? 'Draai aan de knoppen.' : ''}</p>
        )}
      </div>
    </div>
  )
}

function Draaier({ label, waarde, min, plus, breed = false }: {
  label: string; waarde: string; min: () => void; plus: () => void; breed?: boolean
}) {
  return (
    <div className={`draaier${breed ? ' breed' : ''}`} role="group" aria-label={label}>
      <button type="button" className="draaier-knop" aria-label={`${label} hoger`} onClick={plus}>
        <svg className="ic" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d="M6 15l6-6l6 6" /></svg>
      </button>
      <span className="draaier-waarde display" key={waarde}>{waarde}</span>
      <button type="button" className="draaier-knop" aria-label={`${label} lager`} onClick={min}>
        <svg className="ic" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d="M6 9l6 6l6-6" /></svg>
      </button>
    </div>
  )
}

function Taart({ kaarsjes }: { kaarsjes: number }) {
  const n = Math.min(kaarsjes, 12)
  const breedte = 200
  return (
    <svg className="taart" viewBox="0 0 260 230" role="img" aria-label={kaarsjes ? `Taart met ${kaarsjes} kaarsjes` : 'Taart'}>
      <ellipse cx="130" cy="214" rx="120" ry="12" fill="var(--shade)" />
      <rect x="30" y="120" width="200" height="90" rx="18" fill="var(--kid)" />
      <path d="M30 140c20 14 30-6 50 6s30-6 50 6s30-6 50 6s30-6 50 0v-18a18 18 0 0 0-18-18H48a18 18 0 0 0-18 18z" fill="var(--surface)" />
      {[60, 100, 140, 180, 220].map((x) => <circle key={x} cx={x - 10} cy="185" r="6" fill="var(--gold)" />)}
      {Array.from({ length: n }, (_, i) => {
        const x = 30 + breedte / (n + 1) * (i + 1)
        return (
          <g key={`${n}-${i}`} className="kaarsje" style={{ animationDelay: `${i * 0.06}s` }}>
            <rect x={x - 5} y="78" width="10" height="44" rx="4" fill={i % 2 ? '#7FB8F0' : '#F49AC1'} />
            <path className="vlammetje" d={`M${x} 56c7 9 7 16 0 20c-7-4-7-11 0-20z`} fill="#F7A531"
                  style={{ animationDelay: `${(i % 4) * 0.15}s` }} />
          </g>
        )
      })}
    </svg>
  )
}

function ThemaKiezen({ lezer, thema, kies }: { lezer: boolean; thema: Kleur; kies: (t: Kleur) => void }) {
  return (
    <div className="welkom-themas">
      {lezer && <h1 className="display welkom-titel">Kies jouw kleur</h1>}
      <div className="thema-keuzes">
        {themaKeuzes.map((t) => {
          const banner = bannerVoorKleur[t.kleur]
          return (
            <button key={t.kleur} type="button" className={`thema-keuze kleur-${t.kleur}`} aria-pressed={thema === t.kleur}
                    aria-label={t.naam} onClick={() => kies(t.kleur)}>
              {banner
                ? <span className={`banner banner-${banner} thema-prent`}><Banner soort={banner} /></span>
                : <span className="thema-prent thema-effen"><Ster grootte={56} /></span>}
              {lezer && <span className="thema-naam display">{t.naam}</span>}
              {thema === t.kleur && (
                <span className="thema-vink" aria-hidden="true">
                  <svg className="ic" viewBox="0 0 24 24" width="28" height="28"><path d="M5 12l5 5l9-10" /></svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const confettiKleuren = ['#F2B33D', '#2D6BD6', '#E46AA8', '#2E9A45', '#8E44C9', '#E8772E', '#3EC1D3']

function Feest({ kind, figuurtje, bewaren }: {
  kind: Gebruiker; figuurtje: FiguurtjeData
  bewaren: { status: 'bezig' } | { status: 'klaar'; bonus: number } | { status: 'fout'; tekst: string }
}) {
  const lezer = kind.kan_lezen
  const confetti = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, delay: `${(i % 12) * 0.18}s`, duur: `${2.6 + (i % 5) * 0.35}s`,
    kleur: confettiKleuren[i % confettiKleuren.length], draai: `${(i * 53) % 360}deg`, rond: i % 3 === 0,
  })), [])
  const bonus = bewaren.status === 'klaar' ? bewaren.bonus : 0

  return (
    <div className="welkom-feest">
      <span className="confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <i key={i} className={c.rond ? 'rond' : ''} style={{
            left: c.left, background: c.kleur, animationDelay: c.delay, animationDuration: c.duur, '--draai': c.draai,
          } as CSSProperties} />
        ))}
      </span>
      <div className="welkom-podium feest-podium">
        <Fonkel />
        <Figuurtje figuurtje={figuurtje} className="welkom-figuur springen" label={`Figuurtje van ${kind.naam}`} />
      </div>
      <div className="welkom-tekst">
        <h1 className="display welkom-hoera">Hoera, {kind.naam}!</h1>
        {bewaren.status === 'fout' && <p className="fout" role="alert">{bewaren.tekst}</p>}
        {bewaren.status === 'bezig' && <p>{lezer ? 'Even alles klaarzetten…' : ''}</p>}
        {bewaren.status === 'klaar' && (bonus > 0 ? (
          <>
            {lezer && <p className="welkom-groot">Je hebt je eerste {bonus} sterren verdiend!</p>}
            <SterrenTeller doel={bonus} />
            {lezer && <p>Een welkomstcadeautje. Met taakjes, verhalen en rekenen verdien je er nog veel meer.</p>}
          </>
        ) : (
          lezer && <p className="welkom-groot">Alles staat klaar. Veel plezier!</p>
        ))}
      </div>
    </div>
  )
}

/** Sterren vliegen een voor een in de pil, die meetelt. */
function SterrenTeller({ doel }: { doel: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let i = 0
    const klok = window.setInterval(() => {
      i += 1
      setN(i)
      if (i >= doel) window.clearInterval(klok)
    }, 180)
    return () => window.clearInterval(klok)
  }, [doel])

  return (
    <div className="sterren-teller">
      <span className="vliegers" aria-hidden="true">
        {Array.from({ length: doel }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.18}s`, '--van-x': `${((i * 71) % 400) - 200}px`, '--van-y': `${-120 - (i % 4) * 40}px` } as CSSProperties}>
            <Ster grootte={40} />
          </span>
        ))}
      </span>
      <span className="sterren-pil feest-pil" aria-label={`${doel} sterren`}>
        <Ster grootte={48} />
        <b className="display" key={n}>{n}</b>
      </span>
    </div>
  )
}
