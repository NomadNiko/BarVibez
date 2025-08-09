import { Cocktail, UserCocktail, SearchFilters } from '../types/cocktail';
import { UserDataManager } from '../services/userDataManager';
import { cocktailDB } from '../database/cocktailDB';

// Combined cocktail type for search results
export type CombinedCocktail = (Cocktail | UserCocktail) & {
  isUserCreated?: boolean;
};

/**
 * Search both regular cocktails and user cocktails, prioritizing user cocktails
 */
export function searchAllCocktails(
  query: string, 
  filters?: SearchFilters & { excludeIds?: string[] }
): CombinedCocktail[] {
  const normalizedQuery = query.toLowerCase().trim();
  const results: CombinedCocktail[] = [];
  const excludeIds = new Set(filters?.excludeIds || []);

  // Get user cocktails first (they will be prioritized)
  const userCocktails = UserDataManager.getAllUserCocktails()
    .filter(cocktail => {
      if (excludeIds.has(cocktail.id)) return false;
      
      // Text search
      const matchesQuery = 
        !query ||
        cocktail.name.toLowerCase().includes(normalizedQuery);
      
      if (!matchesQuery) return false;
      
      // Apply filters (user cocktails have limited filtering options)
      if (filters?.glass && cocktail.glass !== filters.glass) return false;
      
      if (filters?.ingredients && filters.ingredients.length > 0) {
        const cocktailIngredientNames = cocktail.ingredients.map((ing) => ing.name.toLowerCase());
        const hasAllIngredients = filters.ingredients.every((filterIng) => {
          const filterIngLower = filterIng.toLowerCase();
          return cocktailIngredientNames.some(
            (ingName) => ingName === filterIngLower || ingName.includes(filterIngLower)
          );
        });
        if (!hasAllIngredients) return false;
      }
      
      return true;
    })
    .map(cocktail => ({ ...cocktail, isUserCreated: true }));

  // Get regular cocktails from database
  const regularCocktails = cocktailDB
    .searchCocktails(query, filters)
    .filter(cocktail => !excludeIds.has(cocktail.id))
    .map(cocktail => ({ ...cocktail, isUserCreated: false }))
    .reverse(); // Reverse the order of regular cocktails

  // Combine results: user cocktails first, then regular cocktails
  results.push(...userCocktails);
  results.push(...regularCocktails);

  return results;
}

/**
 * Get all cocktails (user + regular) for a venue, prioritizing user cocktails
 */
export function getVenueAllCocktails(venueId: string): CombinedCocktail[] {
  const results: CombinedCocktail[] = [];
  
  // Get user cocktails for this venue
  const userCocktails = UserDataManager.getAllUserCocktails()
    .filter(c => c.venues.includes(venueId))
    .map(c => ({ ...c, isUserCreated: true }));
  
  // For regular cocktails, we need venue data from UserDataManager
  const userData = UserDataManager.getCurrentUser();
  if (!userData) return userCocktails;
  
  const venue = userData.venues.find(v => v.id === venueId);
  if (!venue) return userCocktails;
  
  // Get regular cocktails for this venue
  const cocktailIds = venue.isDefault ? userData.favorites : venue.cocktailIds;
  const regularCocktails = cocktailIds
    .map(id => cocktailDB.getCocktailById(id))
    .filter((c): c is Cocktail => c !== null)
    .map(c => ({ ...c, isUserCreated: false }));
  
  // Combine: user cocktails first
  results.push(...userCocktails);
  results.push(...regularCocktails);
  
  // Sort by name within each group
  const sortedUserCocktails = results
    .filter(c => c.isUserCreated)
    .sort((a, b) => a.name.localeCompare(b.name));
  const sortedRegularCocktails = results
    .filter(c => !c.isUserCreated)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return [...sortedUserCocktails, ...sortedRegularCocktails];
}

/**
 * Get suggested cocktails based on venue ingredients, including user cocktails
 */
export function getSuggestedCocktails(
  venueIngredients: string[],
  excludeIds: string[] = []
): Array<{ cocktail: CombinedCocktail; score: number; matchingIngredients: number }> {
  if (venueIngredients.length === 0) return [];
  
  const venueIngredientsLower = venueIngredients.map(i => i.toLowerCase().trim());
  const excludeIdsSet = new Set(excludeIds);
  const results: Array<{ cocktail: CombinedCocktail; score: number; matchingIngredients: number }> = [];

  // Get user cocktails
  const userCocktails = UserDataManager.getAllUserCocktails()
    .filter(cocktail => !excludeIdsSet.has(cocktail.id));
  
  // Score user cocktails
  userCocktails.forEach(cocktail => {
    const cocktailIngredients = cocktail.ingredients.map(i => i.name.toLowerCase().trim());
    const matchingIngredients = cocktailIngredients.filter(ci => 
      venueIngredientsLower.includes(ci)
    ).length;
    
    if (matchingIngredients > 0) {
      const totalIngredients = cocktail.ingredients.length;
      const score = matchingIngredients / totalIngredients;
      
      results.push({
        cocktail: { ...cocktail, isUserCreated: true },
        score,
        matchingIngredients
      });
    }
  });

  // Get regular cocktails
  const allRegularCocktails = cocktailDB.getAllCocktails()
    .filter(cocktail => !excludeIdsSet.has(cocktail.id));

  // Score regular cocktails
  allRegularCocktails.forEach(cocktail => {
    const cocktailIngredients = cocktail.ingredients.map(i => i.name.toLowerCase().trim());
    const matchingIngredients = cocktailIngredients.filter(ci => 
      venueIngredientsLower.includes(ci)
    ).length;
    
    if (matchingIngredients > 0) {
      const totalIngredients = cocktail.ingredients.length;
      const score = matchingIngredients / totalIngredients;
      
      results.push({
        cocktail: { ...cocktail, isUserCreated: false },
        score,
        matchingIngredients
      });
    }
  });

  // Sort by score (descending), then by matching ingredients (descending), prioritizing user cocktails
  return results.sort((a, b) => {
    // Prioritize user cocktails
    if (a.cocktail.isUserCreated && !b.cocktail.isUserCreated) return -1;
    if (!a.cocktail.isUserCreated && b.cocktail.isUserCreated) return 1;
    
    // Then by score
    if (b.score !== a.score) return b.score - a.score;
    
    // Then by matching ingredients count
    if (b.matchingIngredients !== a.matchingIngredients) {
      return b.matchingIngredients - a.matchingIngredients;
    }
    
    // Finally alphabetically
    return a.cocktail.name.localeCompare(b.cocktail.name);
  });
}