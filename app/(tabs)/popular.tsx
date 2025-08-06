import React, { useState, useMemo, useRef } from 'react';
import { View, ScrollView, Pressable, FlatList, Dimensions, TouchableWithoutFeedback, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { CocktailCard } from '~/components/CocktailCard';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';
import { getCocktailImage } from '~/lib/utils/localImages';
import { getGlassImageNormalized } from '~/lib/utils/glassImageMap';
import { useFavorites, useUserSettings } from '~/lib/contexts/UserContext';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'tag';
}

const CATEGORIES: CategoryItem[] = [
  { id: 'classic', name: 'Classic', icon: 'star', color: '#FFD700', type: 'tag' },
  { id: 'mine', name: 'Favourites', icon: 'bookmark', color: '#607D8B', type: 'tag' },
  { id: 'vodka', name: 'Vodka', icon: 'glass', color: '#E3F2FD', type: 'tag' },
  { id: 'rum', name: 'Rum', icon: 'anchor', color: '#8D6E63', type: 'tag' },
  { id: 'gin', name: 'Gin', icon: 'leaf', color: '#4CAF50', type: 'tag' },
  { id: 'whiskey', name: 'Whiskey', icon: 'fire', color: '#FF8F00', type: 'tag' },
  { id: 'brewed-hot', name: 'Brewed + Hot', icon: 'thermometer-three-quarters', color: '#FF6B35', type: 'tag' },
  { id: 'wine-fizz', name: 'Wine + Fizz', icon: 'certificate', color: '#9C27B0', type: 'tag' },
  { id: 'shot', name: 'Shots', icon: 'tint', color: '#F44336', type: 'tag' },
  { id: '0-proof', name: '0 Proof', icon: 'heart', color: '#E91E63', type: 'tag' },
];

export default function PopularScreen() {
  const { cocktails, isLoading, error } = useCocktails();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();
  const flatListRef = useRef<FlatList>(null);

  const selectedCategory = CATEGORIES[selectedCategoryIndex];

  const filteredCocktails = useMemo(() => {
    const category = selectedCategory;
    if (!category) return [];

    // Special case for Mine - show favorites
    if (category.id === 'mine') {
      const filteredFavorites = cocktails.filter(cocktail => {
        // Only require favorites - don't filter by image requirement for Mine category
        return favorites.includes(cocktail.id);
      });
      
      // Sort favorites: cocktails with images first (alphabetical), then without images (alphabetical)
      const sortedFavorites = filteredFavorites.sort((a, b) => {
        // First, group by image availability
        if (a.image && !b.image) return -1;
        if (!a.image && b.image) return 1;
        
        // Within same image group, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      
      return sortedFavorites;
    }

    // Filter cocktails by tags and ingredients
    const results = cocktails.filter(cocktail => {
      // Must have an image
      if (!cocktail.image) return false;
      
      const cocktailTags = cocktail.tags || [];
      const ingredients = cocktail.ingredients.map(ing => ing.name.toLowerCase());
      
      // Handle special categories
      if (category.id === 'brewed-hot') {
        return cocktailTags.some(tag => tag.toLowerCase().includes('hotdrinks') || tag.toLowerCase().includes('hot-drinks')) ||
               cocktail.category?.toLowerCase().includes('coffee') ||
               cocktail.category?.toLowerCase().includes('tea');
      }
      
      if (category.id === 'wine-fizz') {
        return ingredients.some(ing => {
          const ingredient = ing.toLowerCase();
          // Only actual wines and sparkling beverages
          return (ingredient.includes('wine') && !ingredient.includes('wine glass')) || 
                 ingredient.includes('champagne') || 
                 ingredient.includes('prosecco') ||
                 ingredient.includes('cava') ||
                 ingredient.includes('sparkling wine') ||
                 ingredient.includes('moscato') ||
                 ingredient.includes('asti') ||
                 ingredient.includes('pinot noir') ||
                 ingredient.includes('chardonnay') ||
                 ingredient.includes('sauvignon blanc') ||
                 ingredient.includes('riesling') ||
                 ingredient.includes('rosé') ||
                 ingredient.includes('claret') ||
                 ingredient.includes('rioja') ||
                 ingredient.includes('dry prosecco');
        }) ||
        cocktailTags.some(tag => {
          const t = tag.toLowerCase();
          return t.includes('wine') || 
                 t.includes('fizz') || 
                 t.includes('spritz') || 
                 t.includes('sparkling');
        });
      }
      
      if (category.id === 'shot') {
        return cocktail.category?.toLowerCase().includes('shot') ||
               cocktail.glass?.toLowerCase().includes('shot') ||
               cocktailTags.some(tag => tag.toLowerCase().includes('shot'));
      }
      
      if (category.id === '0-proof') {
        return cocktail.alcoholic?.toLowerCase() === 'non alcoholic' ||
               cocktail.alcoholic?.toLowerCase() === 'non-alcoholic';
      }
      
      if (category.id === 'classic') {
        // Use Tier 1 cocktails for Classic category
        return cocktail.tier === 1;
      }
      
      // For spirits (gin, rum, vodka, whiskey), check ingredients
      if (category.id === 'gin') {
        // Comprehensive gin matching (avoiding ginger)
        return ingredients.some(ingredient => {
          const ing = ingredient.toLowerCase();
          // Basic gin patterns
          if (ing === 'gin' || 
              ing.startsWith('gin ') || 
              ing.endsWith(' gin') ||
              ing.includes(' gin ')) {
            return true;
          }
          // Specific gin types from the database
          return ing.includes('london dry gin') ||
                 ing.includes('plymouth gin') ||
                 ing.includes('sloe gin') ||
                 ing.includes('old tom gin') ||
                 ing.includes('pink gin') ||
                 ing.includes('dry gin') ||
                 ing.includes('orange flavored gin') ||
                 ing.includes('orange gin') ||
                 ing.includes('aviation gin') ||
                 ing.includes('old raj gin') ||
                 ing.includes('dorothy parker gin') ||
                 ing.includes("ford's gin") ||
                 ing.includes('fords gin') ||
                 ing.includes('new amsterdam gin') ||
                 ing.includes('bombay sapphire') ||
                 ing.includes('bombay london dry') ||
                 ing.includes("seagram's gin") ||
                 ing.includes("hendrick's gin") ||
                 ing.includes('mint-flavored gin') ||
                 ing.includes('beefeater') ||
                 ing.includes('tanqueray') ||
                 ing.includes("hayman's old tom") ||
                 ing.includes('ransom old tom') ||
                 ing.includes('anchor junipero gin') ||
                 ing.includes('anchor genevieve gin') ||
                 ing.includes('martin miller') ||
                 ing.includes('perry\'s tot');
        });
      }
      
      if (category.id === 'vodka') {
        // Comprehensive vodka matching
        return ingredients.some(ingredient => {
          const ing = ingredient.toLowerCase();
          return ing === 'vodka' ||
                 ing.includes('vodka') ||
                 ing.includes('grey goose') ||
                 ing.includes('svedka') ||
                 ing.includes('skyy') ||
                 ing.includes('charbay vodka') ||
                 ing.includes('alchemia chocolate vodka');
        });
      }
      
      if (category.id === 'rum') {
        // Comprehensive rum matching
        return ingredients.some(ingredient => {
          const ing = ingredient.toLowerCase();
          return ing === 'rum' ||
                 ing.includes(' rum') ||
                 ing.startsWith('rum ') ||
                 ing.includes('light rum') ||
                 ing.includes('dark rum') ||
                 ing.includes('white rum') ||
                 ing.includes('gold rum') ||
                 ing.includes('spiced rum') ||
                 ing.includes('coconut rum') ||
                 ing.includes('aged rum') ||
                 ing.includes('overproof rum') ||
                 ing.includes('jamaican rum') ||
                 ing.includes('jamaica rum') ||
                 ing.includes('citrus rum') ||
                 ing.includes('vanilla rum') ||
                 ing.includes('banana rum') ||
                 ing.includes('malibu') ||
                 ing.includes('captain morgan') ||
                 ing.includes('bacardi') ||
                 ing.includes('gosling') ||
                 ing.includes('appleton') ||
                 ing.includes('mount gay') ||
                 ing.includes('el dorado') ||
                 ing.includes('flor de caña') ||
                 ing.includes('barbancourt') ||
                 ing.includes('cruzan') ||
                 ing.includes('zacapa') ||
                 ing.includes('diplomático') ||
                 ing.includes('santa teresa') ||
                 ing.includes('plantation') ||
                 ing.includes('smith & cross') ||
                 ing.includes('scarlet ibis') ||
                 ing.includes('rhum') ||
                 ing.includes('cachaça') ||
                 ing.includes('cachaca') ||
                 ing.includes('african rum') ||
                 ing.includes('cuban rum') ||
                 ing.includes('blackstrap') ||
                 ing.includes('banks 5-island') ||
                 ing.includes('lemon hart') ||
                 ing.includes('caña brava') ||
                 ing.includes('ron del barrilito');
        });
      }
      
      if (category.id === 'whiskey') {
        // Comprehensive whiskey/whisky matching
        return ingredients.some(ingredient => {
          const ing = ingredient.toLowerCase();
          return ing.includes('whiskey') ||
                 ing.includes('whisky') ||
                 ing.includes('bourbon') ||
                 ing.includes('scotch') ||
                 ing.includes('rye') && (ing.includes('whiskey') || ing.includes('whisky') || ing.includes('old overholt') || ing.includes('rittenhouse') || ing.includes('templeton') || ing.includes('sazerac')) ||
                 ing.includes('irish') && ing.includes('whisk') ||
                 ing.includes('canadian') && ing.includes('whisk') ||
                 ing.includes('tennessee') && ing.includes('whisk') ||
                 ing.includes('jack daniels') ||
                 ing.includes('jim beam') ||
                 ing.includes('maker\'s mark') ||
                 ing.includes('woodford reserve') ||
                 ing.includes('evan williams') ||
                 ing.includes('buffalo trace') ||
                 ing.includes('bulleit') ||
                 ing.includes('knob creek') ||
                 ing.includes('wild turkey') ||
                 ing.includes('four roses') ||
                 ing.includes('elijah craig') ||
                 ing.includes('old grand-dad') ||
                 ing.includes('eagle rare') ||
                 ing.includes('baker\'s bourbon') ||
                 ing.includes('stagg') ||
                 ing.includes('jameson') ||
                 ing.includes('bushmills') ||
                 ing.includes('redbreast') ||
                 ing.includes('crown royal') ||
                 ing.includes('seagram') ||
                 ing.includes('macallan') ||
                 ing.includes('highland park') ||
                 ing.includes('laphroaig') ||
                 ing.includes('bowmore') ||
                 ing.includes('caol ila') ||
                 ing.includes('springbank') ||
                 ing.includes('compass box') ||
                 ing.includes('famous grouse') ||
                 ing.includes('yamazaki') ||
                 ing.includes('suntory') ||
                 ing.includes('bernheim') ||
                 ing.includes('high west') ||
                 ing.includes('whistlepig') ||
                 ing.includes('clontarf') ||
                 ing.includes('knappogue');
        });
      }
      
      // This should never be reached now, but keep as fallback
      const spiritName = category.name.toLowerCase();
      return ingredients.some(ingredient => ingredient.includes(spiritName));
    });

    // Sort results alphabetically by name
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategory, cocktails, favorites]);

  const goToPreviousCategory = () => {
    setSelectedCategoryIndex((prev) => (prev - 1 + CATEGORIES.length) % CATEGORIES.length);
    // Reset to first item when changing category
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const goToNextCategory = () => {
    setSelectedCategoryIndex((prev) => (prev + 1) % CATEGORIES.length);
    // Reset to first item when changing category
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleCategorySelect = (index: number) => {
    setSelectedCategoryIndex(index);
    setShowDropdown(false);
    // Reset to first item when changing category
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleFavoriteToggle = async (cocktailId: string, event: any) => {
    event.stopPropagation(); // Prevent navigation when tapping favorite button
    
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

  const renderCocktailItem = ({ item, index }: { item: Cocktail; index: number }) => (
    <View
      style={{ width: screenWidth * 0.8, marginRight: 16, flex: 1 }}>
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
      <View style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? 70 : 80, position: 'relative' }}>
        {/* Category Carousel */}
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View className="mb-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={goToPreviousCategory}
              className="p-2"
              style={{ opacity: 0.7 }}>
              <FontAwesome name="chevron-left" size={24} color="#9CA3AF" />
            </Pressable>
            
            <Pressable 
              onPress={toggleDropdown}
              className="flex-1 items-center"
              style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text className="text-2xl font-bold text-foreground">
                {selectedCategory.name}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={goToNextCategory}
              className="p-2"
              style={{ opacity: 0.7 }}>
              <FontAwesome name="chevron-right" size={24} color="#9CA3AF" />
            </Pressable>
          </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Dropdown Menu - Moved outside and positioned absolutely */}
        {showDropdown && (
          <View 
            style={{
              position: 'absolute',
              top: 56,
              left: 20,
              right: 20,
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#333333',
              zIndex: 9999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 20,
            }}>
            {CATEGORIES.map((category, index) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategorySelect(index)}
                  style={{
                    padding: 16,
                    borderBottomWidth: index < CATEGORIES.length - 1 ? 1 : 0,
                    borderBottomColor: '#333333',
                    backgroundColor: index === selectedCategoryIndex ? '#333333' : 'transparent',
                    borderTopLeftRadius: index === 0 ? 12 : 0,
                    borderTopRightRadius: index === 0 ? 12 : 0,
                    borderBottomLeftRadius: index === CATEGORIES.length - 1 ? 12 : 0,
                    borderBottomRightRadius: index === CATEGORIES.length - 1 ? 12 : 0,
                  }}>
                  <Text 
                    style={{ 
                      color: index === selectedCategoryIndex ? '#ffffff' : '#cccccc',
                      fontSize: 16,
                      fontWeight: index === selectedCategoryIndex ? '600' : '400',
                      textAlign: 'center',
                    }}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Cocktails Content */}
        <View className="flex-1">
            {filteredCocktails.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={filteredCocktails}
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
                <FontAwesome 
                  name={selectedCategory.id === 'mine' ? 'bookmark-o' : 'glass'} 
                  size={48} 
                  color="#9CA3AF" 
                  style={{ marginBottom: 16 }} 
                />
                <Text className="mb-2 text-lg font-medium text-foreground">
                  {selectedCategory.id === 'mine' ? 'No Favorites Yet' : 'No cocktails found'}
                </Text>
                <Text className="text-center text-muted-foreground">
                  {selectedCategory.id === 'mine' 
                    ? 'Tap the heart ♥ on cocktails to add them to your favorites' 
                    : 'No recipes found for this category'
                  }
                </Text>
              </View>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}