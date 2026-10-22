// Eigen lijniconen (24 × 24, stroke 2) voor taken. Geen merken of bestaande personages.

const paden: Record<string, string[]> = {
  tafel: ['M3 10h18', 'M5 10v9', 'M19 10v9', 'M9 4v3', 'M12 4v3', 'M15 4v3'],
  kamer: ['M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6', 'M3 18h18', 'M3 21v-3', 'M21 21v-3', 'M7 10V7h4v3'],
  huiswerk: ['M4 5h11l5 5v9H4z', 'M15 5v5h5', 'M8 14h8', 'M8 17h5'],
  vaatwasser: ['M4 3h16v18H4z', 'M4 8h16', 'M8 5.5h2', 'M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  boek: ['M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z', 'M12 6v14'],
  tanden: ['M7 3c-2 0-3 2-3 4 0 3 1 5 2 8s1 6 3 6 2-4 3-4 1 4 3 4 2-3 3-6 2-5 2-8c0-2-1-4-3-4s-3 1-5 1-3-1-5-1z'],
  speelgoed: ['M4 10h16v10H4z', 'M3 7h18v3H3z', 'M12 7v13', 'M12 7c-2-4-6-3-5 0', 'M12 7c2-4 6-3 5 0'],
  plant: ['M12 21v-9', 'M12 12c0-4 3-7 7-7 0 4-3 7-7 7z', 'M12 15c0-3-2-5-6-5 0 3 2 5 6 5z', 'M7 21h10'],
  fiets: ['M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15l4-7h5l3 7', 'M10 8l2 7h0', 'M9 5h3'],
  pyjama: ['M8 3h8l4 4-3 3v11H7V10L4 7z', 'M12 3v18', 'M10 8h.01', 'M10 13h.01'],
  ster: ['M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z'],
  hond: ['M5 10l-2-4 4 1 2-3h6l2 3 4-1-2 4v5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z', 'M10 13h.01', 'M14 13h.01', 'M11 17h2'],
  was: ['M5 21V8l4-5h6l4 5v13z', 'M9 3c0 2 1.5 3 3 3s3-1 3-3'],
  schoenen: ['M3 16h18v3H3z', 'M3 16V9l5 1 3 4h6c2 0 4 1 4 2'],
}

export const prentjeSleutels = Object.keys(paden)

export function Prentje({ naam, grootte = 48 }: { naam: string | null; grootte?: number }) {
  const lijnen = paden[naam ?? ''] ?? paden.ster
  return (
    <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">
      {lijnen.map((d) => <path key={d} d={d} />)}
    </svg>
  )
}
