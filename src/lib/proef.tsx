import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Bron } from './bron/types.ts'
import { SessieContext, useSessie } from './sessie.tsx'

// Ouders proberen de kindschermen uit (Spelletjes proberen, ouderdeel). Het spel loopt echt, maar er wordt niets
// bewaard voor het kind: geen sterren, geen activiteitlog (dus geen app-tijd), geen aankopen of chat.

interface Proef { actief: boolean; stop: () => void }
const ProefContext = createContext<Proef>({ actief: false, stop: () => {} })
export const useProef = () => useContext(ProefContext)

/** Schrijfacties die iets van het kind zouden veranderen, met wat ze in de plaats teruggeven. */
const GEBLOKKEERD: Record<string, unknown> = {
  activiteitOpslaan: 0, kopen: undefined, figuurtjeBewaren: undefined, huisBewaren: undefined,
  welkomAfronden: 0, themaKiezen: undefined, taakIndienen: undefined, tijdAanvragen: undefined,
  chatSturen: undefined, chatAanwezig: undefined, chatGelezen: undefined, dagelijksHoera: null,
}

/** Een bron die leest als de echte, maar de acties van het kind overslaat. */
export function proefBron(echt: Bron): Bron {
  return new Proxy(echt, {
    get(doel, naam, ontvanger) {
      if (typeof naam === 'string' && naam in GEBLOKKEERD) return () => Promise.resolve(GEBLOKKEERD[naam])
      return Reflect.get(doel, naam, ontvanger)
    },
  })
}

const SLEUTEL = 'proef-spelletjes'
export const proefAan = () => { try { return sessionStorage.getItem(SLEUTEL) === 'ja' } catch { return false } }
export function proefStarten() {
  try { sessionStorage.setItem(SLEUTEL, 'ja') } catch { /* dan werkt proberen niet, maar niets gaat stuk */ }
  // Beeldvullend vanaf de tik zelf: de browser staat dat alleen toe bij een tik.
  void document.documentElement.requestFullscreen?.().catch(() => {})
}
function proefStoppen() {
  try { sessionStorage.removeItem(SLEUTEL) } catch { /* niet erg */ }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
}

/** De kindschermen voor een ouder: beeldvullend met een smalle strook en een Stop-knop, en zonder bewaren voor het kind. */
export function ProefPoort({ kindId }: { kindId: string | undefined }) {
  const sessie = useSessie()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const kind = sessie.kinderen.find((k) => k.id === kindId)
  const stop = useCallback(() => {
    proefStoppen()
    navigate(`/ouder/proberen?kind=${kindId}`, { replace: true })
  }, [navigate, kindId])
  // Esc uit beeldvullend brengt je ook terug naar de lijst.
  useEffect(() => {
    const op = () => { if (!document.fullscreenElement) stop() }
    document.addEventListener('fullscreenchange', op)
    return () => document.removeEventListener('fullscreenchange', op)
  }, [stop])
  // Terug uit het spelletje naar het kindmenu is terug naar de lijst.
  const weg = /^\/kind\/[^/]+(\/spelen)?\/?$/.test(pathname)
  useEffect(() => { if (weg) stop() }, [weg, stop])

  const waarde = useMemo(() => ({
    ...sessie, perKind: false, mijnKind: null, bron: sessie.bron ? proefBron(sessie.bron) : null,
  }), [sessie])
  const proef = useMemo(() => ({ actief: true, stop }), [stop])
  if (!kind) return <Navigate to="/ouder/proberen" replace />
  return (
    <div className="proef-vlak">
      <div className="proef-strook">
        <span>Proefspel van {kind.naam}: niets wordt bewaard</span>
        <button type="button" onClick={stop}>Stop</button>
      </div>
      <SessieContext.Provider value={waarde}>
        <ProefContext.Provider value={proef}><Outlet /></ProefContext.Provider>
      </SessieContext.Provider>
    </div>
  )
}
