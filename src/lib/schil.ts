import { Capacitor, registerPlugin } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { useEffect } from 'react'

// De Android-schil (docs/capacitor.md). Op het web (pc, gsm in de browser) doet alles hier niets.
interface ImmersiefPlugin {
  /** Systeembalken verbergen (aan) of weer tonen (uit). */
  zet(opties: { aan: boolean }): Promise<void>
}
const Immersief = registerPlugin<ImmersiefPlugin>('Immersief')

export const inSchil = (): boolean => Capacitor.isNativePlatform()

/** Kindertablet: altijd liggend en beeldvullend. Ouder-gsm: draait vrij, met systeembalken. */
export async function pasSchilAan(kindertablet: boolean): Promise<void> {
  if (!inSchil()) return
  try {
    if (kindertablet) await ScreenOrientation.lock({ orientation: 'landscape' })
    else await ScreenOrientation.unlock()
    await Immersief.zet({ aan: kindertablet })
  } catch {
    // Oudere schil zonder deze plugin: de app blijft gewoon werken.
  }
}

export function useSchil(kindertablet: boolean): void {
  useEffect(() => {
    void pasSchilAan(kindertablet)
  }, [kindertablet])
}
