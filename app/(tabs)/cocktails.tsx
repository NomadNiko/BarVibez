import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { Container } from '~/components/Container';
import { CocktailCard } from '~/components/CocktailCard';
import { SearchFilters } from '~/components/SearchFilters';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { SearchFilters as SearchFiltersType, Cocktail } from '~/lib/types/cocktail';
// Removed cn import - no longer used

export default function CocktailsScreen() {
  const {
    cocktails,
    isLoading,
    error,
    searchCocktails,
    getCategories,
    getGlassTypes,
    getIngredients,
    getStats,
    forceRefresh,
  } = useCocktails();

  const [titleSearchQuery, setTitleSearchQuery] = useState('');
  const [debouncedTitleQuery, setDebouncedTitleQuery] = useState('');
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Cocktail[]>([]);

  // Get filter options
  const categories = useMemo(() => getCategories(), [getCategories]);
  const glassTypes = useMemo(() => getGlassTypes(), [getGlassTypes]);
  const allIngredients = useMemo(() => {
    const ingredients = getIngredients();
    return ingredients;
  }, [getIngredients]);
  const stats = useMemo(() => getStats(), [getStats]);

  // Debounce title search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitleQuery(titleSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [titleSearchQuery]);

  // Handle adding ingredient on Enter key
  const handleIngredientSubmit = () => {
    const trimmedQuery = ingredientSearchQuery.trim();
    if (trimmedQuery && !selectedIngredients.includes(trimmedQuery)) {
      setSelectedIngredients([...selectedIngredients, trimmedQuery]);
      setIngredientSearchQuery('');
    }
  };

  // Perform search when queries, filters, or selected ingredients change
  useEffect(() => {
    const hasTitleQuery = debouncedTitleQuery.trim().length > 0;
    const hasIngredients = selectedIngredients.length > 0;
    const hasFilters = Object.entries(filters).some(([key, value]) => {
      return value !== undefined && value !== '';
    });

    const filtersWithIngredients = {
      ...filters,
      ingredients: hasIngredients ? selectedIngredients : undefined,
    };

    let results: Cocktail[];
    
    if (hasTitleQuery || hasIngredients || hasFilters) {
      results = searchCocktails(debouncedTitleQuery, filtersWithIngredients);
    } else {
      results = [...cocktails];
    }
    
    // Always sort to show cocktails with images first
    const sortedResults = results.sort((a, b) => {
      // Cocktails with images come first
      if (a.image && !b.image) return -1;
      if (!a.image && b.image) return 1;
      // If both have images or both don't, maintain original order
      return 0;
    });
    
    setSearchResults(sortedResults);
  }, [debouncedTitleQuery, selectedIngredients, filters, cocktails, searchCocktails]);

  const handleRefresh = () => {
    forceRefresh();
  };

  const handleClearSearch = () => {
    setTitleSearchQuery('');
    setDebouncedTitleQuery('');
    setIngredientSearchQuery('');
    setSelectedIngredients([]);
    setFilters({});
    setShowFilters(false);
  };


  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter((ing) => ing !== ingredient));
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== undefined && value !== '';
  });

  const displayedCocktails = searchResults;

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 12, flex: 1 }}>
          <Container>
            <View className="flex-1 items-center justify-center">
              <Text className="mb-4 text-center text-destructive">{error}</Text>
              <Button onPress={handleRefresh}>
                <Text>Try Again</Text>
              </Button>
            </View>
          </Container>
        </View>
      </SafeAreaView>
    );
  }

  // Don't show UI until cocktails are loaded
  if (isLoading || cocktails.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 12, flex: 1 }}>
          <Container>
            <View className="flex-1 items-center justify-center">
              <Text className="mb-4 text-lg font-medium text-foreground">Loading cocktails...</Text>
              <Text className="text-center text-muted-foreground">
                Please wait while we load the cocktail database
              </Text>
            </View>
          </Container>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 12, flex: 1 }}>
        <Container>
        {/* Header */}
        <View className="pb-4 flex-row items-center justify-between">
          <View>
            <Text className="mb-2 text-2xl font-bold text-foreground">Cocktails</Text>
            <Text className="text-sm text-muted-foreground">
              Search from {stats.totalCocktails} recipes
            </Text>
          </View>
          <Button
            variant={hasActiveFilters ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center">
            <FontAwesome name="filter" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text>
              Filters
              {hasActiveFilters
                ? ` (${
                    Object.entries(filters).filter(([key, value]) => {
                      return value !== undefined && value !== '';
                    }).length
                  })`
                : ''}
            </Text>
          </Button>
        </View>

        {/* Filters */}
        {showFilters && (
          <View className="mb-4">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              glassTypes={glassTypes}
              isVisible={showFilters}
              onClose={() => setShowFilters(false)}
            />
          </View>
        )}

        {/* Search Bars */}
        <View className="mb-4">
          {/* Title Search */}
          <View className="mb-3">
            <Text className="mb-1 text-sm font-medium text-muted-foreground">Search by Name</Text>
            <View className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2">
              <FontAwesome name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search cocktail names..."
                value={titleSearchQuery}
                onChangeText={setTitleSearchQuery}
                className="flex-1 text-foreground"
                placeholderTextColor="#9CA3AF"
              />
              {titleSearchQuery && (
                <Button
                  variant="plain"
                  size="sm"
                  onPress={() => setTitleSearchQuery('')}
                  className="ml-2">
                  <FontAwesome name="times" size={16} color="#9CA3AF" />
                </Button>
              )}
            </View>
          </View>

          {/* Ingredient Search */}
          <View>
            <Text className="mb-1 text-sm font-medium text-muted-foreground">
              Search by Ingredients
            </Text>
            <View className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2">
              <FontAwesome name="list" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Type ingredient and press Enter..."
                value={ingredientSearchQuery}
                onChangeText={setIngredientSearchQuery}
                onSubmitEditing={handleIngredientSubmit}
                returnKeyType="done"
                className="flex-1 text-foreground"
                placeholderTextColor="#9CA3AF"
              />
              {ingredientSearchQuery.trim() && (
                <Pressable onPress={handleIngredientSubmit} className="ml-2">
                  <FontAwesome name="plus" size={16} color="#0066CC" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Selected Ingredients */}
          {selectedIngredients.length > 0 && (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {selectedIngredients.map((ingredient) => (
                <View
                  key={ingredient}
                  className="bg-primary/10 flex-row items-center rounded-full px-3 py-1">
                  <Text className="mr-1 text-sm text-primary">{ingredient}</Text>
                  <Pressable onPress={() => removeIngredient(ingredient)}>
                    <FontAwesome name="times-circle" size={16} color="#0066CC" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {/* Results Count */}
          <View className="mt-3">
            <Text className="text-sm text-muted-foreground text-center">
              {displayedCocktails.length} results
            </Text>
          </View>
        </View>

        {/* Results */}
        <FlatList
          data={displayedCocktails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CocktailCard cocktail={item} />}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-20">
              <FontAwesome name="search" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
              <Text className="mb-2 text-lg font-medium text-foreground">
                {isLoading ? 'Loading cocktails...' : 'No cocktails found'}
              </Text>
              <Text className="text-center text-muted-foreground">
                {isLoading
                  ? 'Please wait while we load the cocktail database'
                  : titleSearchQuery || selectedIngredients.length > 0 || hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Pull to refresh and load cocktails'}
              </Text>
            </View>
          )}
        />
        </Container>
      </View>
    </SafeAreaView>
  );
}
