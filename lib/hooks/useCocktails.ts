import { useState, useEffect, useCallback } from 'react';
import { cocktailDB } from '../database/cocktailDB';
import { Cocktail, SearchFilters } from '../types/cocktail';

export function useCocktails() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await cocktailDB.initialize();
      const allCocktails = cocktailDB.getAllCocktails();
      setCocktails(allCocktails);

      // If no cocktails loaded, force refresh from JSON
      if (allCocktails.length === 0) {
        await cocktailDB.forceRefreshFromJSON();
        setCocktails(cocktailDB.getAllCocktails());
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
    return cocktailDB.searchCocktails(query, filters);
  }, []);

  const getCocktailById = useCallback((id: string) => {
    return cocktailDB.getCocktailById(id);
  }, []);

  const addCocktail = useCallback((cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCocktail = cocktailDB.addCocktail(cocktail);
    setCocktails(cocktailDB.getAllCocktails());
    return newCocktail;
  }, []);

  const updateCocktail = useCallback((id: string, updates: Partial<Cocktail>) => {
    const updated = cocktailDB.updateCocktail(id, updates);
    if (updated) {
      setCocktails(cocktailDB.getAllCocktails());
    }
    return updated;
  }, []);

  const deleteCocktail = useCallback((id: string) => {
    const deleted = cocktailDB.deleteCocktail(id);
    if (deleted) {
      setCocktails(cocktailDB.getAllCocktails());
    }
    return deleted;
  }, []);

  const getAllCocktails = useCallback(() => {
    const all = cocktailDB.getAllCocktails();
    setCocktails(all);
    return all;
  }, []);

  const getCategories = useCallback(() => {
    return cocktailDB.getCategories();
  }, []);

  const getGlassTypes = useCallback(() => {
    return cocktailDB.getGlassTypes();
  }, []);

  const getIngredients = useCallback(() => {
    return cocktailDB.getIngredients();
  }, []);

  const getStats = useCallback(() => {
    return cocktailDB.getStats();
  }, []);

  const forceRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await cocktailDB.forceRefreshFromJSON();
      setCocktails(cocktailDB.getAllCocktails());
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
    getStats,
    forceRefresh,
  };
}
