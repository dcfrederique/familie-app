// Ingang voor de bundel van de proef: het echte chibi-figuurtje en de echte figuurtjesdata uit de app (geen bibliotheek).
import { basisFiguurtje, type Figuurtje } from '../../src/data/figuurtje.ts'
import { tekenChibi } from '../../src/lib/wereld/chibi.ts'

const kinderen: Record<string, Figuurtje> = {
  Luca: { ...basisFiguurtje('blauw'), haar: 'kort', haarKleur: 'bruin', shirt: 'streep', shirtKleur: 'blauw', broek: 'lang', broekKleur: 'jeans', hoofd: 'geen' },
  Yuna: { ...basisFiguurtje('roze'), huid: 'goud', haar: 'staartjes', haarKleur: 'zwart', shirt: 'ster', shirtKleur: 'roze', broek: 'rok', broekKleur: 'paars', extra: 'geen' },
  Feline: { ...basisFiguurtje('paars'), haar: 'krullen', haarKleur: 'blond', shirt: 'tshirt', shirtKleur: 'paars', broek: 'short', broekKleur: 'geel', hoofd: 'geen' },
}
;(window as unknown as Record<string, unknown>).Fig = { kinderen, tekenChibi }
