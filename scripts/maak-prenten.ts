// Maakt prenten met het beeldmodel van Azure OpenAI (docs/prenten.md).
// Gebruik: AZURE_OPENAI_ENDPOINT=https://<naam>.openai.azure.com AZURE_OPENAI_KEY=... AZURE_OPENAI_DEPLOYMENT=<naam>
//          node scripts/maak-prenten.ts proef [--kwaliteit low|medium|high] [--droog]
// Schrijft prenten/<reeks>/<naam>.png en een overzicht prenten/<reeks>/index.html om ze naast elkaar te bekijken.
// Een prent die al bestaat, wordt niet opnieuw gemaakt (verwijder hem om hem opnieuw te laten maken).
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { proef, type Prentopdracht } from './prenten/proef.ts'

const reeksen: Record<string, Prentopdracht[]> = { proef }
const reeks = process.argv[2] ?? 'proef'
const droog = process.argv.includes('--droog')
const kwaliteit = process.argv.includes('--kwaliteit') ? process.argv[process.argv.indexOf('--kwaliteit') + 1] : 'medium'
const apiVersie = process.env.AZURE_OPENAI_API_VERSION ?? '2025-04-01-preview'
/** Meer dan dit in één keer is vast een vergissing (en kost geld). */
const maxPrenten = 120

const opdrachten = reeksen[reeks]
if (!opdrachten) throw new Error(`onbekende reeks ${reeks}; kies uit ${Object.keys(reeksen).join(', ')}`)
if (!['low', 'medium', 'high'].includes(kwaliteit)) throw new Error('kwaliteit moet low, medium of high zijn')
const map = join('prenten', reeks)
mkdirSync(map, { recursive: true })
const te = opdrachten.filter((o) => !existsSync(join(map, `${o.naam}.png`)))
console.log(`${opdrachten.length} prenten in ${reeks}, ${te.length} nog te maken (kwaliteit ${kwaliteit})`)
if (te.length > maxPrenten) throw new Error(`${te.length} prenten is meer dan ${maxPrenten}: splits de reeks op`)

if (droog) {
  for (const o of te) console.log(`\n--- ${o.naam} (${o.soort})\n${o.prompt}`)
} else {
  const { AZURE_OPENAI_ENDPOINT: endpoint, AZURE_OPENAI_KEY: sleutel, AZURE_OPENAI_DEPLOYMENT: deployment } = process.env
  if (!endpoint || !sleutel || !deployment) throw new Error('AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY en AZURE_OPENAI_DEPLOYMENT zijn nodig')
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/images/generations?api-version=${apiVersie}`
  let mislukt = 0
  for (const o of te) {
    let gelukt = false
    for (let poging = 1; poging <= 3 && !gelukt; poging++) {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'api-key': sleutel, 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: o.prompt, size: '1536x1024', quality: kwaliteit, n: 1 }),
      })
      if (r.status === 429) { await new Promise((k) => setTimeout(k, 20_000 * poging)); continue }
      if (!r.ok) { console.error(`✗ ${o.naam}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`); break }
      const antwoord = await r.json() as { data: { b64_json: string }[] }
      writeFileSync(join(map, `${o.naam}.png`), Buffer.from(antwoord.data[0].b64_json, 'base64'))
      console.log(`✓ ${o.naam}`)
      gelukt = true
    }
    if (!gelukt) mislukt++
  }
  if (mislukt) process.exitCode = 1
}

// Overzicht om de prenten te beoordelen, met de opdracht eronder.
const kaarten = opdrachten.filter((o) => readdirSync(map).includes(`${o.naam}.png`))
  .map((o) => `<figure><img src="${o.naam}.png" alt="${o.naam}"><figcaption><b>${o.naam}</b><br>${o.prompt.split('\n\n').at(-1)}</figcaption></figure>`)
writeFileSync(join(map, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Prenten ${reeks}</title>
<style>body{font:15px system-ui;margin:24px;background:#EEF3F8}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px}
figure{margin:0;background:#fff;border-radius:16px;overflow:hidden}img{width:100%;display:block}figcaption{padding:12px}</style>
<h1>Prenten: ${reeks}</h1><main>${kaarten.join('\n')}</main>`)
