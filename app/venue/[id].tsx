import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, TextInput, FlatList, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { BackButton } from '~/components/BackButton';
import { 
  useVenues, 
  useFavorites,
  useUserSettings,
  useUserCocktails 
} from '~/lib/contexts/UserContext';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Venue } from '~/lib/types/user';
import { Cocktail, UserCocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImageNormalized } from '~/lib/utils/glassImageMap';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';
import { searchAllCocktails, CombinedCocktail, getVenueAllCocktails } from '~/lib/utils/combinedSearch';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type TabType = 'cocktails' | 'ingredients';

// Combined cocktail type for display
type DisplayCocktail = (Cocktail | UserCocktail) & {
  isUserCreated?: boolean;
};

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { 
    venues, 
    addIngredientToVenue, 
    removeIngredientFromVenue,
    addCocktailToVenue,
    removeCocktailFromVenue,
    addCustomCocktailToVenue,
    removeCustomCocktailFromVenue
  } = useVenues();
  const { favorites, isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { settings } = useUserSettings();
  const { cocktails, getIngredients, getIngredientsSortedByCocktailCount } = useCocktails();
  const { getAllUserCocktails } = useUserCocktails();
  
  const [activeTab, setActiveTab] = useState<TabType>('cocktails');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCocktail, setPreviewCocktail] = useState<DisplayCocktail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const venue = venues.find(v => v.id === id);
  const allIngredients = useMemo(() => getIngredients(), [getIngredients]);
  const ingredientsSortedByCount = useMemo(() => getIngredientsSortedByCocktailCount(), [getIngredientsSortedByCocktailCount]);

  // Get cocktails for this venue using the proper utility function
  const venueCocktails = useMemo(() => {
    if (!venue) return [];
    return getVenueAllCocktails(venue.id);
  }, [venue]);

  // Get missing ingredients from venue cocktails
  const missingIngredients = useMemo(() => {
    if (!venue || venueCocktails.length === 0) return [];
    
    // Get all unique ingredients from venue cocktails
    const allCocktailIngredients = new Set<string>();
    venueCocktails.forEach(cocktail => {
      cocktail.ingredients.forEach(ing => {
        allCocktailIngredients.add(ing.name);
      });
    });
    
    // Filter out ingredients already in venue - use exact matching only
    const venueIngredientsLower = venue.ingredients.map(i => i.toLowerCase().trim());
    const missing = Array.from(allCocktailIngredients).filter(ing => {
      const ingLower = ing.toLowerCase().trim();
      return !venueIngredientsLower.includes(ingLower);
    });
    
    // Sort alphabetically
    return missing.sort((a, b) => a.localeCompare(b));
  }, [venue, venueCocktails]);

  // Get suggested cocktails based on venue ingredients
  const suggestedCocktails = useMemo(() => {
    if (!venue || venue.ingredients.length === 0) return [];
    
    const venueIngredients = venue.ingredients.map(i => i.toLowerCase().trim());
    const cocktailIds = venue.isDefault ? favorites : venue.cocktailIds;
    
    // Filter available cocktails (not already in venue)
    const availableCocktails = cocktails.filter(c => !cocktailIds.includes(c.id));
    
    // Score each cocktail by ingredient matches
    const scoredCocktails = availableCocktails.map(cocktail => {
      const cocktailIngredients = cocktail.ingredients.map(i => i.name.toLowerCase().trim());
      const matchingIngredients = cocktailIngredients.filter(ci => 
        venueIngredients.includes(ci)
      );
      const missingCount = cocktailIngredients.length - matchingIngredients.length;
      const hasAllIngredients = missingCount === 0;
      
      return {
        cocktail,
        score: matchingIngredients.length,
        totalIngredients: cocktailIngredients.length,
        matchingIngredients,
        missingCount,
        hasAllIngredients
      };
    });
    
    // Filter only cocktails with at least one match and sort
    return scoredCocktails
      .filter(s => s.score > 0)
      .sort((a, b) => {
        // First priority: cocktails with all ingredients (0 missing)
        if (a.hasAllIngredients && !b.hasAllIngredients) return -1;
        if (!a.hasAllIngredients && b.hasAllIngredients) return 1;
        
        // Second priority: fewer missing ingredients
        if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
        
        // Third priority: more complex cocktails (more total ingredients) when missing count is same
        return b.totalIngredients - a.totalIngredients;
      })
      .slice(0, 50); // Limit to top 50 suggestions
  }, [venue, cocktails, favorites]);

  // Filter items for search
  const filteredItems = useMemo(() => {
    if (activeTab === 'cocktails') {
      // Get all existing cocktail IDs in this venue (regular + custom)
      const existingIds = new Set();
      
      if (venue) {
        // Add regular cocktail IDs
        const cocktailIds = venue.isDefault ? favorites : venue.cocktailIds;
        cocktailIds.forEach(id => existingIds.add(id));
        
        // Add custom cocktail IDs that are already in this venue
        const allUserCocktails = getAllUserCocktails();
        allUserCocktails
          .filter(c => c.venues.includes(venue.id))
          .forEach(c => existingIds.add(c.id));
      }
      
      // Search all cocktails (regular + user), excluding ones already in venue
      const availableCocktails = searchAllCocktails(
        searchQuery, 
        { excludeIds: Array.from(existingIds) }
      );
      
      // Limit results if no search query
      return searchQuery ? availableCocktails : availableCocktails.slice(0, 50);
    } else {
      // Use cached ingredients sorted by cocktail count
      const availableIngredientsSorted = ingredientsSortedByCount.filter(item => 
        !venue?.ingredients.includes(item.ingredient)
      );
      
      // Filter by search query if provided
      const filteredIngredients = searchQuery 
        ? availableIngredientsSorted.filter(item => 
            item.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : availableIngredientsSorted;
      
      // Return just the ingredient names, limited to 50 for performance
      return filteredIngredients.slice(0, 50).map(item => item.ingredient);
    }
  }, [activeTab, searchQuery, cocktails, ingredientsSortedByCount, venue, favorites, getAllUserCocktails]);

  if (!venue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ffffff' }}>Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddCocktail = async (cocktailId: string, isUserCocktail: boolean = false) => {
    try {
      console.log('Adding cocktail:', cocktailId, 'isUserCocktail:', isUserCocktail, 'to venue:', venue.id);
      if (isUserCocktail) {
        console.log('Using addCustomCocktailToVenue');
        await addCustomCocktailToVenue(venue.id, cocktailId);
      } else {
        console.log('Using addCocktailToVenue');
        await addCocktailToVenue(venue.id, cocktailId);
      }
      console.log('Successfully added cocktail');
      setShowAddModal(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding cocktail:', error);
      Alert.alert('Error', `Failed to add cocktail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveCocktail = async (cocktailId: string) => {
    // Find the cocktail in either regular or user cocktails
    const regularCocktail = cocktails.find(c => c.id === cocktailId);
    const userCocktails = getAllUserCocktails();
    const userCocktail = userCocktails.find(c => c.id === cocktailId);
    
    const cocktail = regularCocktail || userCocktail;
    const cocktailName = cocktail?.name || 'this cocktail';
    const isUserCocktail = !!userCocktail;
    
    Alert.alert(
      'Remove Cocktail',
      `Are you sure you want to remove "${cocktailName}" from ${venue?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isUserCocktail && !venue?.isDefault) {
                // Remove custom cocktail from non-default venue
                await removeCustomCocktailFromVenue(venue.id, cocktailId);
              } else {
                // Remove regular cocktail or handle default venue
                await removeCocktailFromVenue(venue.id, cocktailId);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove cocktail');
            }
          },
        },
      ]
    );
  };

  const handleAddIngredient = async (ingredient: string) => {
    try {
      await addIngredientToVenue(venue.id, ingredient);
      // Don't close modal, don't clear search query - stay focused
      // The ingredient will be automatically removed from the filtered list
      // because it's now in venue.ingredients
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredient');
    }
  };

  const handleRemoveIngredient = async (ingredient: string) => {
    try {
      await removeIngredientFromVenue(venue.id, ingredient);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove ingredient');
    }
  };

  const handlePreviewCocktail = (cocktail: DisplayCocktail) => {
    console.log('Preview cocktail:', cocktail);
    console.log('Setting preview cocktail and showing modal');
    setPreviewCocktail(cocktail);
    setShowPreviewModal(true);
  };

  const handleFavoriteToggle = async (cocktailId: string, event: any) => {
    event.stopPropagation();
    
    try {
      if (isFavorite(cocktailId)) {
        await removeFavorite(cocktailId);
      } else {
        await addFavorite(cocktailId);
      }
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  };

  const cocktailHasMissingIngredients = (cocktail: Cocktail): boolean => {
    if (!venue) return false;
    
    const venueIngredientsLower = venue.ingredients.map(i => i.toLowerCase().trim());
    const cocktailIngredients = cocktail.ingredients.map(ing => ing.name.toLowerCase().trim());
    
    return cocktailIngredients.some(ci => 
      !venueIngredientsLower.includes(ci)
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#333333',
        }}>
          <BackButton />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 20, color: '#ffffff' }}>
              {venue.name}
            </Text>
            {venue.isDefault && (
              <Text style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}>
                Synced with your favorites
              </Text>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={{ 
          flexDirection: 'row', 
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#333333',
        }}>
          <Pressable
            onPress={() => setActiveTab('cocktails')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'cocktails' ? '#10B981' : 'transparent',
            }}>
            <Text style={{
              fontSize: 16,
              fontWeight: activeTab === 'cocktails' ? '600' : '400',
              color: activeTab === 'cocktails' ? '#10B981' : '#888888',
            }}>
              Cocktails ({venueCocktails.length})
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('ingredients')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'ingredients' ? '#10B981' : 'transparent',
            }}>
            <Text style={{
              fontSize: 16,
              fontWeight: activeTab === 'ingredients' ? '600' : '400',
              color: activeTab === 'ingredients' ? '#10B981' : '#888888',
            }}>
              Ingredients ({venue.ingredients.length})
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeTab === 'cocktails' ? (
            <View style={{ paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#333333',
                  }}>
                  <FontAwesome name="plus" size={16} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#10B981', fontSize: 14 }}>
                    {venue.isDefault ? 'Add to Favorites' : 'Add Cocktails'}
                  </Text>
                </Pressable>
                
                {venue.ingredients.length > 0 && (
                  <Pressable
                    onPress={() => setShowSuggestModal(true)}
                    style={{
                      flex: 1,
                      backgroundColor: '#1a1a1a',
                      borderRadius: 8,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#9C27B0',
                    }}>
                    <FontAwesome name="lightbulb-o" size={16} color="#9C27B0" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#9C27B0', fontSize: 14 }}>
                      Suggest Cocktails
                    </Text>
                  </Pressable>
                )}
              </View>

              {venueCocktails.map((cocktail) => (
                <View
                  key={cocktail.id}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ color: '#ffffff', fontSize: 16 }}>
                        {cocktail.name}
                      </Text>
                      {cocktail.isUserCreated && (
                        <View style={{
                          backgroundColor: '#007AFF',
                          borderRadius: 6,
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          marginLeft: 8
                        }}>
                          <Text style={{ color: '#ffffff', fontSize: 8 }}>CUSTOM</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: '#888888', fontSize: 12 }}>
                      {cocktail.isUserCreated ? 'Custom Recipe' : cocktail.category} • {cocktail.glass}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {/* Missing Ingredients Indicator */}
                    {cocktailHasMissingIngredients(cocktail) && (
                      <View style={{ padding: 8 }}>
                        <FontAwesome name="exclamation" size={16} color="#FF8F00" />
                      </View>
                    )}
                    
                    <Pressable
                      onPress={() => handlePreviewCocktail(cocktail)}
                      style={{ 
                        backgroundColor: '#007AFF',
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        minWidth: 45,
                        alignItems: 'center'
                      }}>
                      <FontAwesome name="eye" size={16} color="#ffffff" />
                    </Pressable>
                    
                    <Pressable
                      onPress={() => handleRemoveCocktail(cocktail.id)}
                      style={{ padding: 8 }}>
                      <FontAwesome name="times" size={18} color="#FF6B6B" />
                    </Pressable>
                  </View>
                </View>
              ))}
              
              {venueCocktails.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <FontAwesome name="glass" size={48} color="#333333" style={{ marginBottom: 16 }} />
                  <Text style={{ color: '#888888', fontSize: 16 }}>
                    {venue.isDefault ? 'No favorites yet' : 'No cocktails added'}
                  </Text>
                  <Text style={{ color: '#666666', fontSize: 14, marginTop: 4 }}>
                    Tap the button above to add cocktails
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#333333',
                  }}>
                  <FontAwesome name="plus" size={16} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#10B981', fontSize: 14 }}>
                    Add Ingredients
                  </Text>
                </Pressable>
                
                {missingIngredients.length > 0 && (
                  <Pressable
                    onPress={() => setShowMissingModal(true)}
                    style={{
                      flex: 1,
                      backgroundColor: '#1a1a1a',
                      borderRadius: 8,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#FF8F00',
                    }}>
                    <FontAwesome name="exclamation-triangle" size={16} color="#FF8F00" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FF8F00', fontSize: 14 }}>
                      Missing ({missingIngredients.length})
                    </Text>
                  </Pressable>
                )}
              </View>

              {venue.ingredients.map((ingredient) => (
                <View
                  key={ingredient}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, flex: 1 }}>
                    {ingredient}
                  </Text>
                  
                  <Pressable
                    onPress={() => handleRemoveIngredient(ingredient)}
                    style={{ padding: 8 }}>
                    <FontAwesome name="times" size={18} color="#FF6B6B" />
                  </Pressable>
                </View>
              ))}
              
              {venue.ingredients.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <FontAwesome name="flask" size={48} color="#333333" style={{ marginBottom: 16 }} />
                  <Text style={{ color: '#888888', fontSize: 16 }}>
                    No ingredients added
                  </Text>
                  <Text style={{ color: '#666666', fontSize: 14, marginTop: 4 }}>
                    Tap the button above to add ingredients
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Modal */}
        {showAddModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1, paddingHorizontal: 16 }}>
                {/* Modal Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  paddingVertical: 16,
                }}>
                  <Text style={{ 
                    flex: 1,
                    fontSize: 20, 
 
                    color: '#ffffff',
                        }}>
                    Add {activeTab === 'cocktails' ? 'Cocktails' : 'Ingredients'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowAddModal(false);
                      setSearchQuery('');
                    }}
                    style={{ padding: 8 }}>
                    <FontAwesome name="times" size={24} color="#888888" />
                  </Pressable>
                </View>

                {/* Search Bar */}
                <View style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <FontAwesome name="search" size={16} color="#888888" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={`Search ${activeTab}...`}
                    placeholderTextColor="#666666"
                    style={{
                      flex: 1,
                      color: '#ffffff',
                      fontSize: 16,
                    }}
                    autoFocus
                  />
                </View>

                {/* Results */}
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => 
                    activeTab === 'cocktails' 
                      ? (item as CombinedCocktail).id 
                      : item as string
                  }
                  renderItem={({ item }) => {
                    if (activeTab === 'cocktails') {
                      const cocktail = item as CombinedCocktail;
                      return (
                        <View
                          style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                              <Text style={{ color: '#ffffff', fontSize: 16 }}>
                                {cocktail.name}
                              </Text>
                              {cocktail.isUserCreated && (
                                <View style={{
                                  backgroundColor: '#007AFF',
                                  borderRadius: 6,
                                  paddingHorizontal: 4,
                                  paddingVertical: 1,
                                  marginLeft: 8
                                }}>
                                  <Text style={{ color: '#ffffff', fontSize: 8 }}>CUSTOM</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: '#888888', fontSize: 12 }}>
                              {cocktail.isUserCreated ? 'Custom Recipe' : (cocktail as Cocktail).category}
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/* Preview Button */}
                            <Pressable
                              onPress={() => handlePreviewCocktail(cocktail)}
                              style={{ 
                                backgroundColor: '#007AFF',
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                minWidth: 45,
                                alignItems: 'center'
                              }}>
                              <FontAwesome name="eye" size={16} color="#ffffff" />
                            </Pressable>
                            
                            {/* Add Button */}
                            <Pressable
                              onPress={() => handleAddCocktail(cocktail.id, cocktail.isUserCreated)}
                              style={{ 
                                backgroundColor: '#10B981',
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                minWidth: 45,
                                alignItems: 'center'
                              }}>
                              <FontAwesome name="plus-circle" size={18} color="#ffffff" />
                            </Pressable>
                          </View>
                        </View>
                      );
                    } else {
                      const ingredient = item as string;
                      return (
                        <Pressable
                          onPress={() => handleAddIngredient(ingredient)}
                          style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                          <Text style={{ color: '#ffffff', fontSize: 16, flex: 1 }}>
                            {ingredient}
                          </Text>
                          <View style={{
                            backgroundColor: '#10B981',
                            borderRadius: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            minWidth: 45,
                            alignItems: 'center'
                          }}>
                            <FontAwesome name="plus-circle" size={18} color="#ffffff" />
                          </View>
                        </Pressable>
                      );
                    }
                  }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* Suggest Cocktails Modal */}
        {showSuggestModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1, paddingHorizontal: 16 }}>
                {/* Modal Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  paddingVertical: 16,
                }}>
                  <Text style={{ 
                    flex: 1,
                    fontSize: 20, 
 
                    color: '#ffffff',
                        }}>
                    Suggested Cocktails
                  </Text>
                  <Pressable
                    onPress={() => setShowSuggestModal(false)}
                    style={{ padding: 8 }}>
                    <FontAwesome name="times" size={24} color="#888888" />
                  </Pressable>
                </View>

                {/* Info Text */}
                <Text style={{
                  color: '#888888',
                  fontSize: 14,
                  marginBottom: 16,
                    }}>
                  Based on your {venue.ingredients.length} ingredient{venue.ingredients.length !== 1 ? 's' : ''}
                </Text>

                {/* Suggested Cocktails List */}
                {suggestedCocktails.length > 0 ? (
                  <FlatList
                    data={suggestedCocktails}
                    keyExtractor={(item) => item.cocktail.id}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          backgroundColor: '#1a1a1a',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: '#333333',
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 16 }}>
                              {item.cocktail.name}
                            </Text>
                            <Text style={{ 
                              color: item.hasAllIngredients ? '#10B981' : '#9C27B0', 
                              fontSize: 12, 
                              marginTop: 4,
                              fontWeight: item.hasAllIngredients ? '600' : '400'
                            }}>
                              {item.hasAllIngredients 
                                ? '✓ All ingredients available!' 
                                : `${item.score} of ${item.totalIngredients} ingredients available`}
                            </Text>
                            <Text style={{ color: '#888888', fontSize: 11, marginTop: 2 }}>
                              {item.cocktail.category} • {item.cocktail.glass}
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/* Preview Button */}
                            <Pressable
                              onPress={() => handlePreviewCocktail(item.cocktail)}
                              style={{ 
                                backgroundColor: '#007AFF',
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                minWidth: 45,
                                alignItems: 'center'
                              }}>
                              <FontAwesome name="eye" size={16} color="#ffffff" />
                            </Pressable>
                            
                            {/* Add Button */}
                            <Pressable
                              onPress={() => {
                                handleAddCocktail(item.cocktail.id);
                                setShowSuggestModal(false);
                              }}
                              style={{ 
                                backgroundColor: '#10B981',
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                minWidth: 45,
                                alignItems: 'center'
                              }}>
                              <FontAwesome name="plus-circle" size={18} color="#ffffff" />
                            </Pressable>
                            
                            <View style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                              <View style={{
                                backgroundColor: item.hasAllIngredients ? '#10B981' : '#9C27B0',
                                borderRadius: 20,
                                width: 40,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 12, // Align circle with buttons
                              }}>
                                <Text style={{ color: '#ffffff', fontSize: 18 }}>
                                  {item.hasAllIngredients ? '✓' : item.missingCount}
                                </Text>
                              </View>
                              <Text style={{ color: '#666666', fontSize: 10, marginTop: 4 }}>
                                {item.hasAllIngredients ? 'ready' : 'missing'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <FontAwesome name="glass" size={48} color="#333333" style={{ marginBottom: 16 }} />
                        <Text style={{ color: '#888888', fontSize: 16 }}>
                          No cocktail suggestions
                        </Text>
                        <Text style={{ color: '#666666', fontSize: 14, marginTop: 4 }}>
                          Add more ingredients to get suggestions
                        </Text>
                      </View>
                    }
                  />
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <FontAwesome name="glass" size={48} color="#333333" style={{ marginBottom: 16 }} />
                    <Text style={{ color: '#888888', fontSize: 16 }}>
                      No cocktail suggestions
                    </Text>
                    <Text style={{ color: '#666666', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                      Add ingredients to your venue to see cocktail suggestions
                    </Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* Missing Ingredients Modal */}
        {showMissingModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1, paddingHorizontal: 16 }}>
                {/* Modal Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  paddingVertical: 16,
                }}>
                  <Text style={{ 
                    flex: 1,
                    fontSize: 20, 
 
                    color: '#ffffff',
                        }}>
                    Missing Ingredients
                  </Text>
                  <Pressable
                    onPress={() => setShowMissingModal(false)}
                    style={{ padding: 8 }}>
                    <FontAwesome name="times" size={24} color="#888888" />
                  </Pressable>
                </View>

                {/* Info Text */}
                <Text style={{
                  color: '#888888',
                  fontSize: 14,
                  marginBottom: 16,
                    }}>
                  Ingredients needed for your {venueCocktails.length} cocktail{venueCocktails.length !== 1 ? 's' : ''} but not in your venue
                </Text>

                {/* Missing Ingredients List */}
                <FlatList
                  data={missingIngredients}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        handleAddIngredient(item);
                        // Update the missing ingredients list
                        const updatedMissing = missingIngredients.filter(i => i !== item);
                        if (updatedMissing.length === 0) {
                          setShowMissingModal(false);
                        }
                      }}
                      style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{ color: '#ffffff', fontSize: 16, flex: 1 }}>
                        {item}
                      </Text>
                      <View style={{
                        backgroundColor: '#FF8F00',
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        minWidth: 45,
                        alignItems: 'center'
                      }}>
                        <FontAwesome name="plus-circle" size={18} color="#ffffff" />
                      </View>
                    </Pressable>
                  )}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <FontAwesome name="check-circle" size={48} color="#10B981" style={{ marginBottom: 16 }} />
                      <Text style={{ color: '#10B981', fontSize: 16 }}>
                        All ingredients added!
                      </Text>
                      <Text style={{ color: '#666666', fontSize: 14, marginTop: 4 }}>
                        You have all the ingredients for your cocktails
                      </Text>
                    </View>
                  }
                />
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* Cocktail Preview Modal */}
        {showPreviewModal && previewCocktail && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <ScrollView
              style={{
                width: screenWidth * 0.85,
                maxHeight: screenHeight * 0.85,
              }}
              contentContainerStyle={{
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#333333',
                padding: 20,
                minHeight: 400,
              }}
              showsVerticalScrollIndicator={false}>
              
              {/* Close Button */}
              <Pressable
                onPress={() => setShowPreviewModal(false)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: 18,
                  width: 36,
                  height: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <FontAwesome name="times" size={16} color="#ffffff" />
              </Pressable>

              {/* Favorite Button */}
              <Pressable
                onPress={(event) => handleFavoriteToggle(previewCocktail.id, event)}
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: 18,
                  width: 36,
                  height: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <FontAwesome 
                  name={isFavorite(previewCocktail.id) ? 'heart' : 'heart-o'} 
                  size={16} 
                  color={isFavorite(previewCocktail.id) ? '#FF6B6B' : '#ffffff'} 
                />
              </Pressable>

              {/* Cocktail Name */}
              <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
                <Text style={{ 
                  fontSize: 24, 
 
                  color: '#ffffff', 
                  textAlign: 'center'
                }}>
                  {previewCocktail.name}
                </Text>
                {previewCocktail.isUserCreated && (
                  <View style={{
                    backgroundColor: '#007AFF',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginTop: 8
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 12 }}>CUSTOM RECIPE</Text>
                  </View>
                )}
              </View>
              
              {/* Images Side by Side */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 24,
                gap: 16,
              }}>
                {/* Main Image - only for regular cocktails */}
                {!previewCocktail.isUserCreated && previewCocktail.image && getCocktailImage(previewCocktail.image) && (
                  <Image
                    source={getCocktailImage(previewCocktail.image)}
                    style={{ width: 120, height: 120, borderRadius: 12 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                )}
                
                {/* Glassware */}
                <Image
                  source={getGlassImageNormalized(previewCocktail.glass)}
                  style={{ width: 120, height: 120, borderRadius: 12 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              
              {/* Ingredients */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ 
                  fontSize: 18, 
 
                  color: '#ffffff', 
                  marginBottom: 12 
                }}>
                  Ingredients
                </Text>
                {previewCocktail.ingredients.map((ingredient, idx) => (
                  <Text key={idx} style={{ 
                    color: '#ffffff', 
                    fontSize: 16, 
                    marginBottom: 6,
                    lineHeight: 24,
                  }}>
                    • {ingredient.measure ? `${MeasurementConverter.convertIngredientMeasure(
                      ingredient.measure, 
                      settings?.measurements || 'oz'
                    )} ` : ''}{ingredient.name}
                  </Text>
                ))}
              </View>
              
              {/* Instructions */}
              <View>
                <Text style={{ 
                  fontSize: 18, 
 
                  color: '#ffffff', 
                  marginBottom: 12 
                }}>
                  Instructions
                </Text>
                <Text style={{ 
                  color: '#ffffff', 
                  fontSize: 16, 
                  lineHeight: 24 
                }}>
                  {previewCocktail.isUserCreated 
                    ? (previewCocktail as UserCocktail).instructions 
                    : (previewCocktail as Cocktail).instructions.en}
                </Text>
              </View>
              
              {/* Bottom spacer */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}