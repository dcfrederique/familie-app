// Spreekt de verhalen en de vaste zinnen in met de Vlaamse stemmen Dena en Arnaud (docs/voorleesstem.md).
// Gebruik: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope node scripts/maak-stem.ts
//          node scripts/maak-stem.ts --droog   (toont alleen wat er ingesproken zou worden)
// Schrijft public/stem/<sleutel>.mp3 en .json (woordtijden) en de lijst src/data/opnames.json.
// Alleen nieuwe of gewijzigde teksten gaan naar Azure; opnames die niet meer nodig zijn, worden gewist.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sdk from 'microsoft-cognitiveservices-speech-sdk'
import { vasteZinnen } from '../src/data/zinnen.ts'
import { maakSsml, opnameSleutel, woordtijden, type Grens, type Stem } from '../src/lib/stem.ts'

const map = 'public/stem'
const lijst = 'src/data/opnames.json'
const droog = process.argv.includes('--droog')
/** F0 laat 500.000 tekens per maand toe; meer dan dit in één keer is vast een vergissing. */
const maxTekens = 200_000
/** F0: 20 verzoeken per minuut. */
const wachtMs = 3200

interface Opname { sleutel: string; stem: Stem; tekst: string; woorden: boolean }

function nodig(): Opname[] {
  const uit = new Map<string, Opname>()
  const voeg = (stem: Stem, tekst: string, woorden: boolean) => {
    const sleutel = opnameSleutel(stem, tekst)
    if (!uit.has(sleutel) || woorden) uit.set(sleutel, { sleutel, stem, tekst: tekst.trim(), woorden })
  }
  // Beide stemmen voor alles: de ouder kiest per kind (om beurten, altijd Dena of altijd Arnaud).
  for (const stem of ['dena', 'arnaud'] as const) {
    for (const bestand of readdirSync('src/data/verhalen').filter((f) => f.endsWith('.json')).sort()) {
      const verhaal = JSON.parse(readFileSync(join('src/data/verhalen', bestand), 'utf8')) as { bladzijden: { tekst: string }[] }
      for (const b of verhaal.bladzijden) voeg(stem, b.tekst, true)
    }
    for (const zin of vasteZinnen) voeg(stem, zin, false)
  }
  return [...uit.values()]
}

const wacht = (ms: number) => new Promise((klaar) => setTimeout(klaar, ms))

/** Geeft op als Azure niet antwoordt, zodat de workflow niet blijft hangen. */
function binnen<T>(ms: number, belofte: Promise<T>): Promise<T> {
  let klok: NodeJS.Timeout | undefined
  const opgeven = new Promise<never>((_, fout) => { klok = setTimeout(() => fout(new Error(`geen antwoord na ${ms / 1000} s`)), ms) })
  return Promise.race([belofte, opgeven]).finally(() => clearTimeout(klok))
}

function maakSpreker(sleutel: string, regio: string) {
  const config = sdk.SpeechConfig.fromSubscription(sleutel, regio)
  config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
  const spreker = new sdk.SpeechSynthesizer(config, null as unknown as sdk.AudioConfig)
  let grenzen: Grens[] = []
  spreker.wordBoundary = (_s, e) => {
    if (e.boundaryType === sdk.SpeechSynthesisBoundaryType.Word) grenzen.push({ ms: e.audioOffset / 10_000, positie: e.textOffset, woord: e.text })
  }
  const spreek = (ssml: string) => new Promise<{ mp3: Buffer; grenzen: Grens[] }>((klaar, fout) => {
    grenzen = []
    spreker.speakSsmlAsync(ssml, (r) => {
      if (r.reason === sdk.ResultReason.SynthesizingAudioCompleted) klaar({ mp3: Buffer.from(r.audioData), grenzen })
      else fout(new Error(r.errorDetails || `reden ${r.reason}`))
    }, (e) => fout(new Error(String(e))))
  })
  return { spreek, sluit: () => spreker.close() }
}

async function main() {
  mkdirSync(map, { recursive: true })
  const alles = nodig()
  const bestaat = (o: Opname) => existsSync(join(map, `${o.sleutel}.mp3`)) && (!o.woorden || existsSync(join(map, `${o.sleutel}.json`)))
  const te = alles.filter((o) => !bestaat(o))
  const tekens = te.reduce((n, o) => n + o.tekst.length, 0)
  console.log(`${alles.length} opnames nodig, ${te.length} nieuw (${tekens} tekens).`)

  // Wat niet meer nodig is (tekst gewijzigd of verwijderd) mag weg.
  const sleutels = new Set(alles.map((o) => o.sleutel))
  const weg = readdirSync(map).filter((f) => /\.(mp3|json)$/.test(f) && !sleutels.has(f.replace(/\.(mp3|json)$/, '')))
  if (!droog) for (const f of weg) rmSync(join(map, f))
  if (weg.length) console.log(`${weg.length} oude bestanden ${droog ? 'zouden gewist worden' : 'gewist'}.`)

  let fouten = 0
  if (droog) {
    for (const o of te.slice(0, 10)) console.log(`  ${o.stem} ${o.sleutel}: ${o.tekst.slice(0, 60)}`)
  } else if (te.length) {
    const key = process.env.AZURE_SPEECH_KEY, regio = process.env.AZURE_SPEECH_REGION
    if (!key || !regio) throw new Error('AZURE_SPEECH_KEY en AZURE_SPEECH_REGION ontbreken.')
    if (tekens > maxTekens) throw new Error(`${tekens} tekens is meer dan ${maxTekens}: dat lijkt een vergissing.`)
    let spreker = maakSpreker(key, regio)
    for (const [i, o] of te.entries()) {
      const { ssml, positie } = maakSsml(o.stem, o.tekst)
      let gelukt = false
      for (let poging = 1; poging <= 4 && !gelukt; poging++) {
        try {
          const { mp3, grenzen } = await binnen(60_000, spreker.spreek(ssml))
          writeFileSync(join(map, `${o.sleutel}.mp3`), mp3)
          if (o.woorden) writeFileSync(join(map, `${o.sleutel}.json`), JSON.stringify(woordtijden(o.tekst, grenzen, positie)))
          gelukt = true
        } catch (e) {
          console.warn(`  poging ${poging} mislukt voor ${o.sleutel}: ${(e as Error).message}`)
          // Opnieuw verbinden: na een fout of time-out kan de oude verbinding vastzitten.
          spreker.sluit()
          await wacht(poging * 20_000)
          spreker = maakSpreker(key, regio)
        }
      }
      if (!gelukt) fouten++
      console.log(`${i + 1}/${te.length} ${o.stem}: ${o.tekst.slice(0, 50)}${gelukt ? '' : ' (MISLUKT)'}`)
      await wacht(wachtMs)
    }
    spreker.sluit()
  }

  // De app kent alleen de opnames die er echt zijn; de rest leest de tabletstem.
  const klaar = alles.filter(bestaat)
  if (!droog) writeFileSync(lijst, JSON.stringify(klaar.map((o) => o.sleutel).sort(), null, 0) + '\n')
  console.log(`${klaar.length} van ${alles.length} opnames klaar.`)
  if (fouten) console.log(`::warning::${fouten} opnames mislukt; de volgende keer worden ze opnieuw geprobeerd.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
