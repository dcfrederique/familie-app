// Mijn verlanglijstje (docs/verlanglijstje.md): de prentjes waaruit een kind kiest. Eigen lijnicoontjes (24 × 24, stroke 2),
// geen merken of personages. De server controleert enkel de sleutel op lengte; onbekende sleutels tekenen een ster.

export const MAX_WENSEN = 10
export const MAX_FAVORIETEN = 3
export const MAX_TEKST = 40

export interface WensPrent { sleutel: string; naam: string; paden: string[] }

export const wensPrenten: WensPrent[] = [
  { sleutel: 'bal', naam: 'een bal', paden: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3c3 3 3 15 0 18', 'M12 3c-3 3-3 15 0 18'] },
  { sleutel: 'pop', naam: 'een pop', paden: ['M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8 22l1-10h6l1 10', 'M6 13l3-1', 'M18 13l-3-1'] },
  { sleutel: 'knuffel', naam: 'een knuffel', paden: ['M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M6.5 6a2 2 0 1 1 1-3', 'M17.5 6a2 2 0 1 0-1-3', 'M8 21c0-3 1-5 4-5s4 2 4 5', 'M10 9h.01', 'M14 9h.01'] },
  { sleutel: 'trein', naam: 'een trein', paden: ['M5 4h14v12H5z', 'M5 11h14', 'M8 20l2-4', 'M16 20l-2-4', 'M8 14h.01', 'M16 14h.01'] },
  { sleutel: 'blokken', naam: 'blokken', paden: ['M3 21h8v-8H3z', 'M13 21h8v-8h-8z', 'M7.5 13V5h9v8'] },
  { sleutel: 'puzzel', naam: 'een puzzel', paden: ['M4 4h6v2a2 2 0 1 0 4 0V4h6v6h-2a2 2 0 1 0 0 4h2v6H4z'] },
  { sleutel: 'boek', naam: 'een boek', paden: ['M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z', 'M12 6v14'] },
  { sleutel: 'fiets', naam: 'een fiets', paden: ['M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15l4-7h5l3 7', 'M10 8l2 7', 'M9 5h3'] },
  { sleutel: 'step', naam: 'een step', paden: ['M5 20a1.5 1.5 0 1 0 .01 0', 'M18 20a1.5 1.5 0 1 0 .01 0', 'M6.5 20h10', 'M18 18.5L15 5', 'M13 5h4'] },
  { sleutel: 'kroon', naam: 'een kroon', paden: ['M4 18l-1-10 5 4 4-7 4 7 5-4-1 10z', 'M4 21h16'] },
  { sleutel: 'tekenen', naam: 'tekenspullen', paden: ['M4 20l1-4L16 5l3 3L8 19z', 'M14 7l3 3'] },
  { sleutel: 'huisje', naam: 'een poppenhuis', paden: ['M3 11l9-7 9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'] },
  { sleutel: 'muziek', naam: 'muziek', paden: ['M9 18V5l11-2v13', 'M3 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0', 'M14 16a3 3 0 1 0 6 0 3 3 0 1 0-6 0'] },
  { sleutel: 'auto', naam: 'een auto', paden: ['M3 16v-4l2-5h14l2 5v4', 'M3 16h18', 'M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0', 'M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0'] },
  { sleutel: 'dino', naam: 'een dino', paden: ['M4 18c0-6 3-10 8-10 1 0 2 .5 3 1l5-1v4l-3 1v5', 'M4 18h3', 'M12 18h3', 'M17 10h.01'] },
  { sleutel: 'spel', naam: 'een spel', paden: ['M4 4h16v16H4z', 'M8 8h.01', 'M16 8h.01', 'M12 12h.01', 'M8 16h.01', 'M16 16h.01'] },
  { sleutel: 'raket', naam: 'een raket', paden: ['M12 3c3 2 4 6 4 10l-4 4-4-4c0-4 1-8 4-10z', 'M12 10h.01', 'M8 15l-3 3', 'M16 15l3 3'] },
  { sleutel: 'jurk', naam: 'verkleedkleren', paden: ['M9 3l3 3 3-3', 'M9 3L7 10l-3 11h16l-3-11-2-7'] },
  { sleutel: 'hond', naam: 'een diertje', paden: ['M5 10l-2-4 4 1 2-3h6l2 3 4-1-2 4v5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z', 'M10 13h.01', 'M14 13h.01', 'M11 17h2'] },
  { sleutel: 'tent', naam: 'een tent', paden: ['M3 20l9-15 9 15z', 'M12 20v-6'] },
  { sleutel: 'camera', naam: 'een fototoestel', paden: ['M3 8h4l2-3h6l2 3h4v12H3z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'] },
  { sleutel: 'schaar', naam: 'knutselspullen', paden: ['M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8.5 7.5L20 18', 'M8.5 16.5L20 6'] },
  { sleutel: 'verrassing', naam: 'een verrassing', paden: ['M4 10h16v10H4z', 'M3 7h18v3H3z', 'M12 7v13', 'M12 7c-2-4-6-3-5 0', 'M12 7c2-4 6-3 5 0'] },
]

export const wensPrentVan = (sleutel: string | null) => wensPrenten.find((p) => p.sleutel === sleutel)

export const wensStatussen = [
  { sleutel: 'nieuw', naam: 'Nieuw' },
  { sleutel: 'gekocht', naam: 'Gekocht' },
  { sleutel: 'later', naam: 'Later' },
  { sleutel: 'liever_niet', naam: 'Liever niet' },
] as const
