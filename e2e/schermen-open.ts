// Kinderschermen die nog niet passen zonder scrollen, als 'kind scherm BxH' (gsm liggend inbegrepen).
// Bijgehouden door de nachtelijke schermcontrole (CLAUDE.md): wat past, gaat eruit; de test zegt het zelf.
// Bijwerken: OPEN_OPNEMEN=1 npx playwright test e2e/schermen.spec.ts && node scripts/open-bijwerken.cjs <verslag>.
// Stand: ideeen/2026-11-01-schermen.md.
export const OPEN = new Set<string>([
  "feline figuurtje 844x390",
  "feline figuurtje 915x412",
  "feline huis 844x390",
  "feline huis 915x412",
  "feline tekenen 844x390",
  "feline tekenen 915x412",
  "luca figuurtje 844x390",
  "luca figuurtje 915x412",
  "luca huis 844x390",
  "luca huis 915x412",
  "luca tekenen 844x390",
  "luca tekenen 915x412",
  "yuna figuurtje 844x390",
  "yuna figuurtje 915x412",
  "yuna huis 844x390",
  "yuna huis 915x412",
  "yuna tekenen 844x390",
  "yuna tekenen 915x412",
])
