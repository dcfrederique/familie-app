import { useCallback, useEffect, useState } from 'react'

/**
 * Laadt gegevens en ververst ze om de 20 seconden en wanneer de app weer zichtbaar wordt,
 * zodat een goedkeuring op de gsm snel op de tablet verschijnt.
 */
export function useGegevens<T>(laad: (() => Promise<T>) | null, afhankelijk: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [fout, setFout] = useState('')

  const ververs = useCallback(async () => {
    if (!laad) return
    try {
      setData(await laad())
      setFout('')
    } catch (e) {
      setFout((e as Error).message)
    }
  }, afhankelijk)

  useEffect(() => {
    void ververs()
    const klok = window.setInterval(() => void ververs(), 20_000)
    const zichtbaar = () => { if (document.visibilityState === 'visible') void ververs() }
    document.addEventListener('visibilitychange', zichtbaar)
    return () => {
      window.clearInterval(klok)
      document.removeEventListener('visibilitychange', zichtbaar)
    }
  }, [ververs])

  return { data, fout, ververs }
}
