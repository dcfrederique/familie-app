// Meldingen op de gsm van een ouder (web-push). De server stuurt ze; hier zetten we ze aan of uit.
import { supabase } from './supabase.ts'

const publiekeSleutel = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type MeldingStatus = 'kan-niet' | 'geweigerd' | 'uit' | 'aan'

export function kanMelden(): boolean {
  return !!supabase && !!publiekeSleutel && typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** VAPID-sleutel (base64url) als bytes, zoals pushManager.subscribe die wil. */
export function sleutelBytes(b64: string): Uint8Array<ArrayBuffer> {
  const opgevuld = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const ruw = atob(opgevuld)
  const bytes = new Uint8Array(new ArrayBuffer(ruw.length))
  for (let i = 0; i < ruw.length; i++) bytes[i] = ruw.charCodeAt(i)
  return bytes
}

export async function meldingStatus(): Promise<MeldingStatus> {
  if (!kanMelden()) return 'kan-niet'
  if (Notification.permission === 'denied') return 'geweigerd'
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ? 'aan' : 'uit'
}

export async function meldingenAanzetten(): Promise<MeldingStatus> {
  if (!kanMelden()) return 'kan-niet'
  if (await Notification.requestPermission() !== 'granted') return 'geweigerd'
  const reg = await navigator.serviceWorker.ready
  const abonnement = await reg.pushManager.getSubscription()
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: sleutelBytes(publiekeSleutel!) })
  const { endpoint, keys } = abonnement.toJSON()
  const { error } = await supabase!.rpc('push_abonneren', { p_endpoint: endpoint, p_p256dh: keys?.p256dh, p_auth: keys?.auth })
  if (error) { await abonnement.unsubscribe(); throw error }
  return 'aan'
}

export async function meldingenUitzetten(): Promise<MeldingStatus> {
  const reg = await navigator.serviceWorker.getRegistration()
  const abonnement = await reg?.pushManager.getSubscription()
  if (abonnement) {
    await supabase?.rpc('push_afmelden', { p_endpoint: abonnement.endpoint })
    await abonnement.unsubscribe()
  }
  return 'uit'
}
