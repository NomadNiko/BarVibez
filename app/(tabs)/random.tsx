import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { useCocktails } from '~/lib/hooks/useCocktails';
import { Cocktail } from '~/lib/types/cocktail';

const { width, height } = Dimensions.get('window');

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

export default function RandomCocktailScreen() {
  const { cocktails, isLoading, error } = useCocktails();
  const [randomCocktail, setRandomCocktail] = useState<Cocktail | null>(null);

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Shuffle button - top right corner */}
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
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, paddingHorizontal: 20, paddingTop: 60, marginBottom: 20 }}>
          {randomCocktail.name}
        </Text>

        {/* Glassware Image */}
<View style={{ alignItems: 'center', marginBottom: 40, marginTop: 20 }}>
          <Image
            source={getGlassImage(randomCocktail.glass)}
            style={{ width: 200, height: 200 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        {/* Ingredients */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          {randomCocktail.ingredients.map((ingredient, index) => (
            <View 
              key={index} 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 0
              }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 20, 
                flex: 1,
                fontWeight: '400',
                marginLeft: 30
              }}>
                {ingredient.name}
              </Text>
              {ingredient.measure && (
                <Text style={{ 
                  color: '#cccccc', 
                  fontSize: 18,
                  marginLeft: 10,
                  marginRight: 30,
                  fontWeight: '300'
                }}>
                  {ingredient.measure}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 20, 
            lineHeight: 28,
            textAlign: 'center',
            fontWeight: '400'
          }}>
            {randomCocktail.instructions.en}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}