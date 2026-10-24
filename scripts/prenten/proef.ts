// De 10 proefprenten (docs/prenten.md, stap 1): drie referentieprenten van de vaste personages, vijf bladzijden
// uit bestaande verhalen (alle drie de reeksen) en twee kleurplaten. Frederique keurt hiermee de stijl goed.
import { opdracht } from './stijl.ts'

export interface Prentopdracht { naam: string; prompt: string; soort: 'prent' | 'kleurplaat' }

const prent = (naam: string, scene: string, figuren: string[]): Prentopdracht =>
  ({ naam, prompt: opdracht(scene, figuren), soort: 'prent' })
const plaat = (naam: string, scene: string, figuren: string[]): Prentopdracht =>
  ({ naam, prompt: opdracht(scene, figuren, 'kleurplaat'), soort: 'kleurplaat' })

export const proef: Prentopdracht[] = [
  prent('ref-dirk', 'Dirk staat vooraan en kijkt vrolijk naar de kijker, effen lichte achtergrond. Referentieprent van het personage.', ['dirk']),
  prent('ref-mo', 'Mo zit rechtop en zwaait, effen lichte achtergrond. Referentieprent van het personage.', ['mo']),
  prent('ref-pip', 'Pip staat met de vleugeltjes open en lacht, effen lichte achtergrond. Referentieprent van het personage.', ['pip']),
  prent('01-dirk-telt-sterren', 'Op een heuvel bij nacht ligt Dirk in het gras en telt de sterren aan de hemel. Een grote maan.', ['dirk']),
  prent('14-mo-zonnebloem', 'Mo staat in een tuin naast een reusachtige zonnebloem die veel groter is dan hij, en kijkt omhoog. Een houten hek.', ['mo']),
  prent('03-pip-zwemmen', 'Pip staat aan de rand van een blauwe zee met ijsschotsen en kijkt naar andere pinguïns die zwemmen.', ['pip']),
  prent('16-dirk-hik', 'Dirk heeft de hik: bij elke hik komt er een klein wolkje rook uit zijn neus. Hij zit in een bloemenwei en kijkt verbaasd.', ['dirk']),
  prent('23-missie-maan', 'Een kleine zelfgemaakte raket van karton staat in een achtertuin bij zonsondergang, klaar om naar de maan te vliegen.', []),
  plaat('kleurplaat-dirk', 'Dirk zit naast een huisje met een boom en een zon.', ['dirk']),
  plaat('kleurplaat-mo-pip', 'Mo en Pip bouwen samen een zandkasteel op het strand.', ['mo', 'pip']),
]
