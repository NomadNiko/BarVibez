import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
// import { HeaderButton } from '../../components/HeaderButton'; // Unused
import { TabBarIcon } from '../../components/TabBarIcon';

export default function TabLayout() {
  // Force dark mode for bartending app
  // const colorScheme = 'dark'; // Unused

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
