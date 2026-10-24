// Kleuren voor kleurplaten en vrij tekenen: een vast palet en een venster om zelf een kleur te kiezen.

export const palet = ['#E53935', '#F2994A', '#F7D046', '#7CC36E', '#2E8A3C', '#5DB7E8', '#2D6BD6', '#8E6CC9',
  '#F28DB2', '#8B5E3C', '#F5CBA7', '#26303A']

// Vrij kiezen: twaalf tinten in vijf helderheden, plus grijzen en huidskleuren.
const hsl = (h: number, s: number, l: number) => {
  const f = (n: number) => {
    const k = (n + h / 30) % 12, a = (s / 100) * Math.min(l / 100, 1 - l / 100)
    return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}
const vrijeKleuren = [
  ...[88, 74, 58, 44, 30].flatMap((l) => Array.from({ length: 12 }, (_, i) => hsl(i * 30, 80, l))),
  '#FFFFFF', '#E0E0E0', '#B0B0B0', '#808080', '#505050', '#000000',
  '#FDE3CF', '#F3C9A1', '#E0A878', '#C68642', '#8D5524', '#5C3A21',
]

export function KleurKiezer({ kleur, kies, sluit }: { kleur: string | null; kies: (k: string) => void; sluit: () => void }) {
  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label="Kies een kleur" onClick={sluit}>
      <div className="kleur-kiezer" onClick={(e) => e.stopPropagation()}>
        <div className="kleur-kiezer-kop">
          <h2 className="display">Kies een kleur</h2>
          <button type="button" className="rond groot" aria-label="Sluiten" onClick={sluit}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="kleur-kiezer-raster">
          {vrijeKleuren.map((k) => (
            <button key={k} type="button" className="kleur-vak" style={{ background: k }} aria-pressed={kleur === k}
                    aria-label={`Kleur ${k}`} onClick={() => kies(k)} />
          ))}
        </div>
      </div>
    </div>
  )
}
