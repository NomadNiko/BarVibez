import '../global.css';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '~/components/ThemeToggle';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { cocktailDB } from '~/lib/database/cocktailDB';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Glass image mapping for preloading
const getGlassImage = (glassType: string) => {
  const glassName = glassType.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  
  const glassMap: Record<string, any> = {
    'cocktailglass': require('../assets/glass/cocktailGlass.jpg'),
    'martiniglass': require('../assets/glass/martiniGlass.jpg'),
    'oldfashionedglass': require('../assets/glass/oldFashionedGlass.jpg'),
    'highballglass': require('../assets/glass/highballGlass.jpg'),
    'collinsglass': require('../assets/glass/collinsGlass.jpg'),
    'margaritacoupe': require('../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritacoupetteglass': require('../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritacoupette': require('../assets/glass/MargaritaCoupetteGlass.jpg'),
    'margaritalgass': require('../assets/glass/margaritaGlass.jpg'),
    'champagneflute': require('../assets/glass/champagneFlute.jpg'),
    'wineglass': require('../assets/glass/wineGlass.jpg'),
    'whitwineglass': require('../assets/glass/whiteWineGlass.jpg'),
    'brandysnifter': require('../assets/glass/brandySnifter.jpg'),
    'shotglass': require('../assets/glass/shotGlass.jpg'),
    'beerglass': require('../assets/glass/beerGlass.jpg'),
    'beermug': require('../assets/glass/beerMug.jpg'),
    'pilsner': require('../assets/glass/beerPilsner.jpg'),
    'hurricaneglass': require('../assets/glass/hurricanGlass.jpg'),
    'coupglass': require('../assets/glass/coupGlass.jpg'),
    'nickandnoraglass': require('../assets/glass/nickAndNoraGlass.jpg'),
    'cordial': require('../assets/glass/cordialGlass.jpg'),
    'cordialglass': require('../assets/glass/cordialGlass.jpg'),
    'irishcoffeecup': require('../assets/glass/irishCoffeeCup.jpg'),
    'coffeemug': require('../assets/glass/coffeeMug.jpg'),
    'coppermug': require('../assets/glass/copperMug.jpg'),
    'jar': require('../assets/glass/jar.jpg'),
    'masonjar': require('../assets/glass/masonJar.jpg'),
    'parfaitglass': require('../assets/glass/parfaitGlass.jpg'),
    'pintglass': require('../assets/glass/pintGlass.jpg'),
    'pitcher': require('../assets/glass/pitcher.jpg'),
    'poussecafeglass': require('../assets/glass/pousseCafeGlass.jpg'),
    'punchbowl': require('../assets/glass/punchBowl.jpg'),
    'whiskyglass': require('../assets/glass/whiskeyGlass.jpg'),
    'whiskeyglass': require('../assets/glass/whiskeyGlass.jpg'),
    'whiskeysour': require('../assets/glass/whiskeySourGlass.jpg'),
    'whiskysourglass': require('../assets/glass/whiskeySourGlass.jpg'),
    'balloonglass': require('../assets/glass/balloonGlass.jpg'),
  };
  
  return glassMap[glassName] || require('../assets/glass/cocktailGlass.jpg');
};


export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await cocktailDB.initialize();
        const cocktailCount = cocktailDB.getAllCocktails().length;

        if (cocktailCount === 0) {
          await cocktailDB.forceRefreshFromJSON();
        }
        
        // Force refresh to load updated JSON with local image names
        await cocktailDB.forceRefreshFromJSON();

        setIsDbInitialized(true);

      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Failed to initialize database');
      }
    };

    initializeDatabase();
  }, []);

  // Don't render ANYTHING until database is loaded
  if (!isDbInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}>
        {dbError ? (
          <>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>Database Error</Text>
            <Text style={{ color: '#ff4444', fontSize: 14 }}>{dbError}</Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>
              Loading Cocktails...
            </Text>
            <Text style={{ color: '#888', fontSize: 14 }}>Initializing database...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}

      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ActionSheetProvider>
            <NavThemeProvider value={NAV_THEME[colorScheme]}>
              <Stack screenOptions={SCREEN_OPTIONS}>
                <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
                <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                <Stack.Screen
                  name="cocktail/[id]"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                  }}
                />
              </Stack>
            </NavThemeProvider>
          </ActionSheetProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>

      {/* </ExampleProvider> */}
    </>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const TABS_OPTIONS = {
  headerShown: false,
} as const;

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
