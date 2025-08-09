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
  { id: 'monthly', title: 'Monthly Premium', price: '$4.99', period: 'monthly' },
  { id: 'yearly', title: 'Yearly Premium', price: '$24.99', period: 'yearly' },
  { id: 'forever', title: 'Forever Premium', price: '$34.99', period: 'one-time', highlight: true },
];

export default function PayWallScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useUserSettings();
  const insets = useSafeAreaInsets();

  const handleSubscriptionSelect = async (optionId: string) => {
    if (optionId === 'free') {
      await updateSettings({ subscriptionStatus: 'free' });
      // Navigate back or to popular if coming from disclaimer
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back (e.g., coming from disclaimer), go to popular
        router.replace('/popular');
      }
    } else {
      // Navigate to purchase screen for paid subscriptions
      const selectedOption = subscriptionOptions.find((option) => option.id === optionId);
      if (selectedOption) {
        router.push({
          pathname: '/purchase',
          params: {
            optionId: selectedOption.id,
            title: selectedOption.title,
            price: selectedOption.price,
            period: selectedOption.period || '',
          },
        });
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" />
      <View
        style={{
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
            <Text className="mb-2 text-center text-3xl font-bold text-white">
              {'Bar Vibez Premium'}
            </Text>
            <Text className="text-center text-base text-gray-400">
              {'Unlock All Recipes & Features'}
            </Text>
          </View>

          {/* App Icon */}
          <View className="mb-6 items-center">
            <Image
              source={require('../assets/premiumIcon.png')}
              style={{ width: 160, height: 160 }}
              contentFit="contain"
            />
          </View>

          {/* Features */}
          <View className="mb-6">
            <View className="mb-2 flex-row items-center">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-sm text-white">
                {'Access to over 2000 unique drink recipes'}
              </Text>
            </View>
            <View className="mb-2 flex-row items-center">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-sm text-white">
                {'Add your custom recipes (no more sticky spec sheets!)'}
              </Text>
            </View>
            <View className="mb-2 flex-row items-center">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-sm text-white">
                {"Create venues to track your bar's ingredients & drinks"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="check-circle" size={18} color="#4CAF50" />
              <Text className="ml-3 text-sm text-white">
                {'Get cocktail suggestions based on your inventory'}
              </Text>
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
                  className={`rounded-2xl border-2 p-4 ${
                    option.highlight
                      ? 'bg-primary/10 border-primary'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}>
                  {option.highlight && (
                    <View className="absolute -top-3 self-center rounded-full bg-primary px-3 py-1">
                      <Text className="text-xs font-semibold text-white">BEST VALUE</Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-white">{option.title}</Text>
                      {option.period && (
                        <Text className="mt-1 text-sm text-gray-400">
                          {option.period === 'one-time'
                            ? 'One-time purchase'
                            : `Billed ${option.period}`}
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
            <Text className="py-2 text-center text-xs text-gray-500">
              Continue with Free (Limited Access)
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
