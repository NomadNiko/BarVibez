import React, { useMemo, useRef, useState } from 'react';
import { View, FlatList, Pressable, Dimensions, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { BackButton } from '~/components/BackButton';
import { useVenues, useFavorites, useUserSettings, useUser } from '~/lib/contexts/UserContext';
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
  const { exportVenue, exportUserCocktail, shareCocktailRecipe } = useUser();
  const flatListRef = useRef<FlatList>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportVenue = async () => {
    if (!venue || isExporting) return;
    setIsExporting(true);
    try {
      await exportVenue(venue.id);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled') && !error?.message?.includes('dismissed')) {
        Alert.alert('Export Failed', error?.message || 'Failed to export venue.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCocktail = async (cocktailId: string, event: any) => {
    event.stopPropagation();
    try {
      await exportUserCocktail(cocktailId);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled') && !error?.message?.includes('dismissed')) {
        Alert.alert('Export Failed', error?.message || 'Failed to export cocktail.');
      }
    }
  };

  const handleShareRecipe = async (item: DisplayCocktail, event: any) => {
    event.stopPropagation();
    try {
      await shareCocktailRecipe(item);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled') && !error?.message?.includes('dismissed')) {
        Alert.alert('Share Failed', 'Could not share this recipe.');
      }
    }
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

const renderCocktailItem = ({ item }: { item: DisplayCocktail }) => (
    <View style={{ width: screenWidth * 0.8, marginRight: 16, flex: 1 }}>
      <View className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm" style={{ position: 'relative' }}>
        {/* Top Left Buttons: Share + Download (custom only) */}
        <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={(event) => handleShareRecipe(item, event)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 16,
              width: 28,
              height: 28,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <FontAwesome name="share-alt" size={12} color="#9CA3AF" />
          </Pressable>

          {item.isUserCreated && (
            <Pressable
              onPress={(event) => handleExportCocktail(item.id, event)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 16,
                width: 28,
                height: 28,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesome name="download" size={12} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Favorite Button - Top Right */}
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
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Download/Export Button - non-default venues only */}
            {!venue.isDefault && (
              <Pressable
                onPress={handleExportVenue}
                disabled={isExporting}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: isExporting ? 0.5 : 1,
                }}>
                <FontAwesome name="download" size={18} color="#9CA3AF" />
              </Pressable>
            )}
            {/* Edit Button - icon only */}
            <Pressable
              onPress={handleEditVenue}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesome name="edit" size={18} color="#007AFF" />
            </Pressable>
          </View>
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