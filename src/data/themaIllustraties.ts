import type { Kleur } from './gezin.ts'

/** Eigen prenten voor de themagalerij; nieuwe thema's kunnen hun SVG als terugval gebruiken. */
const metIllustratie = new Set<string>([
  'blauw', 'roze', 'lila', 'gras', 'ruimte', 'zee', 'dier', 'wolk', 'bak', 'kliniek', 'bouw', 'circus', 'speelgoed', 'trein', 'muziek', 'pyjamafeest', 'piraat', 'dans', 'kermis', 'brandweer', 'ijsjes', 'boerderij', 'speurder', 'bloemist', 'eenhoorn', 'vliegveld', 'manege', 'bijen', 'vulkaan', 'atelier', 'poezen', 'dinos', 'feeen', 'robotlab', 'tover', 'sneeuwpret', 'oranje', 'groen', 'paars',
])

export const themaIllustratie = (kleur: Kleur): string | null =>
  metIllustratie.has(kleur) ? `/themas/keuzes/${kleur}.webp` : null
