// Centralized glass image mapping for React Native bundler
// This ensures all glass types are properly mapped across the entire app

const glassImages = {
  'Balloon Glass': require('../../assets/glass/balloonGlass.jpg'),
  'Beer Glass': require('../../assets/glass/beerGlass.jpg'),
  'Beer Mug': require('../../assets/glass/beerMug.jpg'),
  'Beer Pilsner': require('../../assets/glass/beerPilsner.jpg'),
  'Brandy Snifter': require('../../assets/glass/brandySnifter.jpg'),
  'Champagne Flute': require('../../assets/glass/champagneFlute.jpg'),
  'Cocktail Glass': require('../../assets/glass/cocktailGlass.jpg'),
  'Coffee Mug': require('../../assets/glass/coffeeMug.jpg'),
  'Collins Glass': require('../../assets/glass/collinsGlass.jpg'),
  'Copper Mug': require('../../assets/glass/copperMug.jpg'),
  'Cordial Glass': require('../../assets/glass/cordialGlass.jpg'),
  'Coupe Glass': require('../../assets/glass/coupGlass.jpg'),
  'Highball Glass': require('../../assets/glass/highballGlass.jpg'),
  'Hurricane Glass': require('../../assets/glass/hurricanGlass.jpg'),
  'Irish Coffee Cup': require('../../assets/glass/irishCoffeeCup.jpg'),
  'Jar': require('../../assets/glass/jar.jpg'),
  'Julep Tin': require('../../assets/glass/julepTin.jpg'),
  'Margarita Glass': require('../../assets/glass/margaritaGlass.jpg'),
  'Margarita/Coupette Glass': require('../../assets/glass/MargaritaCoupetteGlass.jpg'),
  'Martini Glass': require('../../assets/glass/martiniGlass.jpg'),
  'Mason Jar': require('../../assets/glass/masonJar.jpg'),
  'Nick And Nora Glass': require('../../assets/glass/nickAndNoraGlass.jpg'),
  'Old-Fashioned Glass': require('../../assets/glass/oldFashionedGlass.jpg'),
  'Parfait Glass': require('../../assets/glass/parfaitGlass.jpg'),
  'Pint Glass': require('../../assets/glass/pintGlass.jpg'),
  'Pitcher': require('../../assets/glass/pitcher.jpg'),
  'Pousse Cafe Glass': require('../../assets/glass/pousseCafeGlass.jpg'),
  'Punch Bowl': require('../../assets/glass/punchBowl.jpg'),
  'Shot Glass': require('../../assets/glass/shotGlass.jpg'),
  'Whiskey Glass': require('../../assets/glass/whiskeyGlass.jpg'),
  'Whiskey Sour Glass': require('../../assets/glass/whiskeySourGlass.jpg'),
  'White Wine Glass': require('../../assets/glass/whiteWineGlass.jpg'),
  'Wine Glass': require('../../assets/glass/wineGlass.jpg'),
} as const;

const defaultGlassImage = require('../../assets/glass/cocktailGlass.jpg');

/**
 * Get glass image by exact glass type name (case-sensitive)
 * Falls back to default cocktail glass if not found
 */
export function getGlassImage(glassType: string) {
  return glassImages[glassType as keyof typeof glassImages] || defaultGlassImage;
}

/**
 * Get glass image by normalized glass type name (case-insensitive, no spaces/hyphens)
 * This is useful for the random and popular pages that normalize glass names
 */
export function getGlassImageNormalized(glassType: string) {
  const glassName = glassType.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  
  const normalizedGlassMap: Record<string, any> = {
    'balloonglass': glassImages['Balloon Glass'],
    'beerglass': glassImages['Beer Glass'],
    'beermug': glassImages['Beer Mug'],
    'beerpilsner': glassImages['Beer Pilsner'],
    'pilsner': glassImages['Beer Pilsner'],
    'brandysnifter': glassImages['Brandy Snifter'],
    'champagneflute': glassImages['Champagne Flute'],
    'cocktailglass': glassImages['Cocktail Glass'],
    'coffeemug': glassImages['Coffee Mug'],
    'collinsglass': glassImages['Collins Glass'],
    'coppermug': glassImages['Copper Mug'],
    'cordial': glassImages['Cordial Glass'],
    'cordialglass': glassImages['Cordial Glass'],
    'coupglass': glassImages['Coupe Glass'],
    'highballglass': glassImages['Highball Glass'],
    'hurricaneglass': glassImages['Hurricane Glass'],
    'irishcoffeecup': glassImages['Irish Coffee Cup'],
    'jar': glassImages['Jar'],
    'juleptin': glassImages['Julep Tin'],
    'margaritalgass': glassImages['Margarita Glass'], // Note: typo preserved from original
    'margaritacoupe': glassImages['Margarita/Coupette Glass'],
    'margaritacoupetteglass': glassImages['Margarita/Coupette Glass'],
    'margaritacoupette': glassImages['Margarita/Coupette Glass'],
    'martiniglass': glassImages['Martini Glass'],
    'masonjar': glassImages['Mason Jar'],
    'nickandnoraglass': glassImages['Nick And Nora Glass'],
    'oldfashionedglass': glassImages['Old-Fashioned Glass'],
    'parfaitglass': glassImages['Parfait Glass'],
    'pintglass': glassImages['Pint Glass'],
    'pitcher': glassImages['Pitcher'],
    'poussecafeglass': glassImages['Pousse Cafe Glass'],
    'punchbowl': glassImages['Punch Bowl'],
    'shotglass': glassImages['Shot Glass'],
    'whiskyglass': glassImages['Whiskey Glass'],
    'whiskeyglass': glassImages['Whiskey Glass'],
    'whiskeysour': glassImages['Whiskey Sour Glass'],
    'whiskysourglass': glassImages['Whiskey Sour Glass'],
    'whitwineglass': glassImages['White Wine Glass'], // Note: typo preserved from original
    'wineglass': glassImages['Wine Glass'],
  };
  
  return normalizedGlassMap[glassName] || defaultGlassImage;
}

/**
 * Get all glass images for preloading
 */
export function getAllGlassImages() {
  return Object.values(glassImages);
}

export default glassImages;