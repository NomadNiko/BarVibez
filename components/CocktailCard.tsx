import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { useEffect } from 'react';

// Static glass image imports using require() with JPG files
const glassImages = {
  'Balloon Glass': require('../assets/glass/balloonGlass.jpg'),
  'Beer Glass': require('../assets/glass/beerGlass.jpg'),
  'Beer Mug': require('../assets/glass/beerMug.jpg'),
  'Beer Pilsner': require('../assets/glass/beerPilsner.jpg'),
  'Brandy Snifter': require('../assets/glass/brandySnifter.jpg'),
  'Champagne Flute': require('../assets/glass/champagneFlute.jpg'),
  'Cocktail Glass': require('../assets/glass/cocktailGlass.jpg'),
  'Coffee Mug': require('../assets/glass/coffeeMug.jpg'),
  'Collins Glass': require('../assets/glass/collinsGlass.jpg'),
  'Copper Mug': require('../assets/glass/copperMug.jpg'),
  'Cordial Glass': require('../assets/glass/cordialGlass.jpg'),
  'Coupe Glass': require('../assets/glass/coupGlass.jpg'),
  'Highball Glass': require('../assets/glass/highballGlass.jpg'),
  'Hurricane Glass': require('../assets/glass/hurricanGlass.jpg'),
  'Irish Coffee Cup': require('../assets/glass/irishCoffeeCup.jpg'),
  Jar: require('../assets/glass/jar.jpg'),
  'Margarita Glass': require('../assets/glass/margaritaGlass.jpg'),
  'Margarita/Coupette Glass': require('../assets/glass/MargaritaCoupetteGlass.jpg'),
  'Martini Glass': require('../assets/glass/martiniGlass.jpg'),
  'Mason Jar': require('../assets/glass/masonJar.jpg'),
  'Nick And Nora Glass': require('../assets/glass/nickAndNoraGlass.jpg'),
  'Old-Fashioned Glass': require('../assets/glass/oldFashionedGlass.jpg'),
  'Parfait Glass': require('../assets/glass/parfaitGlass.jpg'),
  'Pint Glass': require('../assets/glass/pintGlass.jpg'),
  Pitcher: require('../assets/glass/pitcher.jpg'),
  'Pousse Cafe Glass': require('../assets/glass/pousseCafeGlass.jpg'),
  'Punch Bowl': require('../assets/glass/punchBowl.jpg'),
  'Shot Glass': require('../assets/glass/shotGlass.jpg'),
  'Whiskey Glass': require('../assets/glass/whiskeyGlass.jpg'),
  'Whiskey Sour Glass': require('../assets/glass/whiskeySourGlass.jpg'),
  'White Wine Glass': require('../assets/glass/whiteWineGlass.jpg'),
  'Wine Glass': require('../assets/glass/wineGlass.jpg'),
} as const;

const defaultGlassImage = require('../assets/glass/cocktailGlass.jpg');

function getGlassImage(glassType: string) {
  return glassImages[glassType as keyof typeof glassImages] || defaultGlassImage;
}

interface CocktailCardProps {
  cocktail: Cocktail;
  className?: string;
}

export function CocktailCard({ cocktail, className }: CocktailCardProps) {
  const handlePress = () => {
    router.push(`/cocktail/${cocktail.id}`);
  };

  // Preload glass images for faster loading
  useEffect(() => {
    const preloadImages = async () => {
      const allGlassImages = Object.values(glassImages);
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
      )}>
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
