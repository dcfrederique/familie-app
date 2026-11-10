// Het gezinsdoel van de week (docs/wereld-nieuw.md, "Samen"): alle glinsters die de kinderen tussen maandag en zondag vinden,
// tellen samen. Haalt het gezin het doel, dan hangt de gezinsvlag in top op het plein. De server telt (wereld_glinster).

/** Zoveel glinsters zoekt het gezin samen per week (8 per gebied per dag per kind): samen haal je het, alleen is het veel werk. */
export const GEZINSDOEL = 100

/** De maandag van de week van `dag` ('YYYY-MM-DD'). */
export function weekBegin(dag: string): string {
  const [j, m, d] = dag.split('-').map(Number)
  const dt = new Date(Date.UTC(j, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7))
  return dt.toISOString().slice(0, 10)
}

/** Hoe hoog de vlag hangt, van 0 (onderaan) tot 10 (in top). */
export function vlagStand(totaal: number): number { return Math.max(0, Math.min(10, Math.floor(totaal / GEZINSDOEL * 10))) }

export const somVan = (per: Record<string, number>) => Object.values(per).reduce((n, x) => n + x, 0)

// Haalt het gezin het doel, dan neemt elk kind één keer per week een gezinsvlag mee voor het Schatboek (op de tablet bewaard).
const vlagSleutel = (kindId: string) => `dorp-gezinsvlag-${kindId}`
export function gehaaldDezeWeek(kindId: string, week: string): boolean {
  try { return localStorage.getItem(vlagSleutel(kindId)) === week } catch { return false }
}
export function zetGehaald(kindId: string, week: string) {
  try { localStorage.setItem(vlagSleutel(kindId), week) } catch { /* geen opslag */ }
}
