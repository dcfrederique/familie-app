import { useEffect, useRef, useState, type FormEvent } from 'react'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { stickers, stickerVan } from '../data/stickers.ts'
import type { Bericht } from '../lib/bron/types.ts'
import { perDag, uurVan } from '../lib/chat.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
import './chat.css'

const LUIDSPREKER = 'M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11'

/**
 * Het gesprek tussen één kind en de ouders (docs/chat.md). Aan kindzijde typt wie leest en tikt wie niet leest
 * op een sticker; aan oudzijde typen mama en papa. Berichten van de ouders worden voor wie niet leest voorgelezen.
 */
export default function Gesprek({ kind, kant, naam = 'mama of papa' }: { kind: Gebruiker; kant: 'kind' | 'ouder'; naam?: string }) {
  const { bron, gebruikers } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.chatBerichten(kind.id) : null, [bron, kind.id])
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [verstuurd, setVerstuurd] = useState(false)
  const einde = useRef<HTMLDivElement>(null)
  const aantal = data?.length ?? 0
  const metStickers = kant === 'kind'
  const magTypen = kant === 'ouder' || kind.kan_lezen
  const aan = kant === 'ouder' || kind.chat_aan
  const voorlezen = kant === 'kind' && !kind.kan_lezen && kanVoorlezen()

  // Open gesprek = gelezen. Alleen als er iets ongelezen van de ander is.
  const ongelezen = (data ?? []).some((b) => !b.gelezen_op && b.van !== kant)
  useEffect(() => {
    if (!bron || !ongelezen) return
    void bron.chatGelezen(kind.id).catch(() => undefined)
  }, [bron, kind.id, ongelezen])

  // Laat de server weten dat dit gesprek open is: dan krijgt dit toestel er geen melding bij.
  useEffect(() => {
    if (!bron) return
    const meld = () => { if (document.visibilityState === 'visible') void bron.chatAanwezig(kind.id).catch(() => undefined) }
    meld()
    const klok = window.setInterval(meld, 20_000)
    document.addEventListener('visibilitychange', meld)
    return () => { window.clearInterval(klok); document.removeEventListener('visibilitychange', meld) }
  }, [bron, kind.id])

  useEffect(() => { einde.current?.scrollIntoView({ block: 'end' }) }, [aantal])

  async function stuur(zin: string, sticker: string | null = null) {
    if (!bron || bezig) return
    setBezig(true)
    setFout('')
    try {
      await bron.chatSturen(kind.id, zin, sticker)
      setTekst('')
      await ververs()
      setVerstuurd(true)
      window.setTimeout(() => setVerstuurd(false), 2500)
    } catch (e) {
      setFout((e as Error).message.includes('te veel berichten') ? 'Even wachten, dan kan je weer iets sturen.' : foutmelding(e as Error))
    } finally {
      setBezig(false)
    }
  }

  const verzend = (e: FormEvent) => {
    e.preventDefault()
    if (tekst.trim()) void stuur(tekst)
  }
  // Wie schreef? Een kind is `kind`; bij een ouder zoeken we mama of papa op (bleef niemand over: een neutraal gezichtje).
  const afzender = (b: Bericht): Gebruiker | undefined => (b.van === 'kind' ? kind : gebruikers.find((g) => g.id === b.ouder_id))

  return (
    <section className={`gesprek gesprek-${kant}`} aria-label={`Gesprek met ${kant === 'kind' ? naam : kind.naam}`}>
      <div className="gesprek-lijst" role="log" aria-live="polite">
        {data && data.length === 0 && (
          <p className="gesprek-leeg">
            {kant === 'kind' ? (kind.kan_lezen ? `Stuur een berichtje naar ${naam}.` : 'Tik op een prentje om iets te zeggen.') : `Nog geen berichten van ${kind.naam}.`}
          </p>
        )}
        {perDag(data ?? []).map((blok) => (
          <div key={blok.kop} className="gesprek-dag">
            <p className="dag-kop"><span>{blok.kop}</span></p>
            {blok.berichten.map((b) => {
              const sticker = stickerVan(b.sticker)
              const mijn = b.van === kant
              const wie = afzender(b)
              // Aan kindzijde zie je wie van de ouders schreef; aan oudzijde zie je iedereen (jezelf, je partner en het kind).
              const toonGezicht = !mijn || kant === 'ouder'
              return (
                <div key={b.id} className={`bericht-rij ${mijn ? 'mijn' : 'andere'}`}>
                  {toonGezicht && <Gezicht gebruiker={wie} />}
                  <div className={`bericht ${mijn ? 'mijn' : 'andere'}${sticker ? ' met-sticker' : ''}`}>
                    {toonGezicht && b.van === 'ouder' && wie && <b className="bericht-naam">{wie.naam}</b>}
                    {sticker && <span className="bericht-emoji" aria-hidden="true">{sticker.emoji}</span>}
                    <span className="bericht-tekst">{b.tekst || sticker?.zin}</span>
                    <small className="bericht-voet">
                      {uurVan(b.aangemaakt_op)}{mijn && b.gelezen_op ? ' · gezien' : ''}
                    </small>
                    {voorlezen && !mijn && (
                      <button type="button" className="bericht-luister" aria-label="Luister" onClick={() => leesVoor(b.tekst)}>
                        <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d={LUIDSPREKER} /></svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={einde} />
      </div>

      {!aan ? (
        <p className="gesprek-uit">De chat staat uit. Vraag het aan mama of papa.</p>
      ) : (
        <div className="gesprek-schrijf">
          {fout && <p className="fout" role="alert">{fout}</p>}
          {verstuurd && kant === 'kind' && <p className="gesprek-ok" role="status">Verstuurd! {naam.charAt(0).toUpperCase() + naam.slice(1)} krijgt een melding.</p>}
          {metStickers && (
            <div className={`stickers${magTypen ? '' : ' groot'}`} role="group" aria-label="Stickers">
              {stickers.map((s) => (
                <button key={s.sleutel} type="button" className="sticker" disabled={bezig} onClick={() => void stuur(s.zin, s.sleutel)}
                        aria-label={s.zin}>
                  <span className="sticker-emoji" aria-hidden="true">{s.emoji}</span>
                  {magTypen && <span className="sticker-zin">{s.zin}</span>}
                </button>
              ))}
            </div>
          )}
          {magTypen && (
            <form className="gesprek-form" onSubmit={verzend}>
              <input type="text" value={tekst} maxLength={500} autoComplete="off" enterKeyHint="send"
                     placeholder={kant === 'kind' ? `Schrijf aan ${naam}…` : `Schrijf aan ${kind.naam}…`} aria-label="Bericht"
                     onChange={(e) => setTekst(e.target.value)} />
              <button type="submit" className="gesprek-verstuur" disabled={bezig || !tekst.trim()} aria-label="Versturen">
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 12L20 5l-4 15-4-6z" /><path d="M12 14l8-9" /></svg>
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

/** Het gezichtje van wie schreef: het figuurtje (kind of ouder), in een rondje. */
function Gezicht({ gebruiker }: { gebruiker?: Gebruiker }) {
  return (
    <span className={`gesprek-gezicht ${gebruiker ? kleurKlasse(gebruiker) : ''}`} aria-hidden="true">
      <Figuurtje figuurtje={figuurtjeVan(gebruiker ?? { figuurtje: null, thema: null })} uitsnede={hoofdUitsnede} />
    </span>
  )
}
