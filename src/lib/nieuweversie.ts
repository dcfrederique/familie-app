// Nieuwe versie van de app laden na een deploy, zonder Ctrl+F5.
// De service worker toont eerst de bewaarde (oude) versie; de nieuwe wordt op de achtergrond binnengehaald.
// Zodra die klaar is, wisselen we, maar nooit midden in iets: alleen als er nog niet getikt is sinds het laden,
// of wanneer het scherm even weg is (tablet op slot, ander tabblad).
import { registerSW } from 'virtual:pwa-register'

/** Hoe vaak we vragen of er een nieuwe versie is, als de app lang openstaat. */
const CONTROLEER_ELKE_MS = 30 * 60 * 1000

/** Mag de nieuwe versie nu meteen geladen worden? */
export function nuWisselen(alGetikt: boolean, verborgen: boolean): boolean {
  return !alGetikt || verborgen
}

export function volgNieuweVersie(): void {
  if (!('serviceWorker' in navigator)) return

  let alGetikt = false
  let klaar = false
  const getikt = () => { alGetikt = true }
  window.addEventListener('pointerdown', getikt, { once: true, capture: true })
  window.addEventListener('keydown', getikt, { once: true, capture: true })

  const wissel = () => {
    if (klaar && nuWisselen(alGetikt, document.visibilityState === 'hidden')) void updateSW(true)
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      klaar = true
      wissel()
    },
    onRegisteredSW(_url, registratie) {
      if (!registratie) return
      const controleer = () => { if (navigator.onLine) void registratie.update().catch(() => {}) }
      setInterval(controleer, CONTROLEER_ELKE_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') controleer()
      })
    },
  })

  document.addEventListener('visibilitychange', wissel)
}
