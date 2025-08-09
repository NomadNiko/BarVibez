import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserData, UserContextType, UserSettings, Venue, CocktailIngredientInput } from '../types/user';
import { UserCocktail } from '../types/cocktail';
import { UserDataManager } from '../services/userDataManager';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize user data manager
    try {
      const initialUserData = UserDataManager.initialize();
      
      // Force ensure default venue exists
      if (initialUserData && (!initialUserData.venues || !initialUserData.venues.some(v => v.isDefault))) {
        console.log('Creating default venue for existing user');
        const defaultVenue = {
          id: `venue_default_${initialUserData.userId}`,
          name: 'My Speakeasy',
          ingredients: [],
          cocktailIds: [],
          customCocktailIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: true,
        };
        
        initialUserData.venues = [defaultVenue, ...(initialUserData.venues || [])];
        UserDataManager.forceUpdateUserData(initialUserData);
      }
      
      setUserData(initialUserData);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }

    // Subscribe to user data changes
    const unsubscribe = UserDataManager.subscribe((newUserData) => {
      setUserData(newUserData);
    });

    return unsubscribe;
  }, []);

  const updateSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    try {
      setError(null);
      UserDataManager.updateSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    }
  };

  const addFavorite = async (cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.addToFavorites(cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite';
      setError(errorMessage);
      throw err;
    }
  };

  const removeFavorite = async (cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.removeFromFavorites(cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite';
      setError(errorMessage);
      throw err;
    }
  };

  const isFavorite = (cocktailId: string): boolean => {
    return UserDataManager.isFavorite(cocktailId);
  };

  const signIn = async (appStoreId: string): Promise<void> => {
    try {
      setError(null);
      const newUserData = UserDataManager.signIn(appStoreId);
      setUserData(newUserData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      UserDataManager.signOut();
      // UserData will be updated via the subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  };

  const upgradeToProUser = async (): Promise<void> => {
    try {
      setError(null);
      UserDataManager.upgradeToProUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade to Pro';
      setError(errorMessage);
      throw err;
    }
  };

  const createVenue = async (name: string): Promise<Venue> => {
    try {
      setError(null);
      return UserDataManager.createVenue(name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create venue';
      setError(errorMessage);
      throw err;
    }
  };

  const updateVenue = async (venueId: string, updates: Partial<Venue>): Promise<void> => {
    try {
      setError(null);
      UserDataManager.updateVenue(venueId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update venue';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteVenue = async (venueId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.deleteVenue(venueId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete venue';
      setError(errorMessage);
      throw err;
    }
  };

  const addIngredientToVenue = async (venueId: string, ingredient: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.addIngredientToVenue(venueId, ingredient);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add ingredient';
      setError(errorMessage);
      throw err;
    }
  };

  const removeIngredientFromVenue = async (venueId: string, ingredient: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.removeIngredientFromVenue(venueId, ingredient);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove ingredient';
      setError(errorMessage);
      throw err;
    }
  };

  const addCocktailToVenue = async (venueId: string, cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.addCocktailToVenue(venueId, cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cocktail';
      setError(errorMessage);
      throw err;
    }
  };

  const removeCocktailFromVenue = async (venueId: string, cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.removeCocktailFromVenue(venueId, cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove cocktail';
      setError(errorMessage);
      throw err;
    }
  };

  // User cocktail methods
  const createUserCocktail = async (
    name: string, 
    ingredients: CocktailIngredientInput[], 
    instructions: string, 
    glass: string, 
    venueIds: string[]
  ): Promise<UserCocktail> => {
    try {
      setError(null);
      return UserDataManager.createUserCocktail(name, ingredients, instructions, glass, venueIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cocktail';
      setError(errorMessage);
      throw err;
    }
  };

  const getUserCocktail = (cocktailId: string): UserCocktail | null => {
    return UserDataManager.getUserCocktail(cocktailId);
  };

  const getAllUserCocktails = (): UserCocktail[] => {
    return UserDataManager.getAllUserCocktails();
  };

  const updateUserCocktail = async (
    cocktailId: string,
    updates: {
      name?: string;
      ingredients?: CocktailIngredientInput[];
      instructions?: string;
      glass?: string;
      venueIds?: string[];
    }
  ): Promise<void> => {
    try {
      setError(null);
      UserDataManager.updateUserCocktail(cocktailId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cocktail';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteUserCocktail = async (cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.deleteUserCocktail(cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cocktail';
      setError(errorMessage);
      throw err;
    }
  };

  const addCustomCocktailToVenue = async (venueId: string, cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.addCustomCocktailToVenue(venueId, cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cocktail to venue';
      setError(errorMessage);
      throw err;
    }
  };

  const removeCustomCocktailFromVenue = async (venueId: string, cocktailId: string): Promise<void> => {
    try {
      setError(null);
      UserDataManager.removeCustomCocktailFromVenue(venueId, cocktailId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove cocktail from venue';
      setError(errorMessage);
      throw err;
    }
  };

  const contextValue: UserContextType = {
    userData,
    isLoading,
    error,
    updateSettings,
    addFavorite,
    removeFavorite,
    isFavorite,
    createVenue,
    updateVenue,
    deleteVenue,
    addIngredientToVenue,
    removeIngredientFromVenue,
    addCocktailToVenue,
    removeCocktailFromVenue,
    createUserCocktail,
    getUserCocktail,
    getAllUserCocktails,
    updateUserCocktail,
    deleteUserCocktail,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue,
    signIn,
    signOut,
    upgradeToProUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Convenience hooks for specific functionality
export function useUserSettings() {
  const { userData, updateSettings } = useUser();
  return {
    settings: userData?.settings || null,
    updateSettings,
  };
}

export function useFavorites() {
  const { userData, addFavorite, removeFavorite, isFavorite } = useUser();
  return {
    favorites: userData?.favorites || [],
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}

export function useProStatus() {
  const { userData, upgradeToProUser } = useUser();
  return {
    isPro: userData?.isPro || false,
    upgradeToProUser,
  };
}

export function useVenues() {
  const { 
    userData, 
    createVenue, 
    updateVenue, 
    deleteVenue,
    addIngredientToVenue,
    removeIngredientFromVenue,
    addCocktailToVenue,
    removeCocktailFromVenue,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue
  } = useUser();
  
  return {
    venues: userData?.venues || [],
    createVenue,
    updateVenue,
    deleteVenue,
    addIngredientToVenue,
    removeIngredientFromVenue,
    addCocktailToVenue,
    removeCocktailFromVenue,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue,
  };
}

export function useUserCocktails() {
  const {
    createUserCocktail,
    getUserCocktail,
    getAllUserCocktails,
    updateUserCocktail,
    deleteUserCocktail,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue
  } = useUser();
  
  return {
    createUserCocktail,
    getUserCocktail,
    getAllUserCocktails,
    updateUserCocktail,
    deleteUserCocktail,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue,
  };
}