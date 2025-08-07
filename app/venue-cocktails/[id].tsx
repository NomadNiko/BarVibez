import React, { useMemo, useRef } from 'react';
import { View, FlatList, Pressable, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { BackButton } from '~/components/BackButton';
import { useVenues, useFavorites, useUserSettings } from '~/lib/contexts/UserContext';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImageNormalized } from '~/lib/utils/glassImageMap';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';

const { width: screenWidth } = Dimensions.get('window');

export default function VenueCocktailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { venues } = useVenues();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();
  const { cocktails } = useCocktails();
  const flatListRef = useRef<FlatList>(null);

  const venue = venues.find(v => v.id === id);

  // Get cocktails for this venue
  const venueCocktails = useMemo(() => {
    if (!venue) return [];
    
    // For My Speakeasy, show favorites
    const cocktailIds = venue.isDefault ? favorites : venue.cocktailIds;
    
    return cocktailIds
      .map(id => cocktails.find(c => c.id === id))
      .filter((c): c is Cocktail => c !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  }, [venue, cocktails, favorites]);

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

  const renderCocktailItem = ({ item }: { item: Cocktail }) => (
    <View style={{ width: screenWidth * 0.8, marginRight: 16, flex: 1 }}>
      <View className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm" style={{ position: 'relative' }}>
        {/* Favorite Button */}
        <Pressable
          onPress={(event) => handleFavoriteToggle(item.id, event)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 20,
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <FontAwesome 
            name={isFavorite(item.id) ? 'heart' : 'heart-o'} 
            size={16} 
            color={isFavorite(item.id) ? '#FF6B6B' : '#ffffff'} 
          />
        </Pressable>

        {/* Cocktail Name */}
        <Text className="mb-3 text-xl font-bold text-foreground text-center">{item.name}</Text>
        
        {/* Images Side by Side */}
        <View className="mb-4 flex-row items-center justify-center">
          {/* Main Image */}
          {item.image && getCocktailImage(item.image) && (
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
            style={{ width: 120, height: 120, borderRadius: 12 }}
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
            {item.instructions.en}
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
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
              {venue.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>
              {venueCocktails.length} {venueCocktails.length === 1 ? 'cocktail' : 'cocktails'}
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
            <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '600' }}>
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
      </View>
    </SafeAreaView>
  );
}