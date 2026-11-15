# Themagalerij — 15 november 2026

Mijn thema en het welkomstpad tonen maximaal acht kaarten per bladzijde, of vier op een laag scherm of smalle gsm. De galerij begint bij het bestaande thema. Draaien bewaart de huidige itempositie; een keuze op een latere bladzijde springt niet terug naar bladzijde één. Bewaren heeft een blokkering tegen overlappende verzoeken. Het eigen aankleedbare figuurtje is een afzonderlijk app-element linksboven.

## Prenten

Alle 39 bestaande keuzes hebben een afzonderlijke originele prent in `public/themas/keuzes/<kleur>.webp`, maximaal 960 × 640, WebP kwaliteit 84. De prenten worden alleen gebruikt in de themagalerij; de bestaande themakleuren en schermdecoraties blijven beschikbaar. Nieuwe thema's zonder kaartprent vallen terug op hun bestaande banner. De prenten worden vooraf bewaard door de service worker voor offline gebruik.

Gemaakt met de ingebouwde beeldgenerator. Gedeelde prompt: single full-bleed landscape 3:2 illustration, no UI, no text, no letters, no borders, no watermark; rich polished children's picture-book digital painting, charming rounded forms, vibrant yet gentle colors, soft painterly shading, warm welcoming light; focal subjects centered inside central 70%, readable at thumbnail size; original designs only, no brands or licensed characters, friendly ages 4–8.

| Sleutel | Scène in de generatieprompt |
| --- | --- |
| blauw | a friendly green dinosaur beside a red racing car, lush valley, tiny distant volcano |
| roze | a beautiful pink princess castle with turrets, flowers, rainbow and soft green hills |
| lila | a tiny mushroom cottage in a lilac fairy garden, butterflies, flowers, one small original fairy |
| gras | a sunny football pitch, prominent black and white football, goal, tiny stadium in distance |
| ruimte | a friendly red-and-white toy rocket flying among colorful planets and golden stars in deep blue space |
| zee | a friendly orange fish and turtle swimming above colorful coral in turquoise underwater world |
| dier | friendly farm animal friends, cow, piglet and chick in a grassy meadow, small red barn |
| wolk | a dreamy pastel cloud kingdom, rainbow, fluffy clouds and white winged unicorn |
| bak | a whimsical candy bakery counter with cupcakes, pastries and cookies, pink and cream decor |
| kliniek | a friendly dog and cat at a cheerful mint green veterinary clinic, toy stethoscope, kind cozy setting |
| bouw | a bright yellow excavator and red dump truck at a playful construction site with a crane |
| circus | a cheerful striped red and cream circus tent, colorful balloons, juggling balls |
| speelgoed | a cozy playroom with wooden train, teddy bear, toy blocks and toy robot |
| trein | a charming blue locomotive at a cozy train station, track, little clock tower |
| muziek | a colorful music stage with guitar, drums, microphone and floating musical notes |
| pyjamafeest | a cozy indoor sleepover tent, plush bunny, cushions, fairy lights and moon through window |
| piraat | a whimsical friendly pirate ship sailing on turquoise water, treasure chest, island, no weapons |
| dans | a pink ballet dance studio, ballet shoes and ribbons, warm light and mirrored wall |
| kermis | a colorful funfair, ferris wheel, carousel and festive bunting |
| brandweer | a cheerful red fire engine parked in front of a fire station, no fire or danger |
| ijsjes | a pastel ice cream shop with cones, scoops and sprinkles |
| boerderij | a picturesque red barn, friendly sheep, cow and piglet, sunny green fields |
| speurder | a playful detective desk, magnifying glass, notebook, footprints and little treasure map, cozy blue room |
| bloemist | a charming flower shop with overflowing bouquets, watering can and colorful potted flowers |
| eenhoorn | a friendly white unicorn in a meadow of pink and lilac flowers beneath a rainbow |
| vliegveld | a friendly blue and white passenger airplane on a sunny airfield, distant control tower |
| manege | a friendly chestnut pony at a cozy riding stable, green paddock and fence |
| bijen | cute happy bees around a wooden beehive in a sunny wildflower garden, golden honey |
| vulkaan | a tropical volcanic island, glowing orange stream high on a distant volcano, lush palm trees and blue lagoon, peaceful |
| atelier | a cozy art studio, easel with colorful painting, brushes, paint pots and palette |
| poezen | two adorable kittens curled in a soft pink wicker basket, ball of yarn, cozy sunny window |
| dinos | friendly green and orange dinosaurs in a lush prehistoric valley, fern leaves and waterfall |
| feeen | an enchanted forest with tiny glowing fairy houses in trees, a small original fairy, purple and green foliage |
| robotlab | two cute friendly original robots in a bright blue invention workshop, colorful gears and tools |
| tover | a whimsical magical school desk with purple wizard hat, wand, open spellbook and golden sparkles, original fantasy |
| sneeuwpret | a friendly snowman, sled and snow covered trees on a bright blue winter day |
| oranje | a harmonious orange monochrome playful landscape of warm orange rolling hills, a friendly golden sun, small orange paper kite, no characters |
| groen | a harmonious green monochrome playful landscape of soft grassy green hills, leafy trees and a little green paper kite, no characters |
| paars | a harmonious purple monochrome dreamy landscape of lavender hills, a violet paper kite, twinkling stars and crescent moon, no characters |

## Controle

`src/data/themaIllustraties.test.ts` controleert voor elke huidige keuze een uniek bestaand WebP-bestand. `e2e/thema.spec.ts` doorloopt alle bladzijden, controleert het laden van de prenten en het bewaren/heropenen van een keuze op de laatste bladzijde. Schermmetingen voor lezers en niet-lezers, licht en donker, op zes tablet- en gsmformaten; schermafdrukken staan in het workflow-artifact. De gerichte workflow draait bij wijzigingen aan de galerij in een pull request; de volledige nachtelijke schermcontrole blijft ongewijzigd.
