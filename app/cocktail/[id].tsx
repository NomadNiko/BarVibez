import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
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

// Static glass image imports using require() with JPG files
const glassImages = {
  'Balloon Glass': require('~/assets/glass/balloonGlass.jpg'),
  'Beer Glass': require('~/assets/glass/beerGlass.jpg'),
  'Beer Mug': require('~/assets/glass/beerMug.jpg'),
  'Beer Pilsner': require('~/assets/glass/beerPilsner.jpg'),
  'Brandy Snifter': require('~/assets/glass/brandySnifter.jpg'),
  'Champagne Flute': require('~/assets/glass/champagneFlute.jpg'),
  'Cocktail Glass': require('~/assets/glass/cocktailGlass.jpg'),
  'Coffee Mug': require('~/assets/glass/coffeeMug.jpg'),
  'Collins Glass': require('~/assets/glass/collinsGlass.jpg'),
  'Copper Mug': require('~/assets/glass/copperMug.jpg'),
  'Cordial Glass': require('~/assets/glass/cordialGlass.jpg'),
  'Coupe Glass': require('~/assets/glass/coupGlass.jpg'),
  'Highball Glass': require('~/assets/glass/highballGlass.jpg'),
  'Hurricane Glass': require('~/assets/glass/hurricanGlass.jpg'),
  'Irish Coffee Cup': require('~/assets/glass/irishCoffeeCup.jpg'),
  Jar: require('~/assets/glass/jar.jpg'),
  'Margarita Glass': require('~/assets/glass/margaritaGlass.jpg'),
  'Margarita/Coupette Glass': require('~/assets/glass/MargaritaCoupetteGlass.jpg'),
  'Martini Glass': require('~/assets/glass/martiniGlass.jpg'),
  'Mason Jar': require('~/assets/glass/masonJar.jpg'),
  'Nick And Nora Glass': require('~/assets/glass/nickAndNoraGlass.jpg'),
  'Old-Fashioned Glass': require('~/assets/glass/oldFashionedGlass.jpg'),
  'Parfait Glass': require('~/assets/glass/parfaitGlass.jpg'),
  'Pint Glass': require('~/assets/glass/pintGlass.jpg'),
  Pitcher: require('~/assets/glass/pitcher.jpg'),
  'Pousse Cafe Glass': require('~/assets/glass/pousseCafeGlass.jpg'),
  'Punch Bowl': require('~/assets/glass/punchBowl.jpg'),
  'Shot Glass': require('~/assets/glass/shotGlass.jpg'),
  'Whiskey Glass': require('~/assets/glass/whiskeyGlass.jpg'),
  'Whiskey Sour Glass': require('~/assets/glass/whiskeySourGlass.jpg'),
  'White Wine Glass': require('~/assets/glass/whiteWineGlass.jpg'),
  'Wine Glass': require('~/assets/glass/wineGlass.jpg'),
} as const;

const defaultGlassImage = require('~/assets/glass/cocktailGlass.jpg');

function getGlassImage(glassType: string) {
  return glassImages[glassType as keyof typeof glassImages] || defaultGlassImage;
}

const { width } = Dimensions.get('window');

export default function CocktailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCocktailById } = useCocktails();
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);

  useEffect(() => {
    if (id) {
      const found = getCocktailById(id);
      setCocktail(found);
    }
  }, [id, getCocktailById]);

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
            <View className="mb-4 flex-row items-center">
              <BackButton />
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
                    <Text className="text-sm text-muted-foreground">{ingredient.measure}</Text>
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
