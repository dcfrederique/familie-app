// Ingang voor de bundel van het proefje: de echte tekening en data van het figuurtje uit de app.
import { basisFiguurtje, haarKleuren, huidKleuren, kledingKleuren, type Figuurtje } from '../../src/data/figuurtje.ts'
import { donkerder, tekenFiguurtje, volledigeUitsnede } from '../../src/lib/figuurtje/tekenen.ts'

const kinderen: Record<string, Figuurtje> = {
  Luca: { ...basisFiguurtje('blauw'), haar: 'kort', haarKleur: 'bruin', shirt: 'streep', shirtKleur: 'blauw', broek: 'lang', broekKleur: 'jeans', hoofd: 'pet' },
  Yuna: { ...basisFiguurtje('roze'), huid: 'goud', haar: 'staartjes', haarKleur: 'zwart', shirt: 'ster', shirtKleur: 'roze', broek: 'rok', broekKleur: 'paars', extra: 'geen' },
  Feline: { ...basisFiguurtje('paars'), haar: 'krullen', haarKleur: 'blond', shirt: 'tshirt', shirtKleur: 'paars', broek: 'short', broekKleur: 'geel', hoofd: 'kroon' },
}
;(window as unknown as Record<string, unknown>).Fig = { kinderen, haarKleuren, huidKleuren, kledingKleuren, donkerder, tekenFiguurtje, volledigeUitsnede }
