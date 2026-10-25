import { useId } from 'react'
import type { Figuurtje } from '../data/figuurtje.ts'
import { metHuisStuk, type Huis, type HuisCategorieInfo } from '../data/huis.ts'
import { huisUitsnede, sceneUitsnede, tekenHuis, tekenTuinStuk, tuinUitsnede } from '../lib/huis/tekenen.ts'
import './huis.css'

/** Het huis van een kind: met lucht, tuin en figuurtje, of `kaal` (alleen het huis, voor de kleine prentjes). */
export default function HuisPrent({ huis, kaal = false, figuurtje, label, className = '' }: {
  huis: Huis; kaal?: boolean; figuurtje?: Figuurtje | null; label?: string; className?: string
}) {
  const id = useId()
  return (
    <svg className={`huis-scene ${className}`} viewBox={kaal ? huisUitsnede(huis.model) : sceneUitsnede(huis.model)}
         preserveAspectRatio={kaal ? undefined : 'xMidYMax meet'}
         role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
         dangerouslySetInnerHTML={{ __html: tekenHuis(huis, { id: `huis${id}`, kaal, figuurtje }) }} />
  )
}

/** Eén stuk uit de tuin op een stukje gras. */
export function TuinPrent({ stuk, className = '' }: { stuk: string; className?: string }) {
  return (
    <svg className={`huis-scene ${className}`} viewBox={tuinUitsnede} aria-hidden="true"
         dangerouslySetInnerHTML={{ __html: tekenTuinStuk(stuk) }} />
  )
}

/** Prentje van één keuze: het eigen huis met die keuze, of voor de tuin alleen dat stuk. */
export function HuisKeuzePrent({ huis, cat, stuk, className }: { huis: Huis; cat: HuisCategorieInfo; stuk: string; className?: string }) {
  if (cat.veld === 'tuin') return <TuinPrent stuk={stuk} className={className} />
  // Bij de extraatjes alleen dat ene, zodat de keuzes van elkaar verschillen.
  const h = cat.veld === 'extra' ? { ...huis, extra: [stuk] } : metHuisStuk(huis, cat, stuk)
  return <HuisPrent huis={h} kaal className={className} />
}
