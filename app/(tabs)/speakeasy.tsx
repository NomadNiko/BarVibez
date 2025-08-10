import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
// import { Button } from '~/components/nativewindui/Button'; // Unused
import { Container } from '~/components/Container';
import { useVenues, useFavorites, useUserSettings, useUserCocktails } from '~/lib/contexts/UserContext';
import { Venue } from '~/lib/types/user';
import { AddCocktailModal } from '~/components/AddCocktailModal';

export default function SpeakeasyScreen() {
  const router = useRouter();
  const { venues, createVenue, deleteVenue } = useVenues();
  const { favorites } = useFavorites();
  const { settings } = useUserSettings();
  const { getAllUserCocktails } = useUserCocktails();
  const [showNewVenueModal, setShowNewVenueModal] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [showAddCocktailModal, setShowAddCocktailModal] = useState(false);

  // Debug log to check venues
  useEffect(() => {
    console.log('Venues in Speakeasy:', venues);
    console.log('Has default venue?', venues.some(v => v.isDefault));
  }, [venues]);

  const handleCreateVenue = async () => {
    if (!newVenueName.trim()) {
      Alert.alert('Error', 'Please enter a venue name');
      return;
    }

    try {
      await createVenue(newVenueName.trim());
      setNewVenueName('');
      setShowNewVenueModal(false);
    } catch {
      Alert.alert('Error', 'Failed to create venue');
    }
  };

  const handleDeleteVenue = (venue: Venue) => {
    if (venue.isDefault) {
      Alert.alert('Error', 'Cannot delete My Speakeasy');
      return;
    }

    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVenue(venue.id);
            } catch {
              Alert.alert('Error', 'Failed to delete venue');
            }
          },
        },
      ]
    );
  };

  const handleVenuePress = (venue: Venue) => {
    router.push({
      pathname: '/venue-cocktails/[id]',
      params: { id: venue.id },
    });
  };

  const handleAddCocktailSuccess = () => {
    setShowAddCocktailModal(false);
    
    // Find My Speakeasy and navigate to it
    const defaultVenue = venues.find(v => v.isDefault);
    if (defaultVenue) {
      router.push({
        pathname: '/venue-cocktails/[id]',
        params: { id: defaultVenue.id },
      });
    }
  };

  const handleEditVenue = (venue: Venue) => {
    router.push({
      pathname: '/venue/[id]',
      params: { id: venue.id },
    });
  };

  // Check if user is on free plan and show paywall
  if (settings?.subscriptionStatus === 'free') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 12, flex: 1 }}>
          <Container>
            {/* Header */}
            <View className="pb-4">
              <Text className="mb-2 text-2xl font-bold text-foreground">Speakeasy</Text>
              <Text className="text-sm text-muted-foreground">
                Premium feature - Create and manage your venues
              </Text>
            </View>

            {/* Premium Feature Explanation */}
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#333333',
              alignItems: 'center',
            }}>
              <FontAwesome name="building" size={48} color="#10B981" style={{ marginBottom: 16 }} />
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 20, 
                fontWeight: 'bold', 
                marginBottom: 12,
                textAlign: 'center'
              }}>
                Speakeasy Premium
              </Text>
              <Text style={{ 
                color: '#888888', 
                fontSize: 14, 
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 20
              }}>
                Create custom venues, manage your ingredients, and organize cocktail collections for different bars or events.
              </Text>
              
              <Pressable
                onPress={() => router.push('/paywall')}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 12,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  Upgrade to Premium
                </Text>
              </Pressable>
            </View>

            {/* Feature List */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 16, 
                fontWeight: '600', 
                marginBottom: 16 
              }}>
                What you&apos;ll get:
              </Text>
              
              {[
                'Create unlimited custom venues',
                'Manage ingredients by location',
                'Organize cocktails by bar/event',
                'Track missing ingredients',
                'Get cocktail suggestions by venue'
              ].map((feature, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <FontAwesome name="check" size={16} color="#10B981" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#cccccc', fontSize: 14 }}>
                    {feature}
                  </Text>
                </View>
              ))}
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
        <View className="pb-4">
          <Text className="mb-2 text-2xl font-bold text-foreground">Speakeasy</Text>
          <Text className="text-sm text-muted-foreground">
            Manage your venues and cocktail collections
          </Text>
        </View>

        {/* Add New Venue Button */}
        <Pressable
          onPress={() => setShowNewVenueModal(true)}
          style={{
            backgroundColor: '#10B981',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <FontAwesome name="plus" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ffffff', fontSize: 16 }}>
            Add New Venue
          </Text>
        </Pressable>

        {/* Add New Drink Button */}
        <Pressable
          onPress={() => setShowAddCocktailModal(true)}
          style={{
            backgroundColor: '#007AFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <FontAwesome name="glass" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ffffff', fontSize: 16 }}>
            Add New Drink
          </Text>
        </Pressable>

        {/* Venues List */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}>
          {venues.map((venue) => {
            // Calculate cocktail count including user cocktails
            const regularCocktailCount = venue.isDefault ? favorites.length : venue.cocktailIds.length;
            
            // Calculate user cocktails using the proper method
            const allUserCocktails = getAllUserCocktails();
            const userCocktailCount = allUserCocktails.filter(c => c.venues.includes(venue.id)).length;
            
            const cocktailCount = regularCocktailCount + userCocktailCount;
            const ingredientCount = venue.ingredients.length;

            return (
              <Pressable
                key={venue.id}
                onPress={() => handleVenuePress(venue)}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: venue.isDefault ? '#10B981' : '#333333',
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ 
                        fontSize: 18, 
 
                        color: '#ffffff',
                        marginRight: 8,
                      }}>
                        {venue.name}
                      </Text>
                      {venue.isDefault && (
                        <View style={{
                          backgroundColor: '#10B981',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}>
                          <Text style={{ color: '#ffffff', fontSize: 10 }}>
                            DEFAULT
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={{ fontSize: 13, color: '#888888' }}>
                        {cocktailCount} {cocktailCount === 1 ? 'cocktail' : 'cocktails'}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#888888' }}>
                        {ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditVenue(venue);
                      }}
                      style={{
                        padding: 8,
                      }}>
                      <FontAwesome name="edit" size={18} color="#007AFF" />
                    </Pressable>
                    
                    {!venue.isDefault && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteVenue(venue);
                        }}
                        style={{
                          padding: 8,
                        }}>
                        <FontAwesome name="trash-o" size={18} color="#FF6B6B" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        </Container>
      </View>

      {/* New Venue Modal */}
      {showNewVenueModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            paddingTop: 120,
            padding: 20,
          }}>
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              padding: 20,
            }}>
              <Text style={{
                fontSize: 20,
                color: '#ffffff',
                marginBottom: 16,
              }}>
                Create New Venue
              </Text>
              
              <TextInput
                value={newVenueName}
                onChangeText={setNewVenueName}
                placeholder="Enter venue name..."
                placeholderTextColor="#666666"
                style={{
                  backgroundColor: '#000000',
                  borderWidth: 1,
                  borderColor: '#333333',
                  borderRadius: 8,
                  padding: 12,
                  color: '#ffffff',
                  fontSize: 16,
                  marginBottom: 16,
                }}
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setNewVenueName('');
                    setShowNewVenueModal(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#333333',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#ffffff', fontSize: 16 }}>
                    Cancel
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={handleCreateVenue}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: '#ffffff', fontSize: 16 }}>
                    Create
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Add Cocktail Modal */}
        <AddCocktailModal
          visible={showAddCocktailModal}
          onClose={() => setShowAddCocktailModal(false)}
          onSuccess={handleAddCocktailSuccess}
          editCocktail={null}
        />
    </SafeAreaView>
  );
}