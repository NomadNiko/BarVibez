import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserData, UserContextType, UserSettings } from '../types/user';
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

  const contextValue: UserContextType = {
    userData,
    isLoading,
    error,
    updateSettings,
    addFavorite,
    removeFavorite,
    isFavorite,
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