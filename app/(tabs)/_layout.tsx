import { Tabs, useRouter } from 'expo-router';
import { Platform, View, AppState } from 'react-native';
import { useEffect, useRef } from 'react';
// import { HeaderButton } from '../../components/HeaderButton'; // Unused
import { TabBarIcon } from '../../components/TabBarIcon';
import { SubscriptionValidator } from '~/lib/services/subscriptionValidator';
import { AppInitializationManager } from '~/lib/utils/appInitialization';

export default function TabLayout() {
  // Force dark mode for bartending app
  // const colorScheme = 'dark'; // Unused
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only validate subscription when app resumes from background
    // Initial app launch flow is handled by index.tsx -> disclaimer -> paywall
    const validateSubscription = async (isAppResuming: boolean = false) => {
      if (isAppResuming) {
        // Small delay to ensure RevenueCat is fully initialized
        setTimeout(async () => {
          await SubscriptionValidator.validateAndHandlePaywall(router, isAppResuming);
        }, 1000);
      }
    };

    // Mark as initialized but don't run initial validation
    // The app launch flow is handled elsewhere (index.tsx)
    if (!hasInitialized.current && !AppInitializationManager.hasValidatedSubscription()) {
      hasInitialized.current = true;
      AppInitializationManager.markSubscriptionValidated();
      console.log('[TabLayout] Cold start - app launch flow handled by index.tsx');
    }

    // Re-validate when app comes back from background
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Only trigger on actual background->foreground transitions
      // Skip if this is the initial app state setup or if we're navigating between screens
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        hasInitialized.current // Ensure we've already done initial setup
      ) {
        console.log('[TabLayout] App resumed from background - re-validating subscription');
        // Small delay to avoid interference with any ongoing navigation
        setTimeout(() => {
          validateSubscription(true);
        }, 2000); // Increased delay to avoid navigation conflicts
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
      // Reset initialization flag when component unmounts (useful for development hot reload)
      if (hasInitialized.current) {
        AppInitializationManager.reset();
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <>
    <Tabs
      initialRouteName="popular"
      screenOptions={{
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: Platform.OS === 'android' ? 10 : 20,
          backgroundColor: '#000000',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'android' ? 70 : 80,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="popular"
        options={{
          title: 'Popular',
          tabBarIcon: ({ color }) => <TabBarIcon name="star" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="random"
        options={{
          title: 'Random',
          tabBarIcon: ({ color }) => <TabBarIcon name="random" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="cocktails"
        options={{
          title: 'Cocktails',
          tabBarIcon: ({ color }) => <TabBarIcon name="glass" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="speakeasy"
        options={{
          title: 'Speakeasy',
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'User',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
    {Platform.OS === 'android' && (
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: '#000000',
        zIndex: -1,
      }} />
    )}
    </>
  );
}
