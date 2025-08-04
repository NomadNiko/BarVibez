import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { CocktailCard } from '~/components/CocktailCard';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'category' | 'ingredient';
}

// Glass image mapping function
const getGlassImage = (glassType: string) => {
  const glassName = glassType.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  
  const glassMap: Record<string, any> = {
    'cocktailglass': require('../../assets/glass/cocktailGlass.jpg'),
    'martiniglass': require('../../assets/glass/martiniGlass.jpg'),
    'oldfashionedglass': require('../../assets/glass/oldFashionedGlass.jpg'),
    'highballglass': require('../../assets/glass/highballGlass.jpg'),
    'collinsglass': require('../../assets/glass/collinsGlass.jpg'),
    'margaritacoupe': require('../../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritacoupetteglass': require('../../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritacoupette': require('../../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritalgass': require('../../assets/glass/margaritaGlass.jpg'),
    'champagneflute': require('../../assets/glass/champagneFlute.jpg'),
    'wineglass': require('../../assets/glass/wineGlass.jpg'),
    'whitwineglass': require('../../assets/glass/whiteWineGlass.jpg'),
    'brandysnifter': require('../../assets/glass/brandySnifter.jpg'),
    'shotglass': require('../../assets/glass/shotGlass.jpg'),
    'beerglass': require('../../assets/glass/beerGlass.jpg'),
    'beermug': require('../../assets/glass/beerMug.jpg'),
    'pilsner': require('../../assets/glass/beerPilsner.jpg'),
    'hurricaneglass': require('../../assets/glass/hurricanGlass.jpg'),
    'coupglass': require('../../assets/glass/coupGlass.jpg'),
    'nickandnoraglass': require('../../assets/glass/nickAndNoraGlass.jpg'),
    'cordial': require('../../assets/glass/cordialGlass.jpg'),
    'cordialglass': require('../../assets/glass/cordialGlass.jpg'),
    'irishcoffeecup': require('../../assets/glass/irishCoffeeCup.jpg'),
    'coffeemug': require('../../assets/glass/coffeeMug.jpg'),
    'coppermug': require('../../assets/glass/copperMug.jpg'),
    'jar': require('../../assets/glass/jar.jpg'),
    'masonjar': require('../../assets/glass/masonJar.jpg'),
    'parfaitglass': require('../../assets/glass/parfaitGlass.jpg'),
    'pintglass': require('../../assets/glass/pintGlass.jpg'),
    'pitcher': require('../../assets/glass/pitcher.jpg'),
    'poussecafeglass': require('../../assets/glass/pousseCafeGlass.jpg'),
    'punchbowl': require('../../assets/glass/punchBowl.jpg'),
    'whiskyglass': require('../../assets/glass/whiskeyGlass.jpg'),
    'whiskeyglass': require('../../assets/glass/whiskeyGlass.jpg'),
    'whiskeysour': require('../../assets/glass/whiskeySourGlass.jpg'),
    'whiskysourglass': require('../../assets/glass/whiskeySourGlass.jpg'),
    'balloonglass': require('../../assets/glass/balloonGlass.jpg'),
  };
  
  return glassMap[glassName] || require('../../assets/glass/cocktailGlass.jpg');
};

const CATEGORIES: CategoryItem[] = [
  { id: 'classics', name: 'Classics', icon: 'star', color: '#FFD700', type: 'category' },
  { id: 'vodka', name: 'Vodka', icon: 'glass', color: '#E3F2FD', type: 'ingredient' },
  { id: 'rum', name: 'Rum', icon: 'anchor', color: '#8D6E63', type: 'ingredient' },
  { id: 'whiskey', name: 'Whiskey', icon: 'fire', color: '#FF8F00', type: 'ingredient' },
  { id: 'gin', name: 'Gin', icon: 'leaf', color: '#4CAF50', type: 'ingredient' },
  { id: 'mocktails', name: 'Mocktails', icon: 'heart', color: '#E91E63', type: 'category' },
];

export default function PopularScreen() {
  const { cocktails, isLoading, error } = useCocktails();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCocktails = useMemo(() => {
    if (!selectedCategory) return [];

    const category = CATEGORIES.find(cat => cat.id === selectedCategory);
    if (!category) return [];


    if (category.type === 'category') {
      // For Classics category
      if (category.id === 'classics') {
        const results = cocktails.filter(cocktail => 
          cocktail.category?.toLowerCase().includes('classic') ||
          cocktail.category === 'Classic Cocktails'
        );
        return results;
      }
      // For Mocktails category
      if (category.id === 'mocktails') {
        const results = cocktails.filter(cocktail => {
          // Must be non-alcoholic
          const isNonAlcoholic = cocktail.alcoholic?.toLowerCase() === 'non alcoholic' ||
                                 cocktail.alcoholic?.toLowerCase() === 'non-alcoholic';
          // Must have an image
          const hasImage = Boolean(cocktail.image);
          
          return isNonAlcoholic && hasImage;
        });
        return results;
      }
    } else {
      // For ingredient-based filters
      const ingredientName = category.name.toLowerCase();
      const results = cocktails.filter(cocktail => {
        // Must have an image
        if (!cocktail.image) return false;
        
        // Check if any ingredient contains the target ingredient
        const ingredientNames = cocktail.ingredients.map(ing => ing.name.toLowerCase());
        
        return ingredientNames.some(ingredient => 
          ingredient.includes(ingredientName)
        );
      });
      return results;
    }

    return [];
  }, [selectedCategory, cocktails]);

  const renderCocktailItem = ({ item, index }: { item: Cocktail; index: number }) => (
    <Pressable
      style={{ width: screenWidth * 0.8, marginRight: 16, flex: 1 }}
      onPress={() => router.push(`/cocktail/${item.id}`)}>
      <View className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm">
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
            source={getGlassImage(item.glass)}
            style={{ width: 120, height: 120, borderRadius: 12 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
        
        {/* Ingredients */}
        <View className="mb-4">
          {item.ingredients.map((ingredient, idx) => (
            <Text key={idx} className="mb-1 text-sm text-foreground">
              • {ingredient.measure ? `${ingredient.measure} ` : ''}{ingredient.name}
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
    </Pressable>
  );

  const renderCategoryButton = (category: CategoryItem) => (
    <Pressable
      key={category.id}
      onPress={() => setSelectedCategory(category.id)}
      className={`mb-3 items-center justify-center rounded-xl p-3 ${
        selectedCategory === category.id ? 'bg-primary' : 'bg-card border border-border'
      }`}
      style={{ width: '30%' }}>
      <Text
        className={`text-center text-lg font-bold ${
          selectedCategory === category.id ? 'text-white' : 'text-foreground'
        }`}>
        {category.name}
      </Text>
    </Pressable>
  );

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <Container>
          <View className="flex-1 items-center justify-center">
            <Text className="mb-4 text-center text-destructive">{error}</Text>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (isLoading || cocktails.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <Container>
          <View className="flex-1 items-center justify-center">
            <Text className="mb-4 text-lg font-medium text-foreground">Loading cocktails...</Text>
            <Text className="text-center text-muted-foreground">
              Please wait while we load the cocktail database
            </Text>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Container>
        {/* Category Icons Grid */}
        <View className="mb-3 pt-4">
          <View className="flex-row flex-wrap justify-between">
            {CATEGORIES.map(renderCategoryButton)}
          </View>
        </View>

        {/* Selected Category Content */}
        {selectedCategory ? (
          <View className="flex-1">
            {filteredCocktails.length > 0 ? (
              <FlatList
                data={filteredCocktails}
                keyExtractor={(item) => item.id}
                renderItem={renderCocktailItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth * 0.8 + 16}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingHorizontal: (screenWidth - (screenWidth * 0.8)) / 2,
                  paddingBottom: 16,
                  flexGrow: 1,
                }}
                style={{ flex: 1 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <FontAwesome name="glass" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                <Text className="mb-2 text-lg font-medium text-foreground">No cocktails found</Text>
                <Text className="text-center text-muted-foreground">
                  No recipes found for this category
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <FontAwesome name="hand-pointer-o" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <Text className="mb-2 text-lg font-medium text-foreground">Choose a Category</Text>
            <Text className="text-center text-muted-foreground">
              Select a category above to discover cocktails
            </Text>
          </View>
        )}
      </Container>
    </SafeAreaView>
  );
}