export type MeasurementSystem = 'ml' | 'oz';
export type SubscriptionStatus = 'free' | 'premium';

export interface CocktailIngredientInput {
  name: string;
  measure?: string;
}

export interface Venue {
  id: string;
  name: string;
  ingredients: string[]; // ingredient names
  cocktailIds: string[]; // IDs of cocktails from database
  customCocktailIds: string[]; // IDs of custom cocktails (future feature)
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean; // for My Speakeasy
}

export interface UserSettings {
  measurements: MeasurementSystem;
  subscriptionStatus?: SubscriptionStatus;
  // Future settings can be added here
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
}

export interface UserData {
  userId: string;
  appStoreId?: string;
  settings: UserSettings;
  favorites: string[]; // cocktail IDs
  customCocktails: string[]; // custom cocktail IDs  
  venues: Venue[]; // user's venues
  isPro: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  
  // Settings methods
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Favorites methods
  addFavorite: (cocktailId: string) => Promise<void>;
  removeFavorite: (cocktailId: string) => Promise<void>;
  isFavorite: (cocktailId: string) => boolean;
  
  // Venue methods
  createVenue: (name: string) => Promise<Venue>;
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  deleteVenue: (venueId: string) => Promise<void>;
  addIngredientToVenue: (venueId: string, ingredient: string) => Promise<void>;
  removeIngredientFromVenue: (venueId: string, ingredient: string) => Promise<void>;
  addCocktailToVenue: (venueId: string, cocktailId: string) => Promise<void>;
  removeCocktailFromVenue: (venueId: string, cocktailId: string) => Promise<void>;
  
  // User cocktail methods
  createUserCocktail: (
    name: string, 
    ingredients: CocktailIngredientInput[], 
    instructions: string, 
    glass: string, 
    venueIds: string[]
  ) => Promise<any>;
  getUserCocktail: (cocktailId: string) => any | null;
  getAllUserCocktails: () => any[];
  updateUserCocktail: (
    cocktailId: string,
    updates: {
      name?: string;
      ingredients?: CocktailIngredientInput[];
      instructions?: string;
      glass?: string;
      venueIds?: string[];
    }
  ) => Promise<void>;
  deleteUserCocktail: (cocktailId: string) => Promise<void>;
  addCustomCocktailToVenue: (venueId: string, cocktailId: string) => Promise<void>;
  removeCustomCocktailFromVenue: (venueId: string, cocktailId: string) => Promise<void>;
  
  // User management
  signIn: (appStoreId: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToProUser: () => Promise<void>;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  measurements: 'oz',
  subscriptionStatus: 'free',
  theme: 'auto',
  notifications: true,
};