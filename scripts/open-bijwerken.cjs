// Voegt test-results/open/*.json (van OPEN_OPNEMEN=1 npx playwright test e2e/schermen.spec.ts) samen tot e2e/schermen-open.ts.
const fs = require('fs')
const map = 'test-results/open'
const alles = fs.readdirSync(map).flatMap((f) => JSON.parse(fs.readFileSync(`${map}/${f}`, 'utf8'))).sort()
const verslag = process.argv[2] ?? 'ideeen/<datum>-schermen.md'
fs.writeFileSync('e2e/schermen-open.ts', `// Kinderschermen die nog niet passen zonder scrollen, als 'kind scherm BxH' (gsm liggend inbegrepen).
// Bijgehouden door de nachtelijke schermcontrole (CLAUDE.md): wat past, gaat eruit; de test zegt het zelf.
// Bijwerken: OPEN_OPNEMEN=1 npx playwright test e2e/schermen.spec.ts && node scripts/open-bijwerken.cjs <verslag>.
// Stand: ${verslag}.
export const OPEN = new Set<string>([
${alles.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
])
`)
const gsm = alles.filter((s) => / (844x390|915x412)$/.test(s)).length
console.log(`${alles.length} open, waarvan ${gsm} op gsm liggend en ${alles.length - gsm} op tablets.`)
