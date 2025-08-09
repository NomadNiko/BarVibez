import React, { useState } from 'react';
import { View, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserSettings } from '~/lib/contexts/UserContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function PurchaseScreen() {
  const router = useRouter();
  const { optionId, title, price, period } = useLocalSearchParams<{
    optionId: string;
    title: string;
    price: string;
    period?: string;
  }>();
  const { updateSettings } = useUserSettings();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    // Mock purchase delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: Implement actual RevenueCat purchase logic here
    console.log('Mock purchase:', { optionId, title, price, period });
    
    try {
      // Update subscription status to premium
      await updateSettings({ subscriptionStatus: 'premium' });
      
      // Close purchase screen and paywall, return to where user was
      router.dismissAll();
    } catch (error) {
      console.error('Failed to update subscription status:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingVertical: 16,
        }}>
          <Pressable
            onPress={handleCancel}
            style={{ padding: 8, marginLeft: -8 }}
            disabled={isProcessing}>
            <FontAwesome name="times" size={24} color="#888888" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#ffffff' }}>
              Complete Purchase
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}>
          
          {/* App Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 80, height: 80, marginBottom: 16 }}
              contentFit="contain"
            />
            <Text style={{ fontSize: 24, color: '#ffffff', textAlign: 'center' }}>
              Bar Vibez Premium
            </Text>
          </View>

          {/* Purchase Details */}
          <View style={{ 
            backgroundColor: '#1a1a1a',
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#333333',
          }}>
            <Text style={{ fontSize: 20, color: '#ffffff', marginBottom: 16, textAlign: 'center', lineHeight: 28 }}>
              {title}
            </Text>
            <Text style={{ fontSize: 32, color: '#10B981', marginBottom: 16, textAlign: 'center', lineHeight: 40, paddingVertical: 4 }}>
              {price}
            </Text>
            {period && (
              <Text style={{ fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 16 }}>
                {period === 'one-time' ? 'One-time purchase' : `Billed ${period}`}
              </Text>
            )}
            
            {/* Features */}
            <View style={{ borderTopWidth: 1, borderTopColor: '#333333', paddingTop: 16 }}>
              <Text style={{ fontSize: 16, color: '#ffffff', marginBottom: 12 }}>
                What&apos;s included:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                <Text style={{ marginLeft: 12, color: '#ffffff', fontSize: 14 }}>Access to 2300+ cocktail recipes</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                <Text style={{ marginLeft: 12, color: '#ffffff', fontSize: 14 }}>Add custom recipes</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                <Text style={{ marginLeft: 12, color: '#ffffff', fontSize: 14 }}>Manage recipes by venue</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                <Text style={{ marginLeft: 12, color: '#ffffff', fontSize: 14 }}>All future updates included</Text>
              </View>
            </View>
          </View>

          {/* Mock RevenueCat Purchase Section */}
          <View style={{
            backgroundColor: '#0d1117',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#30363d',
          }}>
            <Text style={{ fontSize: 12, color: '#7d8590', marginBottom: 12, textAlign: 'center' }}>
              MOCK REVENUE CAT PURCHASE SCREEN
            </Text>
            <Text style={{ fontSize: 14, color: '#f0f6fc', marginBottom: 16, textAlign: 'center' }}>
              This is a placeholder for the actual RevenueCat purchase flow
            </Text>
            
            {/* Mock Purchase Button */}
            <Pressable
              onPress={handlePurchase}
              disabled={isProcessing}
              style={({ pressed }) => ({
                backgroundColor: isProcessing ? '#666666' : '#238636',
                borderRadius: 8,
                padding: 16,
                opacity: pressed ? 0.8 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#ffffff', fontSize: 16 }}>
                    Processing...
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome name="credit-card" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#ffffff', fontSize: 16 }}>
                    Purchase {price}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Terms */}
          <Text style={{ fontSize: 12, color: '#666666', textAlign: 'center', lineHeight: 16 }}>
            By purchasing, you agree to our Terms of Service.{'\n'}
            Payment will be charged to your App Store account.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}