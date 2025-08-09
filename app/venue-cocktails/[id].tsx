import React, { useMemo, useRef, useState } from 'react';
import { View, FlatList, Pressable, Dimensions, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { BackButton } from '~/components/BackButton';
import { AddCocktailModal } from '~/components/AddCocktailModal';
import { useVenues, useFavorites, useUserSettings, useUserCocktails } from '~/lib/contexts/UserContext';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail, UserCocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImageNormalized } from '~/lib/utils/glassImageMap';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';
import { getVenueAllCocktails } from '~/lib/utils/combinedSearch';

const { width: screenWidth } = Dimensions.get('window');

// Combined cocktail type for display
type DisplayCocktail = (Cocktail | UserCocktail) & {
  isUserCreated?: boolean;
};

export default function VenueCocktailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { venues } = useVenues();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();
  const { cocktails } = useCocktails();
  const { getAllUserCocktails, deleteUserCocktail } = useUserCocktails();
  const flatListRef = useRef<FlatList>(null);
  const [editingCocktail, setEditingCocktail] = useState<UserCocktail | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const venue = venues.find(v => v.id === id);

  // Get cocktails for this venue using the proper utility function
  const venueCocktails = useMemo(() => {
    if (!venue) return [];
    return getVenueAllCocktails(venue.id);
  }, [venue]);

  if (!venue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ffffff' }}>Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleEditVenue = () => {
    router.push({
      pathname: '/venue/[id]',
      params: { id: venue.id },
    });
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

  const handleEditCocktail = (cocktail: UserCocktail, event: any) => {
    event.stopPropagation();
    setEditingCocktail(cocktail);
    setShowEditModal(true);
  };

  const handleDeleteCocktail = (cocktail: UserCocktail, event: any) => {
    event.stopPropagation();
    
    Alert.alert(
      'Delete Cocktail',
      `Are you sure you want to delete "${cocktail.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserCocktail(cocktail.id);
            } catch {
              Alert.alert('Error', 'Failed to delete cocktail');
            }
          },
        },
      ]
    );
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingCocktail(null);
  };

  const renderCocktailItem = ({ item }: { item: DisplayCocktail }) => (
    <View style={{ width: screenWidth * 0.8, marginRight: 16, flex: 1 }}>
      <View className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm" style={{ position: 'relative' }}>
        {/* Action Buttons */}
        {item.isUserCreated ? (
          <>
            {/* Delete button - Top Left */}
            <Pressable
              onPress={(event) => handleDeleteCocktail(item as UserCocktail, event)}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 10,
                backgroundColor: 'rgba(255, 59, 48, 0.9)',
                borderRadius: 16,
                width: 28,
                height: 28,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesome name="trash-o" size={12} color="#ffffff" />
            </Pressable>
            
            {/* Edit button - Top Right */}
            <Pressable
              onPress={(event) => handleEditCocktail(item as UserCocktail, event)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                backgroundColor: 'rgba(0, 122, 255, 0.9)',
                borderRadius: 16,
                width: 28,
                height: 28,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesome name="edit" size={12} color="#ffffff" />
            </Pressable>
          </>
        ) : (
          /* Favorite Button - Top Right for regular cocktails */
          <Pressable
            onPress={(event) => handleFavoriteToggle(item.id, event)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 16,
              width: 28,
              height: 28,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <FontAwesome 
              name={isFavorite(item.id) ? 'heart' : 'heart-o'} 
              size={12} 
              color={isFavorite(item.id) ? '#FF6B6B' : '#ffffff'} 
            />
          </Pressable>
        )}

        {/* Cocktail Name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text className="text-xl font-bold text-foreground text-center">{item.name}</Text>
        </View>
        
        {/* Images Side by Side */}
        <View className="mb-4 flex-row items-center justify-center">
          {/* Main Image - only for regular cocktails */}
          {!item.isUserCreated && item.image && getCocktailImage(item.image) && (
            <Image
              source={getCocktailImage(item.image)}
              style={{ width: 120, height: 120, borderRadius: 12, marginRight: 16 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          
          {/* Glassware */}
          <Image
            source={getGlassImageNormalized(item.glass)}
            style={{ 
              width: 120, 
              height: 120, 
              borderRadius: 12,
              marginLeft: item.isUserCreated ? 0 : 0 // Center if no cocktail image
            }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
        
        {/* Ingredients */}
        <View className="mb-4">
          {item.ingredients.map((ingredient, idx) => (
            <Text key={idx} className="mb-1 text-sm text-foreground">
              • {ingredient.measure ? `${MeasurementConverter.convertIngredientMeasure(
                ingredient.measure, 
                settings?.measurements || 'oz'
              )} ` : ''}{ingredient.name}
            </Text>
          ))}
        </View>
        
        {/* Instructions */}
        <View className="mb-4">
          <Text className="text-sm text-foreground leading-5">
            {item.isUserCreated ? (item as UserCocktail).instructions : (item as Cocktail).instructions.en}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? 70 : 80 }}>
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
            <Text style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>
              {venueCocktails.length} {venueCocktails.length === 1 ? 'cocktail' : 'cocktails'}
              {venueCocktails.filter(c => c.isUserCreated).length > 0 && (
                <Text style={{ color: '#007AFF' }}> • {venueCocktails.filter(c => c.isUserCreated).length} custom</Text>
              )}
            </Text>
          </View>
          
          {/* Edit Button */}
          <Pressable
            onPress={handleEditVenue}
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#333333',
            }}>
            <FontAwesome name="edit" size={14} color="#007AFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#007AFF', fontSize: 14 }}>
              Edit
            </Text>
          </Pressable>
        </View>

        {/* Cocktails Carousel */}
        <View className="flex-1 mt-4">
          {venueCocktails.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={venueCocktails}
              keyExtractor={(item) => item.id}
              renderItem={renderCocktailItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={screenWidth * 0.8 + 16}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (screenWidth - (screenWidth * 0.8)) / 2,
                paddingBottom: 0,
                flexGrow: 1,
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <FontAwesome name="glass" size={48} color="#333333" style={{ marginBottom: 16 }} />
              <Text className="mb-2 text-lg font-medium text-foreground">
                {venue.isDefault ? 'No Favorites Yet' : 'No Cocktails Added'}
              </Text>
              <Text className="text-center text-muted-foreground px-8">
                {venue.isDefault 
                  ? 'Tap the heart ♥ on cocktails to add them to your favorites' 
                  : 'Tap the Edit button to add cocktails to this venue'
                }
              </Text>
            </View>
          )}
        </View>
        
        {/* Edit Cocktail Modal */}
        <AddCocktailModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingCocktail(null);
          }}
          onSuccess={handleEditSuccess}
          editCocktail={editingCocktail}
        />
      </View>
    </SafeAreaView>
  );
}