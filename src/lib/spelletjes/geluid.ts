// Korte piepjes met WebAudio, zonder geluidsbestanden.
import { geluidAan } from './opslag.ts'

let audio: AudioContext | null = null

function piep(tonen: number[]) {
  if (!geluidAan()) return
  try {
    audio ??= new AudioContext()
    let t = audio.currentTime
    for (const f of tonen) {
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      o.connect(g)
      g.connect(audio.destination)
      o.start(t)
      o.stop(t + 0.2)
      t += 0.12
    }
  } catch { /* geen geluid, geen probleem */ }
}

export const geluid = {
  hoera: () => piep([523, 659, 784]),
  oei: () => piep([330, 262]),
  draai: () => piep([700]),
  paar: () => piep([660, 880]),
}
