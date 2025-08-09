import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';
import { getGlassImageNormalized } from '~/lib/utils/glassImageMap';
import { useFavorites, useUserSettings } from '~/lib/contexts/UserContext';
import { MeasurementConverter } from '~/lib/utils/measurementConverter';

const { width, height } = Dimensions.get('window');

// Helper function to parse and sort ingredients by measurement
const sortIngredients = (ingredients: any[]) => {
  const parseMeasurement = (measure: string | undefined) => {
    if (!measure) return { value: 0, unit: 'other', original: measure };
    
    const lowerMeasure = measure.toLowerCase().trim();
    
    // Check for oz measurements (including fractions like 1/2 oz)
    const ozMatch = lowerMeasure.match(/(\d+\.?\d*|\d+\/\d+)\s*oz/);
    if (ozMatch) {
      let value = ozMatch[1];
      // Handle fractions
      if (value.includes('/')) {
        const [num, den] = value.split('/').map(Number);
        value = (num / den).toString();
      }
      return { value: parseFloat(value), unit: 'oz', original: measure };
    }
    
    // Check for tablespoon measurements
    if (lowerMeasure.includes('tblsp') || lowerMeasure.includes('tablespoon') || lowerMeasure.includes('tbsp')) {
      const numMatch = lowerMeasure.match(/(\d+\.?\d*|\d+\/\d+)/);
      let value = 1;
      if (numMatch) {
        if (numMatch[1].includes('/')) {
          const [num, den] = numMatch[1].split('/').map(Number);
          value = num / den;
        } else {
          value = parseFloat(numMatch[1]);
        }
      }
      return { value, unit: 'tablespoon', original: measure };
    }
    
    // Check for dash measurements
    if (lowerMeasure.includes('dash')) {
      const numMatch = lowerMeasure.match(/(\d+\.?\d*)/);
      return { value: numMatch ? parseFloat(numMatch[1]) : 1, unit: 'dash', original: measure };
    }
    
    // Everything else (garnishes, etc)
    return { value: 0, unit: 'other', original: measure };
  };
  
  return ingredients.sort((a, b) => {
    const aParsed = parseMeasurement(a.measure);
    const bParsed = parseMeasurement(b.measure);
    
    // Sort order: oz > tablespoon > dash > other
    const unitOrder = { 'oz': 1, 'tablespoon': 2, 'dash': 3, 'other': 4 };
    
    // First sort by unit type
    if (unitOrder[aParsed.unit] !== unitOrder[bParsed.unit]) {
      return unitOrder[aParsed.unit] - unitOrder[bParsed.unit];
    }
    
    // Within same unit type, sort by value descending
    if (aParsed.unit === bParsed.unit && aParsed.unit !== 'other') {
      return bParsed.value - aParsed.value;
    }
    
    // Keep original order for 'other' items
    return 0;
  });
};

export default function RandomCocktailScreen() {
  const { cocktails, isLoading, error } = useCocktails();
  const [randomCocktail, setRandomCocktail] = useState<Cocktail | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useUserSettings();

  // Get a random cocktail
  const getRandomCocktail = () => {
    if (cocktails.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * cocktails.length);
    const selectedCocktail = cocktails[randomIndex];
    setRandomCocktail(selectedCocktail);
  };

  // Get initial random cocktail when cocktails load
  useEffect(() => {
    if (cocktails.length > 0 && !randomCocktail) {
      getRandomCocktail();
    }
  }, [cocktails, randomCocktail]);

  const handleFavoriteToggle = async () => {
    if (!randomCocktail?.id) return;
    
    try {
      if (isFavorite(randomCocktail.id)) {
        await removeFavorite(randomCocktail.id);
      } else {
        await addFavorite(randomCocktail.id);
      }
    } catch (error) {
      console.error('Random page - favorite toggle error:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || cocktails.length === 0 || !randomCocktail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <FontAwesome name="glass" size={48} color="#ffffff" style={{ marginBottom: 20 }} />
          <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 10 }}>
            Loading cocktails...
          </Text>
          <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center' }}>
            Preparing your random cocktail
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}>
        {/* Action buttons - top corners */}
        <View style={{ 
          position: 'absolute',
          top: 10,
          left: 20,
          zIndex: 1
        }}>
          <Pressable
            onPress={handleFavoriteToggle}
            style={{
              backgroundColor: '#333333',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <FontAwesome 
              name={isFavorite(randomCocktail.id) ? 'heart' : 'heart-o'} 
              size={16} 
              color={isFavorite(randomCocktail.id) ? '#FF6B6B' : '#ffffff'} 
            />
          </Pressable>
        </View>

        <View style={{ 
          position: 'absolute',
          top: 10,
          right: 20,
          zIndex: 1
        }}>
          <Pressable
            onPress={getRandomCocktail}
            style={{
              backgroundColor: '#333333',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <FontAwesome name="random" size={16} color="#ffffff" />
          </Pressable>
        </View>

        {/* Cocktail Name */}
        <Text style={{ color: '#ffffff', fontSize: 24, textAlign: 'center', letterSpacing: 1, paddingHorizontal: 20, paddingTop: 60, marginBottom: 20 }}>
          {randomCocktail.name}
        </Text>

        {/* Glassware Image */}
        <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 20 }}>
          <Image
            source={getGlassImageNormalized(randomCocktail.glass)}
            style={{ width: 200, height: 200 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        {/* Ingredients */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          {sortIngredients(randomCocktail.ingredients).map((ingredient, index) => (
            <View 
              key={index} 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 2,
                paddingHorizontal: 0
              }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 16, 
                flex: 1,
                marginLeft: 30
              }}>
                {ingredient.name}
              </Text>
              {ingredient.measure && (
                <Text style={{ 
                  color: '#cccccc', 
                  fontSize: 14,
                  marginLeft: 10,
                  marginRight: 30
                }}>
                  {MeasurementConverter.convertIngredientMeasure(
                    ingredient.measure, 
                    settings?.measurements || 'oz'
                  )}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 18, 
            lineHeight: 26,
            textAlign: 'center'
          }}>
            {randomCocktail.instructions.en}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}