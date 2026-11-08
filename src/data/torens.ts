// Pakjestoren: per niveau vier rondes. Elke ronde heeft een aantal pakjes en soms de kleurregel.

export type TorenNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface TorenRonde {
  /** Hoeveel pakjes de toren heeft (het grootste onderaan). */
  pakjes: number
  /** Twee pakjes van dezelfde kleur mogen nooit direct op elkaar liggen (oneven pakjes rood, even pakjes blauw). */
  kleurregel?: boolean
}

export const torenRondes: Record<TorenNiveau, TorenRonde[]> = {
  makkelijk: [{ pakjes: 2 }, { pakjes: 2 }, { pakjes: 3 }, { pakjes: 3 }],
  middel: [{ pakjes: 3 }, { pakjes: 3 }, { pakjes: 4 }, { pakjes: 4 }],
  moeilijk: [{ pakjes: 5 }, { pakjes: 6 }, { pakjes: 6, kleurregel: true }, { pakjes: 7, kleurregel: true }],
}

/** Kleuren van de pakjes, van klein naar groot (de kleurregel gebruikt alleen rood en blauw). */
export const torenKleuren = ['#E53935', '#2F80C9', '#43A047', '#F2A93B', '#8E5BD1', '#D9568F', '#2AA7A0']
