import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { Container } from '~/components/Container';
import { BackButton } from '~/components/BackButton';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImage } from '~/lib/utils/glassImageMap';
import { useFavorites, useUserSettings } from '~/lib/contexts/UserContext';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';

const { width } = Dimensions.get('window');

export default function CocktailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCocktailById } = useCocktails();
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();

  useEffect(() => {
    if (id) {
      const found = getCocktailById(id);
      setCocktail(found);
    }
  }, [id, getCocktailById]);

  const handleFavoriteToggle = async () => {
    if (!cocktail?.id) return;
    
    try {
      if (isFavorite(cocktail.id)) {
        await removeFavorite(cocktail.id);
      } else {
        await addFavorite(cocktail.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  if (!cocktail) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 12, flex: 1 }}>
          <Container>
            <View className="mb-4 flex-row items-center">
              <BackButton />
              <Text className="ml-2 text-lg font-semibold">Cocktail</Text>
            </View>

            <View className="flex-1 items-center justify-center">
              <FontAwesome
                name="exclamation-circle"
                size={48}
                color="#9CA3AF"
                style={{ marginBottom: 16 }}
              />
              <Text className="mb-2 text-lg font-medium text-foreground">Cocktail not found</Text>
              <Text className="mb-4 text-center text-muted-foreground">
                The cocktail you&apos;re looking for doesn&apos;t exist.
              </Text>
              <Button onPress={() => router.back()}>
                <Text>Go Back</Text>
              </Button>
            </View>
          </Container>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 12, flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 pb-2 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <BackButton />
              <Pressable
                onPress={handleFavoriteToggle}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <FontAwesome 
                  name={isFavorite(cocktail.id) ? 'heart' : 'heart-o'} 
                  size={20} 
                  color={isFavorite(cocktail.id) ? '#FF6B6B' : '#9CA3AF'} 
                />
              </Pressable>
            </View>
          </View>

          {/* Drink Name */}
          <View className="mb-6 px-4">
            <Text className="text-2xl font-bold text-foreground text-center">{cocktail.name}</Text>
          </View>

          {/* Image */}
          <View className="mb-6 items-center">
            <Image
              source={
                cocktail.image && getCocktailImage(cocktail.image)
                  ? getCocktailImage(cocktail.image)
                  : getGlassImage(cocktail.glass)
              }
              style={{ width: 200, height: 200, borderRadius: 12 }}
              contentFit="contain"
              placeholder={getGlassImage(cocktail.glass)}
              transition={200}
            />
          </View>

          <Container>
            {/* Additional Info */}
            <View className="mb-6">

            {cocktail.alternateName && (
              <Text className="mb-3 text-lg text-muted-foreground">{cocktail.alternateName}</Text>
            )}

            <View className="mb-4 flex-row flex-wrap gap-2">
              <View className="bg-primary/10 rounded-full px-3 py-1.5">
                <Text className="text-sm font-medium text-primary">{cocktail.category}</Text>
              </View>
              <View className="bg-secondary/20 rounded-full px-3 py-1.5">
                <Text className="text-sm text-secondary-foreground">{cocktail.alcoholic}</Text>
              </View>
              <View className="bg-accent/20 rounded-full px-3 py-1.5">
                <Text className="text-sm text-accent-foreground">{cocktail.glass}</Text>
              </View>
            </View>

            {cocktail.iba && (
              <View className="mb-4 rounded-lg border border-border bg-card p-3">
                <Text className="text-sm font-medium text-foreground">IBA Official Cocktail</Text>
                <Text className="text-sm text-muted-foreground">{cocktail.iba}</Text>
              </View>
            )}
          </View>

          {/* Ingredients */}
          <View className="mb-6">
            <Text className="mb-3 text-xl font-semibold text-foreground">Ingredients</Text>
            <View className="rounded-lg border border-border bg-card p-4">
              {cocktail.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0">
                  <Text className="flex-1 font-medium text-foreground">{ingredient.name}</Text>
                  {ingredient.measure && (
                    <Text className="text-sm text-muted-foreground">
                      {MeasurementConverter.convertIngredientMeasure(
                        ingredient.measure, 
                        settings?.measurements || 'oz'
                      )}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="mb-3 text-xl font-semibold text-foreground">Instructions</Text>
            <View className="rounded-lg border border-border bg-card p-4">
              <Text className="leading-6 text-foreground">{cocktail.instructions.en}</Text>
            </View>
          </View>

          {/* Glass Type */}
          <View className="mb-6">
            <Text className="mb-3 text-xl font-semibold text-foreground">Glassware</Text>
            <View className="rounded-lg border border-border bg-card p-4">
              <View className="items-center">
                <Image
                  source={getGlassImage(cocktail.glass)}
                  style={{ width: 80, height: 80 }}
                  className="mb-6"
                  contentFit="contain"
                />
                <Text className="text-2xl font-bold text-foreground text-center">{cocktail.glass}</Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          {cocktail.tags.length > 0 && (
            <View className="mb-6">
              <Text className="mb-3 text-xl font-semibold text-foreground">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {cocktail.tags.map((tag, index) => (
                  <View key={index} className="rounded-full bg-muted px-3 py-1.5">
                    <Text className="text-sm text-muted-foreground">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="pb-8" />
        </Container>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
