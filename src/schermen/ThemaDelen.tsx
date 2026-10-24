import { createContext, useContext, type ReactNode } from 'react'
import { themaOndertitels, type Banner, type ThemaScherm } from '../data/thema.ts'
import { auto, bal, beker, bloem, geblokt, glinster, hart, kroon, kopPrent, vlinder } from '../data/themaPrenten.ts'
import './thema-schermen.css'

// Bouwstenen die per thema anders getekend worden (prototypes/thema-subschermen.html):
// kopprent, slot, voortgang, 'nieuw', 'klaar' en het feest. Zonder thema tekenen ze niets.

type Thema = NonNullable<Banner>

const ThemaContext = createContext<Banner>(null)
export const ThemaBron = ThemaContext.Provider
export const useThema = () => useContext(ThemaContext)

const svg = (viewBox: string, inhoud: string, className?: string) => (
  <svg className={className} viewBox={viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: inhoud }} />
)

/** Kop van een subscherm met de prent van het thema; links en rechts komen de ronde knoppen. */
export function ThemaKop({ thema, scherm, titel, lezer, links, rechts }: {
  thema: Thema; scherm: ThemaScherm; titel: string; lezer: boolean; links: ReactNode; rechts?: ReactNode
}) {
  const sub = themaOndertitels[thema][scherm]
  return (
    <header className={`thema-kop${scherm === 'spel' ? ' laag' : ''}`}>
      <svg className="thema-kop-prent" viewBox="0 0 1000 190" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"
           dangerouslySetInnerHTML={{ __html: kopPrent(thema, scherm) }} />
      <div className="thema-kop-inhoud">
        {links}
        <div className="thema-kop-tekst">
          <h1 className={`display thema-kop-titel${lezer ? '' : ' thema-verborgen'}`}>{titel}</h1>
          {lezer && sub && <span className="thema-kop-sub">{sub}</span>}
        </div>
        {rechts}
      </div>
    </header>
  )
}

/** Teken in een tegel die nog op slot zit: rolluik en stoplicht, kasteeldeur, een doelnet of een slapend huisje. */
export function ThemaSlot({ thema }: { thema: Thema }) {
  if (thema === 'race') return (
    <>
      <span className="thema-rolluik" aria-hidden="true" />
      <span className="thema-stoplicht" aria-hidden="true"><i /><i /><i /></span>
    </>
  )
  if (thema === 'kasteel') return (
    <span className="thema-deur" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" fill="#F2B33D" /><path d="M10 12h4l1 8H9z" fill="#F2B33D" /></svg>
    </span>
  )
  if (thema === 'voetbal') return <span className="thema-net" aria-hidden="true" />
  return (
    <span className="thema-slaap" aria-hidden="true">
      <svg viewBox="0 0 30 10"><path d="M3 3q4 5 8 0M19 3q4 5 8 0" stroke="#7A5A3C" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>
      <b className="display">z</b>
    </span>
  )
}

/** Hoe ver het kind al is: een auto op weg naar de finish, een regenboog die volloopt, een bal op weg naar het doel, of vijf bloemetjes. */
export function ThemaVoortgang({ thema, deel, label }: { thema: Thema; deel: number; label: string }) {
  const d = Math.max(0, Math.min(1, deel))
  if (thema === 'race') return (
    <span className="thema-weg" role="img" aria-label={label}>
      <span className="thema-weg-auto" style={{ left: `${6 + d * 72}%` }}>{svg('-80 -60 160 80', auto(0, 0, 1))}</span>
      <span className="thema-weg-vlag">{svg('0 0 30 44', `<rect x="0" y="0" width="3" height="44" fill="#C9D3DE"/>${geblokt(3, 0, 24, 16, 3)}`)}</span>
    </span>
  )
  if (thema === 'kasteel') return (
    <span className="thema-regenboog" role="img" aria-label={label}><i style={{ width: `${Math.round(d * 100)}%` }} /></span>
  )
  if (thema === 'voetbal') return (
    <span className="thema-veld" role="img" aria-label={label}>
      <span className="thema-veld-bal" style={{ left: `${4 + d * 76}%` }}>{svg('-22 -22 44 44', bal(0, 0, 1))}</span>
      <span className="thema-veld-doel">{svg('-84 -80 168 84', '<path d="M-80 2V-76H80V2" stroke="#fff" stroke-width="12" fill="#fff" fill-opacity=".3"/>')}</span>
    </span>
  )
  const open = Math.floor(d * 5)
  return (
    <span className="thema-bloemetjes" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i}>{i < open ? svg('-22 -22 44 44', bloem(0, 0, 1, '#F59AC8', false))
          : svg('-14 -14 28 28', '<path d="M0 12V0" stroke="#7FB069" stroke-width="2.5"/><ellipse cx="0" cy="-3" rx="5" ry="8" fill="#C9B7DE"/>')}</span>
      ))}
    </span>
  )
}

/** Wat net vrijkwam: een NIEUW-bordje, een kroontje, een bal of een vlinder. */
export function ThemaNieuw({ thema }: { thema: Thema }) {
  if (thema === 'race') return <span className="thema-nieuw race display">NIEUW</span>
  if (thema === 'kasteel') return <span className="thema-nieuw">{svg('-50 -56 100 60', kroon(0, 0, 1))}</span>
  if (thema === 'voetbal') return <span className="thema-nieuw voetbal">{svg('-22 -22 44 44', bal(0, 0, 1))}</span>
  return <span className="thema-nieuw">{svg('-34 -34 68 60', vlinder(0, 0, 1.2, '#F59AC8', '#B98CE6'))}</span>
}

/** Klaar of gelezen: een geblokte vlag, een kroontje, een beker of een vlinder. */
export function ThemaVink({ thema }: { thema: Thema }) {
  if (thema === 'race') return <span className="thema-vink race">{svg('0 0 40 40', `<rect x="2" y="2" width="3" height="36" fill="#C9D3DE"/>${geblokt(5, 2, 30, 20, 5)}`)}</span>
  if (thema === 'kasteel') return <span className="thema-vink kasteel">{svg('-50 -56 100 60', kroon(0, 0, 1))}</span>
  if (thema === 'voetbal') return <span className="thema-vink voetbal">{svg('-50 -74 100 88', beker(0, 0, 1))}</span>
  return <span className="thema-vink tuin">{svg('-34 -34 68 60', vlinder(0, 0, 1.2, '#FFC27A', '#F59AC8'))}</span>
}

const STUKJES = 30
/** Confetti van het thema over het hele scherm, na een spelletje, verhaal of kleurplaat. */
export function ThemaFeest() {
  const thema = useThema()
  if (!thema) return null
  return (
    <div className="thema-feest" aria-hidden="true">
      {Array.from({ length: STUKJES }, (_, i) => {
        const duur = 3.2 + (i % 5) * 0.7
        const stijl = { left: `${(i * 29) % 100}%`, animationDuration: `${duur}s`, animationDelay: `${-((i * 0.37) % duur)}s` }
        const maat = 14 + (i % 3) * 7
        let vorm: ReactNode
        if (thema === 'race') vorm = i % 3 === 0
          ? <span style={{ width: maat, height: maat }}>{svg('0 0 10 10', geblokt(0, 0, 10, 10, 2))}</span>
          : <span style={{ width: maat, height: maat / 2, background: ['#F2B33D', '#E23B3B', '#FFFFFF', '#2D6BD6'][i % 4] }} />
        else if (thema === 'kasteel') vorm = <span style={{ width: maat * 1.4, height: maat * 1.2 }}>{i % 2
          ? svg('-16 -16 32 26', hart(0, 0, 1, ['#F28AB8', '#C2337A', '#F2B33D'][i % 3]))
          : svg('-12 -12 24 24', glinster(0, 0, 1, ['#F2B33D', '#FFFFFF', '#B98CE6'][i % 3]))}</span>
        else if (thema === 'voetbal') vorm = i % 3 === 0
          ? <span style={{ width: maat * 1.4, height: maat * 1.4 }}>{svg('-22 -22 44 44', bal(0, 0, 1))}</span>
          : <span style={{ width: maat, height: maat / 2, background: ['#1E8A3C', '#FFFFFF', '#F2B33D', '#4D9BE8'][i % 4] }} />
        else vorm = i % 4 === 0
          ? <span style={{ width: maat * 2.4, height: maat * 2 }}>{svg('-34 -34 68 60', vlinder(0, 0, 1.2, ['#F59AC8', '#FFC27A', '#B9D3F5'][i % 3], '#B98CE6'))}</span>
          : <span className="blad" style={{ width: maat, height: maat * 1.6, background: ['#F59AC8', '#FFC27A', '#B98CE6', '#AEDDA2'][i % 4] }} />
        return <i key={i} style={stijl}>{vorm}</i>
      })}
    </div>
  )
}
