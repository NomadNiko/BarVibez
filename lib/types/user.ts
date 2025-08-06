export type MeasurementSystem = 'ml' | 'oz';

export interface UserSettings {
  measurements: MeasurementSystem;
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
  
  // User management
  signIn: (appStoreId: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToProUser: () => Promise<void>;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  measurements: 'oz',
  theme: 'auto',
  notifications: true,
};