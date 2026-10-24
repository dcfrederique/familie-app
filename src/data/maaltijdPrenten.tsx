// Eigen lijniconen (24 × 24, stroke 2) voor het weekmenu, in dezelfde stijl als de taakprentjes.
import type { MaaltijdSoort } from './maaltijden.ts'

const kom = ['M3 12h18', 'M4 12a8 8 0 0 0 16 0']

const paden: Record<MaaltijdSoort, string[]> = {
  pasta: [...kom, 'M8 12c0-3 2-4 1-8', 'M12 12c0-3 2-4 1-8', 'M16 12c0-2-1-3 0-6'],
  ovenschotel: ['M3 9h18v10H3z', 'M3 13h18', 'M3 16h18', 'M1 11h2', 'M21 11h2', 'M9 3c-1 1.5 1 2 0 4', 'M15 3c-1 1.5 1 2 0 4'],
  soep: [...kom, 'M9 3c-1 1.5 1 2.5 0 5', 'M13 3c-1 1.5 1 2.5 0 5', 'M17 5l3-3'],
  frietjes: ['M6 10h12l-2 11H8z', 'M8 10L7 4', 'M11 10V3', 'M14 10l1-6', 'M17 10l1-4'],
  pizza: ['M12 21L3 6c6-3 12-3 18 0z', 'M5 9c4.5-2 9.5-2 14 0', 'M10 11h.01', 'M14 13h.01', 'M12 16h.01'],
  vis: ['M3 12c3-5 10-6 14-1l4-3v8l-4-3c-4 5-11 4-14-1z', 'M7 11h.01'],
  kip: ['M14 4a6 6 0 0 1 6 6c0 4-4 6-7 5l-4 4a2 2 0 1 1-3-1 2 2 0 1 1-1-3l4-4c-1-3 1-7 5-7z'],
  balletjes: [...kom, 'M7 12a2.5 2.5 0 0 1 5 0', 'M12 12a2.5 2.5 0 0 1 5 0', 'M9.5 9a2.5 2.5 0 0 1 5 0'],
  stoofpot: ['M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z', 'M2 10h20', 'M10 7h4', 'M12 7v3', 'M8 2c-1 1.5 1 2 0 3', 'M16 2c-1 1.5 1 2 0 3'],
  vlees: ['M5 9c0-4 6-6 10-4s6 6 4 10-8 5-11 3-3-5-3-9z', 'M11 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  worst: ['M5 17c-2-2 0-5 3-7l6-4c3-2 6 0 5 3-1 3-5 6-9 8-2 1-4 1-5 0z', 'M4 18l-2 2', 'M20 5l2-2'],
  rijst: [...kom, 'M13 9l7-7', 'M10 9l7-7', 'M8 12a4 3 0 0 1 8 0'],
  puree: ['M3 17h18', 'M5 17c0-4 3-7 7-7s7 3 7 7', 'M12 10V7', 'M9 14h.01', 'M14 13h.01'],
  groenten: ['M15 9L4 20l3-9c1-3 5-4 8-2z', 'M15 9l3-5', 'M15 9l5-2', 'M9 13l2 2', 'M7 17l1.5 1.5'],
  wrap: ['M3 18a9 9 0 0 1 18 0z', 'M6 13l2 1', 'M11 11v2', 'M16 13l-2 1'],
  hamburger: ['M4 11a8 6 0 0 1 16 0z', 'M3 14h18', 'M4 17h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 7.5h.01', 'M14 7h.01'],
  pannenkoek: ['M4 15h16', 'M4 19h16', 'M4 15c0-2 4-3 8-3s8 1 8 3', 'M4 15v4', 'M20 15v4', 'M11 12V9'],
  eieren: ['M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z', 'M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  bord: ['M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M2 4v5a2 2 0 0 0 2 2v9', 'M4 4v4', 'M20 20V4c-2 1-3 4-3 8h3'],
}

export function MaaltijdPrent({ soort, grootte = 48 }: { soort: MaaltijdSoort; grootte?: number }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">
      {paden[soort].map((d) => <path key={d} d={d} />)}
    </svg>
  )
}
