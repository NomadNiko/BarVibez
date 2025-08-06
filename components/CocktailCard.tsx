import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImage, getAllGlassImages } from '~/lib/utils/glassImageMap';
import { useFavorites, useUserSettings } from '~/lib/contexts/UserContext';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';
import { useEffect } from 'react';

interface CocktailCardProps {
  cocktail: Cocktail;
  className?: string;
}

export function CocktailCard({ cocktail, className }: CocktailCardProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();

  const handlePress = () => {
    router.push(`/cocktail/${cocktail.id}`);
  };

  const handleFavoriteToggle = async (event: any) => {
    event.stopPropagation(); // Prevent navigation when tapping favorite button
    
    try {
      if (isFavorite(cocktail.id)) {
        await removeFavorite(cocktail.id);
      } else {
        await addFavorite(cocktail.id);
      }
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  };

  // Preload glass images for faster loading
  useEffect(() => {
    const preloadImages = async () => {
      const allGlassImages = getAllGlassImages();
      allGlassImages.forEach((imageSource) => {
        Image.prefetch(imageSource);
      });
    };

    preloadImages();
  }, []);

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        'ios:active:opacity-80 mb-3 rounded-lg border border-border bg-card p-3',
        className
      )}
      style={{ position: 'relative' }}>
      {/* Favorite Button */}
      <Pressable
        onPress={handleFavoriteToggle}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 20,
          width: 32,
          height: 32,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <FontAwesome 
          name={isFavorite(cocktail.id) ? 'heart' : 'heart-o'} 
          size={14} 
          color={isFavorite(cocktail.id) ? '#FF6B6B' : '#ffffff'} 
        />
      </Pressable>

      <View className="flex-row">
        <View className="flex-1 pr-3">
          <Text className="mb-1 text-base font-semibold text-foreground" numberOfLines={1}>
            {cocktail.name}
          </Text>

          {cocktail.alternateName && (
            <Text className="mb-1.5 text-xs text-muted-foreground" numberOfLines={1}>
              {cocktail.alternateName}
            </Text>
          )}

          <View className="mb-2">
            <View className="bg-primary/10 self-start rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-primary">{cocktail.category}</Text>
            </View>
          </View>

          <View>
            <Text className="mb-1 text-xs font-medium text-foreground">Ingredients:</Text>
            <Text className="text-xs text-muted-foreground">
              {cocktail.ingredients.map((ing) => ing.name).join(', ')}
            </Text>
          </View>
        </View>

        <View className="ml-2">
          <Image
            source={
              cocktail.image && getCocktailImage(cocktail.image) 
                ? getCocktailImage(cocktail.image)
                : getGlassImage(cocktail.glass)
            }
            style={{ width: 120, height: 120, borderRadius: 12 }}
            contentFit="cover"
          />
        </View>
      </View>
    </Pressable>
  );
}
