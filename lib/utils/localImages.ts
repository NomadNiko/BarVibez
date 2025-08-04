import { cocktailImageMap } from './cocktailImageMap';

// Local cocktail image mapping using static map
export const getCocktailImage = (imageName: string | null): any => {
  if (!imageName) return null;
  
  const result = cocktailImageMap[imageName] || null;
  return result;
};