import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { BackButton } from '~/components/BackButton';
import { 
  useVenues, 
  useFavorites,
  useUserSettings 
} from '~/lib/contexts/UserContext';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Venue } from '~/lib/types/user';
import { Cocktail } from '~/lib/types/cocktail';

type TabType = 'cocktails' | 'ingredients';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { 
    venues, 
    addIngredientToVenue, 
    removeIngredientFromVenue,
    addCocktailToVenue,
    removeCocktailFromVenue 
  } = useVenues();
  const { favorites } = useFavorites();
  const { settings } = useUserSettings();
  const { cocktails, getIngredients } = useCocktails();
  
  const [activeTab, setActiveTab] = useState<TabType>('cocktails');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const venue = venues.find(v => v.id === id);
  const allIngredients = useMemo(() => getIngredients(), [getIngredients]);

  // Get cocktails for this venue
  const venueCocktails = useMemo(() => {
    if (!venue) return [];
    
    // For My Speakeasy, show favorites
    const cocktailIds = venue.isDefault ? favorites : venue.cocktailIds;
    
    return cocktailIds
      .map(id => cocktails.find(c => c.id === id))
      .filter((c): c is Cocktail => c !== undefined);
  }, [venue, cocktails, favorites]);

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
    
    // Filter out ingredients already in venue
    const venueIngredientsLower = venue.ingredients.map(i => i.toLowerCase());
    const missing = Array.from(allCocktailIngredients).filter(ing => {
      const ingLower = ing.toLowerCase();
      return !venueIngredientsLower.some(vi => 
        vi === ingLower || vi.includes(ingLower) || ingLower.includes(vi)
      );
    });
    
    // Sort alphabetically
    return missing.sort((a, b) => a.localeCompare(b));
  }, [venue, venueCocktails]);

  // Get suggested cocktails based on venue ingredients
  const suggestedCocktails = useMemo(() => {
    if (!venue || venue.ingredients.length === 0) return [];
    
    const venueIngredients = venue.ingredients.map(i => i.toLowerCase());
    const cocktailIds = venue.isDefault ? favorites : venue.cocktailIds;
    
    // Filter available cocktails (not already in venue)
    const availableCocktails = cocktails.filter(c => !cocktailIds.includes(c.id));
    
    // Score each cocktail by ingredient matches
    const scoredCocktails = availableCocktails.map(cocktail => {
      const cocktailIngredients = cocktail.ingredients.map(i => i.name.toLowerCase());
      const matchingIngredients = cocktailIngredients.filter(ci => 
        venueIngredients.some(vi => ci.includes(vi) || vi.includes(ci))
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
        
        // Third priority: simpler cocktails (fewer total ingredients)
        return a.totalIngredients - b.totalIngredients;
      })
      .slice(0, 50); // Limit to top 50 suggestions
  }, [venue, cocktails, favorites]);

  // Filter items for search
  const filteredItems = useMemo(() => {
    if (activeTab === 'cocktails') {
      // Filter cocktails not already in venue
      const availableCocktails = cocktails.filter(c => {
        const cocktailIds = venue?.isDefault ? favorites : (venue?.cocktailIds || []);
        return !cocktailIds.includes(c.id);
      });
      
      if (!searchQuery) return availableCocktails.slice(0, 50);
      
      return availableCocktails.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // Filter ingredients not already in venue
      const availableIngredients = allIngredients.filter(ing => 
        !venue?.ingredients.includes(ing)
      );
      
      if (!searchQuery) return availableIngredients.slice(0, 50);
      
      return availableIngredients.filter(ing => 
        ing.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }, [activeTab, searchQuery, cocktails, allIngredients, venue, favorites]);

  if (!venue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ffffff' }}>Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddCocktail = async (cocktailId: string) => {
    try {
      await addCocktailToVenue(venue.id, cocktailId);
      setShowAddModal(false);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add cocktail');
    }
  };

  const handleRemoveCocktail = async (cocktailId: string) => {
    try {
      await removeCocktailFromVenue(venue.id, cocktailId);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove cocktail');
    }
  };

  const handleAddIngredient = async (ingredient: string) => {
    try {
      await addIngredientToVenue(venue.id, ingredient);
      setShowAddModal(false);
      setSearchQuery('');
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
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
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
                  <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600' }}>
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
                    <Text style={{ color: '#9C27B0', fontSize: 14, fontWeight: '600' }}>
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
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500' }}>
                      {cocktail.name}
                    </Text>
                    <Text style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>
                      {cocktail.category} • {cocktail.glass}
                    </Text>
                  </View>
                  
                  <Pressable
                    onPress={() => handleRemoveCocktail(cocktail.id)}
                    style={{ padding: 8 }}>
                    <FontAwesome name="times" size={18} color="#FF6B6B" />
                  </Pressable>
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
                  <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600' }}>
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
                    <Text style={{ color: '#FF8F00', fontSize: 14, fontWeight: '600' }}>
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
                    fontWeight: 'bold', 
                    color: '#ffffff' 
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
                      ? (item as Cocktail).id 
                      : item as string
                  }
                  renderItem={({ item }) => {
                    if (activeTab === 'cocktails') {
                      const cocktail = item as Cocktail;
                      return (
                        <Pressable
                          onPress={() => handleAddCocktail(cocktail.id)}
                          style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 16 }}>
                              {cocktail.name}
                            </Text>
                            <Text style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>
                              {cocktail.category}
                            </Text>
                          </View>
                          <FontAwesome name="plus-circle" size={20} color="#10B981" />
                        </Pressable>
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
                          <FontAwesome name="plus-circle" size={20} color="#10B981" />
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
                    fontWeight: 'bold', 
                    color: '#ffffff' 
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
                      <Pressable
                        onPress={() => {
                          handleAddCocktail(item.cocktail.id);
                          setShowSuggestModal(false);
                        }}
                        style={{
                          backgroundColor: item.hasAllIngredients ? '#064e3b' : '#1a1a1a',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                          borderWidth: item.hasAllIngredients ? 1 : 0,
                          borderColor: item.hasAllIngredients ? '#10B981' : 'transparent',
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500' }}>
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
                          <View style={{ alignItems: 'center' }}>
                            <View style={{
                              backgroundColor: item.hasAllIngredients ? '#10B981' : '#9C27B0',
                              borderRadius: 20,
                              width: 40,
                              height: 40,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}>
                              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                                {item.hasAllIngredients ? '✓' : item.missingCount}
                              </Text>
                            </View>
                            <Text style={{ color: '#666666', fontSize: 10 }}>
                              {item.hasAllIngredients ? 'ready' : 'missing'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
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
                    fontWeight: 'bold', 
                    color: '#ffffff' 
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
                      <FontAwesome name="plus-circle" size={20} color="#FF8F00" />
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
      </View>
    </SafeAreaView>
  );
}