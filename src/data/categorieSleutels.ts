// Voorstel voor de categorie van een artikel op de boodschappenlijst, uit de naam. De ouders kiezen zelf;
// wat ze ooit voor hetzelfde artikel kozen gaat voor (src/lib/boodschappen.ts). De sleutel is de naam van een
// standaardcategorie; heet de categorie bij een gezin anders, dan is er gewoon geen voorstel.
// Zuivel staat voor Groenten, zodat slagroom niet op 'sla' valt. Een woord van 4 letters of meer mag ergens in een woord staan (gehaktballetjes), kortere moeten vooraan staan.

export const categorieSleutels: [string, string[]][] = [
  ['Zuivel en eieren', ['melk', 'yoghurt', 'kaas', 'boter', 'room', 'ei', 'eieren', 'eitjes', 'mozzarella', 'parmezaan', 'pudding', 'kwark', 'platte kaas', 'cottage', 'slagroom', 'bechamel']],
  ['Groenten en fruit', ['appel', 'peer', 'banaan', 'sinaas', 'mandarijn', 'citroen', 'druif', 'aardbei', 'framboos', 'bosbes', 'meloen', 'ananas', 'kiwi',
    'tomaat', 'tomaten', 'komkommer', 'sla', 'wortel', 'ui', 'uien', 'look', 'prei', 'paprika', 'courgette', 'broccoli', 'bloemkool', 'spruit', 'spinazie',
    'champignon', 'aardappel', 'patatten', 'krieltjes', 'witloof', 'selder', 'avocado', 'groente', 'fruit', 'erwt', 'boontjes', 'mais', 'kruiden', 'peterselie']],
  ['Vlees en vis', ['gehakt', 'kip', 'kalkoen', 'nugget', 'worst', 'chipolata', 'ham', 'spek', 'spekblokjes', 'vlees', 'steak', 'biefstuk', 'kotelet', 'schnitzel',
    'rund', 'varken', 'gyros', 'balletjes', 'vis', 'zalm', 'kabeljauw', 'scampi', 'garnaal', 'garnalen', 'tonijn', 'mossel', 'visstick', 'beleg', 'salami', 'pasteitjes']],
  ['Brood en ontbijt', ['brood', 'boterham', 'broodje', 'pistolet', 'sandwich', 'croissant', 'wrap', 'wraps', 'toast', 'cornflakes', 'muesli', 'havermout', 'confituur', 'choco', 'pindakaas', 'hagelslag', 'speculoos', 'pitabroodjes', 'bladerdeeg', 'pizzadeeg']],
  ['Droge voeding', ['pasta', 'spaghetti', 'macaroni', 'penne', 'rijst', 'noedels', 'bloem', 'suiker', 'zout', 'olie', 'azijn', 'saus', 'ketchup', 'mayonaise', 'mosterd',
    'bouillon', 'soep', 'blik', 'kidneybonen', 'tomatenblokjes', 'tomatenpuree', 'kokosmelk', 'currypasta', 'pesto', 'lasagnevellen', 'sojasaus', 'kruiden', 'peper']],
  ['Diepvries', ['diepvries', 'frieten', 'friet', 'kroketten', 'pizza', 'ijs', 'ijsjes', 'vissticks', 'diepgevroren']],
  ['Dranken', ['water', 'cola', 'limonade', 'fruitsap', 'sap', 'bier', 'wijn', 'koffie', 'thee', 'sirop', 'frisdrank', 'fristi', 'chocomelk', 'ice tea']],
  ['Snoep en koeken', ['snoep', 'chips', 'koek', 'koekjes', 'chocolade', 'chocolat', 'bonbon', 'gum', 'drop', 'taart', 'cake', 'wafels', 'poedersuiker', 'chocoladereep', 'popcorn', 'noten']],
  ['Huishouden', ['wc-papier', 'toiletpapier', 'keukenrol', 'vuilniszak', 'vuilniszakken', 'afwasmiddel', 'waspoeder', 'wasmiddel', 'wasverzachter', 'schoonmaak', 'spons', 'batterij',
    'batterijen', 'lamp', 'zakdoekjes', 'aluminiumfolie', 'bakpapier', 'vaatwas', 'tabletten']],
  ['Verzorging', ['shampoo', 'tandpasta', 'tandenborstel', 'zeep', 'douchegel', 'deodorant', 'luiers', 'billendoekjes', 'zonnecrème', 'watten', 'wattenstaafjes', 'scheer', 'haarborstel']],
]
