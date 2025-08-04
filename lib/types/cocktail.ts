export interface CocktailIngredient {
  name: string;
  measure?: string;
}

export interface CocktailInstructions {
  en: string;
  [key: string]: string;
}

export interface Cocktail {
  id: string;
  name: string;
  externalId: string;
  alternateName: string | null;
  category: string;
  alcoholic: string;
  glass: string;
  instructions: CocktailInstructions;
  ingredients: CocktailIngredient[];
  image: string | null;
  video: string | null;
  tags: string[];
  iba: string | null;
  imageSource: string | null;
  imageAttribution: string | null;
  creativeCommonsConfirmed: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CocktailDatabase {
  metadata: {
    exportDate: string;
    totalCocktails: number;
    version: string;
    environment: string;
  };
  cocktails: Record<string, Cocktail>;
}

export interface SearchFilters {
  alcoholic?: string;
  category?: string;
  glass?: string;
  ingredients?: string[];
}
