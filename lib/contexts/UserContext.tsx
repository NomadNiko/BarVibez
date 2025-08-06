import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserData, UserContextType, UserSettings, Venue } from '../types/user';
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
    removeCocktailFromVenue
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
  };
}