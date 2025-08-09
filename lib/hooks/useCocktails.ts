import { useState, useEffect, useCallback, useMemo } from 'react';
import { cocktailDB } from '../database/cocktailDB';
import { Cocktail, SearchFilters } from '../types/cocktail';
import { useUserSettings } from '../contexts/UserContext';

export function useCocktails() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const { settings } = useUserSettings();

  // Filter cocktails based on subscription status
  const cocktails = useMemo(() => {
    if (!settings?.subscriptionStatus || settings.subscriptionStatus === 'premium') {
      // Premium users or unset status get all cocktails
      return allCocktails;
    }
    // Free users only get Tier 1 cocktails
    return allCocktails.filter(cocktail => cocktail.tier === 1);
  }, [allCocktails, settings?.subscriptionStatus]);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await cocktailDB.initialize();
      const loadedCocktails = cocktailDB.getAllCocktails();
      setAllCocktails(loadedCocktails);

      // If no cocktails loaded, force refresh from JSON
      if (loadedCocktails.length === 0) {
        await cocktailDB.forceRefreshFromJSON();
        setAllCocktails(cocktailDB.getAllCocktails());
      }
    } catch (err) {
      console.error('Failed to initialize cocktails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cocktails');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const searchCocktails = useCallback((query: string, filters?: SearchFilters) => {
    const results = cocktailDB.searchCocktails(query, filters);
    // Filter by subscription status
    if (settings?.subscriptionStatus === 'free') {
      return results.filter(cocktail => cocktail.tier === 1);
    }
    return results;
  }, [settings?.subscriptionStatus]);

  const getCocktailById = useCallback((id: string) => {
    return cocktailDB.getCocktailById(id);
  }, []);

  const addCocktail = useCallback((cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCocktail = cocktailDB.addCocktail(cocktail);
    setAllCocktails(cocktailDB.getAllCocktails());
    return newCocktail;
  }, []);

  const updateCocktail = useCallback((id: string, updates: Partial<Cocktail>) => {
    const updated = cocktailDB.updateCocktail(id, updates);
    if (updated) {
      setAllCocktails(cocktailDB.getAllCocktails());
    }
    return updated;
  }, []);

  const deleteCocktail = useCallback((id: string) => {
    const deleted = cocktailDB.deleteCocktail(id);
    if (deleted) {
      setAllCocktails(cocktailDB.getAllCocktails());
    }
    return deleted;
  }, []);

  const getAllCocktails = useCallback(() => {
    const all = cocktailDB.getAllCocktails();
    setAllCocktails(all);
    // Filter by subscription status
    if (settings?.subscriptionStatus === 'free') {
      return all.filter(cocktail => cocktail.tier === 1);
    }
    return all;
  }, [settings?.subscriptionStatus]);

  const getCategories = useCallback(() => {
    return cocktailDB.getCategories();
  }, []);

  const getGlassTypes = useCallback(() => {
    return cocktailDB.getGlassTypes();
  }, []);

  const getIngredients = useCallback(() => {
    return cocktailDB.getIngredients();
  }, []);

  const getIngredientsSortedByCocktailCount = useCallback(() => {
    return cocktailDB.getIngredientsSortedByCocktailCount();
  }, []);

  const getStats = useCallback(() => {
    return cocktailDB.getStats();
  }, []);

  const forceRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await cocktailDB.forceRefreshFromJSON();
      setAllCocktails(cocktailDB.getAllCocktails());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cocktails');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cocktails,
    isLoading,
    error,
    initialize,
    searchCocktails,
    getCocktailById,
    addCocktail,
    updateCocktail,
    deleteCocktail,
    getAllCocktails,
    getCategories,
    getGlassTypes,
    getIngredients,
    getIngredientsSortedByCocktailCount,
    getStats,
    forceRefresh,
  };
}
