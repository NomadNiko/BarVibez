import { Link, Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="popular"
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? 'white' : 'black',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: 10,
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
  );
}
