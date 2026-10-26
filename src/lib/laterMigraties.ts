// Voor de catalogustests: de migraties vanaf de eerste nachtelijke uitbreiding (25 oktober 2026), zodat een nieuwe nacht
// geen test hoeft aan te passen. De rijen van een `insert into public.<tabel>` komen er met hun waarden uit.
const alle = import.meta.glob('../../supabase/migrations/*.sql', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

export const laterMigraties: string[] = Object.entries(alle)
  .filter(([pad]) => (pad.split('/').pop() ?? '') >= '20261025000300')
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, tekst]) => tekst)

/** De tekst van alle `insert into public.<tabel> ... ;` in de latere migraties. */
export function insertBlokken(tabel: string): string[] {
  const kop = `insert into public.${tabel}`
  return laterMigraties.flatMap((m) => {
    const blokken: string[] = []
    for (let van = m.indexOf(kop); van >= 0; van = m.indexOf(kop, van + 1)) blokken.push(m.slice(van, m.indexOf(';', van)))
    return blokken
  })
}
