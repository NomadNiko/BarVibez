import '../global.css';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { useEffect, useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { cocktailDB } from '~/lib/database/cocktailDB';
import { UserProvider } from '~/lib/contexts/UserContext';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { ImagePreloader } from '~/lib/utils/imagePreloader';
import { SubscriptionValidator } from '~/lib/services/subscriptionValidator';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  // Force dark mode for bartending app
  const colorScheme = 'dark';
  const isDarkColorScheme = true;
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const initializationStarted = useRef(false);
  const revenueCatListener = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Prevent multiple initialization calls
    if (initializationStarted.current) {
      return;
    }
    initializationStarted.current = true;

    const initializeRevenueCat = async () => {
      try {
        // Check if already configured to prevent duplicate initialization
        const isConfigured = await Purchases.isConfigured();
        if (isConfigured) {
          console.log('RevenueCat already configured, skipping initialization');
          return;
        }

        // Set log level to ERROR only to reduce spam
        Purchases.setLogLevel(LOG_LEVEL.ERROR);

        // Get RevenueCat configuration from app.json
        const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;

        if (!revenueCatConfig?.iosApiKey) {
          console.error('RevenueCat iOS API key not found in app.json');
          return;
        }

        // Configure RevenueCat with the iOS API key
        await Purchases.configure({
          apiKey: revenueCatConfig.iosApiKey,
        });

        console.log('RevenueCat initialized successfully');

        // Set up the customer info listener ONCE here
        const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
        let previousProStatus: boolean | null = null;

        const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          const hasProEntitlement =
            customerInfo.entitlements.active[entitlementIdentifier]?.isActive || false;

          // Only log and update when the status actually changes
          if (previousProStatus !== hasProEntitlement) {
            console.log('Subscription status changed:', hasProEntitlement ? 'Active' : 'Inactive');

            // Update via UserDataManager if available
            const updateSubscriptionStatus = async () => {
              try {
                const { UserDataManager } = await import('~/lib/services/userDataManager');
                UserDataManager.updateSubscriptionStatusFromRevenueCat(hasProEntitlement);
              } catch (error) {
                console.error('Error updating subscription status:', error);
              }
            };

            updateSubscriptionStatus();
            previousProStatus = hasProEntitlement;
          }
        });

        // Store the listener cleanup function
        revenueCatListener.current = () => {
          try {
            Purchases.removeCustomerInfoUpdateListener(listener);
          } catch (error) {
            console.error('Error removing RevenueCat listener:', error);
          }
        };
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      }
    };

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

    const initializeImages = async () => {
      try {
        // First preload critical UI images (premium icon, app icon)
        // This is fast and ensures paywall displays smoothly
        await ImagePreloader.preloadCriticalUIImages();

        // Then preload all cocktail/glass images in background
        // This ensures images are cached for all cocktails regardless of subscription
        ImagePreloader.preloadAllImages()
          .then(() => {
            console.log('All images preloaded successfully');
          })
          .catch((error) => {
            console.error('Failed to preload some images:', error);
          });
      } catch (error) {
        console.error('Failed to preload critical images:', error);
        // Don't block app startup if image preloading fails
      }
    };

    // Initialize RevenueCat, database, and images
    const initializeApp = async () => {
      // Start RevenueCat initialization (doesn't need to block)
      await initializeRevenueCat();

      // Initialize database first (required for app to function)
      await initializeDatabase();

      // Start image preloading after database is ready
      // Critical UI images are loaded first, then cocktail images in background
      await initializeImages();
    };

    initializeApp();

    // Cleanup function
    return () => {
      if (revenueCatListener.current) {
        revenueCatListener.current();
        revenueCatListener.current = null;
      }
    };
  }, []); // Empty dependency array - this should only run once

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
      <StatusBar key="root-status-bar-light" style="light" />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      <UserProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
          <BottomSheetModalProvider>
            <ActionSheetProvider>
              <NavThemeProvider value={NAV_THEME[colorScheme]}>
                <Stack screenOptions={SCREEN_OPTIONS}>
                  <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
                  <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                  <Stack.Screen
                    name="disclaimer"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                      gestureEnabled: false, // Prevent swipe back
                    }}
                  />
                  <Stack.Screen
                    name="cocktail/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="venue/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="venue-cocktails/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="paywall"
                    options={{
                      headerShown: false,
                      presentation: 'fullScreenModal',
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="purchase"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                </Stack>
              </NavThemeProvider>
            </ActionSheetProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </UserProvider>
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
  headerShown: false,
} as const;
