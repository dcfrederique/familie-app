// Op een tablet gaan de ouderschermen pas open na de pincode. De pincode blijft 5 minuten
// in het geheugen, zodat ouder-acties ze kunnen meesturen (de server controleert ze opnieuw).

const GELDIG_MS = 5 * 60 * 1000
let ontgrendeld: { pin: string; tot: number } | null = null

export function ontgrendel(pin: string, nu = Date.now()) {
  ontgrendeld = { pin, tot: nu + GELDIG_MS }
}

export function vergrendel() {
  ontgrendeld = null
}

/** De pincode als het slot nog open is, anders null. */
export function actievePin(nu = Date.now()): string | null {
  if (!ontgrendeld || ontgrendeld.tot <= nu) {
    ontgrendeld = null
    return null
  }
  return ontgrendeld.pin
}
