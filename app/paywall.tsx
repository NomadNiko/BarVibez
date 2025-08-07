import React from 'react';
import { View, Pressable, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { useRouter } from 'expo-router';
import { useUserSettings } from '~/lib/contexts/UserContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SubscriptionOption {
  id: string;
  title: string;
  price: string;
  period?: string;
  highlight?: boolean;
}

const subscriptionOptions: SubscriptionOption[] = [
  { id: 'monthly', title: 'Monthly Premium', price: '$4.99', period: '/month' },
  { id: 'yearly', title: 'Yearly Premium', price: '$24.99', period: '/year' },
  { id: 'forever', title: 'Forever Premium', price: '$34.99', period: 'one-time', highlight: true },
];

export default function PayWallScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useUserSettings();
  const insets = useSafeAreaInsets();

  const handleSubscriptionSelect = async (optionId: string) => {
    if (optionId === 'free') {
      await updateSettings({ subscriptionStatus: 'free' });
      // Navigate to main app for free users
      router.replace('/popular');
    } else {
      // Navigate to purchase screen for paid subscriptions
      const selectedOption = subscriptionOptions.find(option => option.id === optionId);
      if (selectedOption) {
        router.push({
          pathname: '/purchase',
          params: {
            optionId: selectedOption.id,
            title: selectedOption.title,
            price: selectedOption.price,
            period: selectedOption.period || '',
          }
        });
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ 
        flex: 1, 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 24,
      }}>
        {/* Content */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="mb-4">
            <Text className="text-3xl font-bold text-white text-center mb-2">
              Bar Vibez Premium
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Unlock all cocktail recipes
            </Text>
          </View>

          {/* App Icon */}
          <View className="items-center mb-6">
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>

          {/* Features */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-white text-sm">Access to 2300+ cocktail recipes</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-white text-sm">Add custom recipes</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-white text-sm">Manage recipes by venue in Speakeasy tab</Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-white text-sm">All future updates included</Text>
            </View>
          </View>

          {/* Subscription Options */}
          <View className="mb-5">
            {subscriptionOptions.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSubscriptionSelect(option.id)}
                className="mb-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View 
                  className={`p-4 rounded-2xl border-2 ${
                    option.highlight 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-700 bg-gray-900/50'
                  }`}>
                  {option.highlight && (
                    <View className="absolute -top-3 self-center px-3 py-1 bg-primary rounded-full">
                      <Text className="text-xs font-semibold text-white">BEST VALUE</Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-white">{option.title}</Text>
                      {option.period && (
                        <Text className="text-sm text-gray-400 mt-1">
                          {option.period === 'one-time' ? 'One-time purchase' : `Billed ${option.period}`}
                        </Text>
                      )}
                    </View>
                    <Text className="text-2xl font-bold text-white">{option.price}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Continue Free button */}
        <View className="pb-6">
          <Pressable
            onPress={() => handleSubscriptionSelect('free')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text className="text-center text-xs text-gray-500 py-2">
              Continue with Free (Limited Access)
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}