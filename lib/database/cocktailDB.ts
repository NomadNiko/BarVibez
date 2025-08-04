import { MMKV } from 'react-native-mmkv';
import { Cocktail, CocktailDatabase, SearchFilters } from '../types/cocktail';

// Static glass types and categories for immediate availability
const GLASS_TYPES = [
  'Balloon Glass',
  'Beer Glass',
  'Beer Mug',
  'Beer Pilsner',
  'Brandy Snifter',
  'Champagne Flute',
  'Cocktail Glass',
  'Coffee Mug',
  'Collins Glass',
  'Copper Mug',
  'Cordial Glass',
  'Coupe Glass',
  'Highball Glass',
  'Hurricane Glass',
  'Irish Coffee Cup',
  'Jar',
  'Margarita Glass',
  'Margarita/Coupette Glass',
  'Martini Glass',
  'Mason Jar',
  'Nick And Nora Glass',
  'Old-Fashioned Glass',
  'Parfait Glass',
  'Pint Glass',
  'Pitcher',
  'Pousse Cafe Glass',
  'Punch Bowl',
  'Shot Glass',
  'Whiskey Glass',
  'Whiskey Sour Glass',
  'White Wine Glass',
  'Wine Glass',
];

const CATEGORIES = [
  'Beer',
  'Brandy',
  'Classic Cocktails',
  'Cocktail',
  'Cocoa',
  'Coffee / Tea',
  'Homemade Liqueur',
  'Non-alcoholic Drinks',
  'Ordinary Drink',
  'Other / Unknown',
  'Punch / Party Drink',
  'Shake',
  'Shooters',
  'Shot',
  'Soft Drink',
];

class CocktailDB {
  private storage: MMKV;
  private cocktails: Map<string, Cocktail> = new Map();
  private isInitialized = false;

  constructor() {
    this.storage = new MMKV({
      id: 'cocktail-database',
      encryptionKey: 'cocktail-app-secret-key',
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try to load from MMKV first
      const storedData = this.storage.getString('cocktails');
      if (storedData) {
        const parsed = JSON.parse(storedData) as CocktailDatabase;
        this.loadCocktailsFromData(parsed);
        this.isInitialized = true;
        return;
      }

      // If no stored data, load from JSON file
      await this.loadFromJSON();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize cocktail database:', error);
      throw error;
    }
  }

  private async loadFromJSON(): Promise<void> {
    try {
      const cocktailData = require('../../assets/cocktails-export-01.json') as CocktailDatabase;
      this.loadCocktailsFromData(cocktailData);

      // Store in MMKV for faster future loads
      this.storage.set('cocktails', JSON.stringify(cocktailData));
      this.storage.set('metadata', JSON.stringify(cocktailData.metadata));
    } catch (error) {
      console.error('Failed to load cocktails from JSON:', error);
      throw error;
    }
  }

  private loadCocktailsFromData(data: CocktailDatabase): void {
    this.cocktails.clear();
    Object.values(data.cocktails).forEach((cocktail) => {
      this.cocktails.set(cocktail.id, cocktail);
    });
  }

  getAllCocktails(): Cocktail[] {
    return Array.from(this.cocktails.values());
  }

  getCocktailById(id: string): Cocktail | null {
    return this.cocktails.get(id) || null;
  }

  searchCocktails(query: string, filters?: SearchFilters): Cocktail[] {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAllCocktails().filter((cocktail) => {
      // Text search - only search names, not ingredients
      const matchesQuery =
        !query ||
        cocktail.name.toLowerCase().includes(normalizedQuery) ||
        cocktail.alternateName?.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;

      // Apply filters
      if (filters?.alcoholic && cocktail.alcoholic !== filters.alcoholic) return false;
      if (filters?.category && cocktail.category !== filters.category) return false;
      if (filters?.glass && cocktail.glass !== filters.glass) return false;
      if (filters?.hasImage !== undefined) {
        const hasImage = cocktail.image !== null && cocktail.image !== '';
        if (filters.hasImage !== hasImage) return false;
      }

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
    });
  }

  addCocktail(cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>): Cocktail {
    const now = new Date().toISOString();
    const newCocktail: Cocktail = {
      ...cocktail,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.cocktails.set(newCocktail.id, newCocktail);
    this.saveToStorage();

    return newCocktail;
  }

  updateCocktail(id: string, updates: Partial<Cocktail>): Cocktail | null {
    const existing = this.cocktails.get(id);
    if (!existing) return null;

    const updated: Cocktail = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    this.cocktails.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  deleteCocktail(id: string): boolean {
    const deleted = this.cocktails.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  private saveToStorage(): void {
    try {
      const cocktailsObject = Object.fromEntries(this.cocktails);
      const data: CocktailDatabase = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalCocktails: this.cocktails.size,
          version: '1.0',
          environment: 'mobile-app',
        },
        cocktails: cocktailsObject,
      };

      this.storage.set('cocktails', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cocktails to storage:', error);
    }
  }

  getCategories(): string[] {
    return CATEGORIES;
  }

  getGlassTypes(): string[] {
    return GLASS_TYPES;
  }

  getIngredients(): string[] {
    const ingredients = new Set<string>();
    this.getAllCocktails().forEach((cocktail) => {
      cocktail.ingredients.forEach((ing) => {
        ingredients.add(ing.name);
      });
    });
    const result = Array.from(ingredients).sort();
    return result;
  }

  clearDatabase(): void {
    this.cocktails.clear();
    this.storage.clearAll();
    this.isInitialized = false;
  }

  async forceRefreshFromJSON(): Promise<void> {
    this.cocktails.clear();
    this.storage.clearAll();
    this.isInitialized = false;
    await this.initialize();
  }

  getStats() {
    return {
      totalCocktails: this.cocktails.size,
      categories: CATEGORIES.length,
      glasses: GLASS_TYPES.length,
      ingredients: this.getIngredients().length,
    };
  }
}

// Singleton instance
export const cocktailDB = new CocktailDB();
