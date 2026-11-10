// Ingang voor de bundel van de proef: het echte chibi-figuurtje en de echte figuurtjesdata uit de app.
import { basisFiguurtje, type Figuurtje } from '../../src/data/figuurtje.ts'
import { tekenChibi } from '../../src/lib/wereld/chibi.ts'

const kinderen: Record<string, Figuurtje> = {
  Luca: { ...basisFiguurtje('blauw'), haar: 'kort', haarKleur: 'bruin', shirt: 'streep', shirtKleur: 'blauw', broek: 'lang', broekKleur: 'jeans' },
  Yuna: { ...basisFiguurtje('roze'), huid: 'goud', haar: 'staartjes', haarKleur: 'zwart', shirt: 'ster', shirtKleur: 'roze', broek: 'rok', broekKleur: 'paars' },
  Feline: { ...basisFiguurtje('paars'), haar: 'krullen', haarKleur: 'blond', shirt: 'tshirt', shirtKleur: 'paars', broek: 'short', broekKleur: 'geel' },
  Roos: { ...basisFiguurtje('roze'), huid: 'licht', haar: 'lang', haarKleur: 'rood', gezicht: 'lach', shirt: 'tshirt', shirtKleur: 'groen', broek: 'salopette', broekKleur: 'jeans', schoenen: 'laarzen', schoenKleur: 'geel' },
  Bram: { ...basisFiguurtje('blauw'), huid: 'perzik', haar: 'geen', gezicht: 'groot', shirt: 'tshirt', shirtKleur: 'wit', broek: 'lang', broekKleur: 'donker' },
}
;(window as unknown as Record<string, unknown>).Fig = { kinderen, tekenChibi }
