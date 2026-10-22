import { useId } from 'react'
import type { Figuurtje as FiguurtjeData } from '../data/figuurtje.ts'
import { tekenFiguurtje, volledigeUitsnede } from '../lib/figuurtje/tekenen.ts'

/** Het figuurtje van een kind. `uitsnede` toont een deel, bv. alleen het hoofd. */
export default function Figuurtje({ figuurtje, uitsnede = volledigeUitsnede, label, className }: {
  figuurtje: FiguurtjeData; uitsnede?: string; label?: string; className?: string
}) {
  const id = useId()
  return (
    <svg className={className} viewBox={uitsnede} role={label ? 'img' : undefined} aria-label={label}
         aria-hidden={label ? undefined : true}
         dangerouslySetInnerHTML={{ __html: tekenFiguurtje(figuurtje, `fig${id}`) }} />
  )
}

/** Uitsnede met hoofd en schouders, voor in een rondje. */
export const hoofdUitsnede = '24 -14 152 170'
/** Uitsnede met hoofd en bovenlijf, voor Wie speelt er. */
export const borstbeeldUitsnede = '20 -14 160 200'
