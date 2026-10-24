import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import './bladzijden.css'

// Raster dat op tablet en pc nooit scrollt: wat niet past, komt op een volgende bladzijde met pijlen.
// Het raster meet zijn eigen plaats en kiest zoveel kolommen en rijen als er vakken van de minimummaat in passen.
// Op een smal of laag scherm (gsm) blijft het een gewone lijst die scrollt.

const GROOT = '(min-width: 961px) and (min-height: 560px)'

export interface Vakmaat {
  /** Kleinste breedte en hoogte van een vak, in px. */
  breed: number
  hoog: number
  gap: number
  /** Grootste hoogte van een rij; zonder vult een rij de vrije hoogte. */
  maxHoog?: number
  /** Tegels met vaste vorm (hoogte gedeeld door breedte): kies kolommen en rijen zo dat ze zo groot mogelijk worden. */
  verhouding?: number
}

/** Maat voor kaarten met een prent en een titel (verhalen, kleurplaten). */
export const kaartMaat: Vakmaat = { breed: 200, hoog: 240, gap: 18, maxHoog: 270 }

interface Raster { kolommen: number; rijen: number; celB: number; celH: number }

function useRaster(maat: Vakmaat | null, aantal: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [raster, setRaster] = useState<Raster | null>(null)
  const { breed = 0, hoog = 0, gap = 0, maxHoog, verhouding } = maat ?? {}
  const metMaat = maat !== null
  useLayoutEffect(() => {
    const el = ref.current
    if (!metMaat || !el || typeof ResizeObserver === 'undefined') return
    const mq = window.matchMedia(GROOT)
    function meet() {
      if (!el || !mq.matches) return setRaster(null)
      const { width, height } = el.getBoundingClientRect()
      const maxK = Math.max(1, Math.floor((width + gap) / (breed + gap)))
      const maxR = Math.max(1, Math.floor((height + gap) / (hoog + gap)))
      let kolommen = maxK, rijen = maxR
      if (verhouding) {
        // Zo weinig mogelijk rijen voor wat op één bladzijde moet; zo worden de tegels zo groot mogelijk.
        const m = Math.min(aantal, maxK * maxR)
        rijen = Math.min(maxR, Array.from({ length: maxR }, (_, i) => i + 1).find((r) => Math.ceil(m / r) <= maxK) ?? maxR)
        kolommen = Math.min(maxK, Math.ceil(m / rijen))
      }
      const celB = (width - gap * (kolommen - 1)) / kolommen
      const celH = Math.min(maxHoog ?? Infinity, (height - gap * (rijen - 1)) / rijen)
      setRaster((r) => r && r.kolommen === kolommen && r.rijen === rijen && Math.abs(r.celB - celB) < 1 && Math.abs(r.celH - celH) < 1
        ? r : { kolommen, rijen, celB, celH })
    }
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    mq.addEventListener('change', meet)
    return () => { ro.disconnect(); mq.removeEventListener('change', meet) }
  }, [metMaat, breed, hoog, gap, maxHoog, verhouding, aantal])
  return { ref, raster }
}

/**
 * Toont `items` per bladzijde. Met `maat` meet het raster zelf hoeveel er passen; met `perBlad` ligt het aantal vast
 * (de opmaak van het raster komt dan uit `className`).
 */
export default function Bladzijden<T>({ items, maat = null, perBlad, className = '', label, toon }: {
  items: T[]; maat?: Vakmaat | null; perBlad?: number; className?: string; label: string; toon: (item: T) => ReactNode
}) {
  const { ref, raster } = useRaster(maat, items.length)
  const [blad, setBlad] = useState(0)
  const n = perBlad ?? (raster ? raster.kolommen * raster.rijen : items.length)
  const bladen = Math.max(1, Math.ceil(items.length / Math.max(1, n)))
  const nu = Math.min(blad, bladen - 1)
  const stijl = raster && maat ? {
    gridTemplateColumns: `repeat(${raster.kolommen}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${raster.rijen}, minmax(0, ${maat.maxHoog ? `${raster.celH}px` : '1fr'}))`,
    gap: maat.gap, '--cel-b': `${raster.celB}px`, '--cel-h': `${raster.celH}px`, '--verhouding': maat.verhouding ?? 1,
  } as CSSProperties : undefined

  return (
    <div className={`bladzijden${raster || perBlad ? ' vast' : ''}`}>
      <div ref={ref} className={`blad ${className}`} style={stijl}>
        {items.slice(nu * n, nu * n + n).map(toon)}
      </div>
      {bladen > 1 && (
        <nav className="blader" aria-label={label}>
          <button type="button" className="rond blader-knop" aria-label="Vorige bladzijde" disabled={nu === 0} onClick={() => setBlad(nu - 1)}>
            <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <span className="blader-stippen" aria-label={`Bladzijde ${nu + 1} van ${bladen}`} role="img">
            {Array.from({ length: bladen }, (_, i) => <i key={i} className={i === nu ? 'nu' : ''} />)}
          </span>
          <button type="button" className="rond blader-knop" aria-label="Volgende bladzijde" disabled={nu === bladen - 1} onClick={() => setBlad(nu + 1)}>
            <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </nav>
      )}
    </div>
  )
}
