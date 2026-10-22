// Toeval, met een vervangbare bron zodat de tests voorspelbaar zijn.
export type Willekeur = () => number

export const geheelGetal = (van: number, tot: number, rnd: Willekeur = Math.random) =>
  van + Math.floor(rnd() * (tot - van + 1))

export function schud<T>(lijst: readonly T[], rnd: Willekeur = Math.random): T[] {
  const a = lijst.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
