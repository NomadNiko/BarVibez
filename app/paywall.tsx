import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { useRouter } from 'expo-router';
import { useUserSettings } from '~/lib/contexts/UserContext';
import { useAppStoreIdentification } from '~/lib/hooks/useAppStoreIdentification';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

interface SubscriptionOption {
  id: string;
  title: string;
  price: string;
  period?: string;
  highlight?: boolean;
}

const subscriptionOptions: SubscriptionOption[] = [
  { id: 'bv_499_monthly_01', title: 'Monthly Premium', price: '$4.99', period: 'monthly' },
  { id: 'bv_2499_yearly_01', title: 'Yearly Premium', price: '$24.99', period: 'yearly' },
  { id: 'us.nomadsoft.barvibez.Lifetime', title: 'Forever Premium', price: '$34.99', period: 'one-time', highlight: true },
];

export default function PayWallScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useUserSettings();
  const { hasProSubscription } = useAppStoreIdentification();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingOptionId, setProcessingOptionId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Redirect premium users away from paywall
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (hasProSubscription()) {
        console.log('User already has Pro subscription, redirecting away from paywall');
        // Small delay to prevent multiple rapid redirects
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/popular');
          }
        }, 100);
      }
    };
    
    checkAndRedirect();
  }, [hasProSubscription]);

  const handlePurchase = async (optionId: string) => {
    setIsProcessing(true);
    setProcessingOptionId(optionId);
    setPurchaseError(null);
    
    try {
      // Get fresh customer info to check current subscription status
      console.log('Checking current subscription status before purchase...');
      const currentCustomerInfo = await Purchases.getCustomerInfo();
      
      const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
      const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
      const currentlyHasPro = currentCustomerInfo.entitlements.active[entitlementIdentifier]?.isActive;
      
      if (currentlyHasPro) {
        console.log('Purchase blocked: User already has Pro subscription');
        Alert.alert(
          'Already Subscribed',
          'You already have an active subscription. If you need to change your subscription, please manage it in Settings > Subscriptions.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        setProcessingOptionId(null);
        return;
      }
      
      console.log('Starting RevenueCat purchase for product:', optionId);
      
      // Get the product from RevenueCat
      const products = await Purchases.getProducts([optionId]);
      const product = products.find(p => p.identifier === optionId);
      
      if (!product) {
        throw new Error(`Product not found: ${optionId}`);
      }
      
      console.log('Found product:', product.identifier, product.title);
      
      // Make the purchase through RevenueCat
      const purchaseResult = await Purchases.purchaseStoreProduct(product);
      
      console.log('Purchase result:', {
        productIdentifier: purchaseResult.productIdentifier,
        customerInfo: purchaseResult.customerInfo?.originalAppUserId,
        entitlements: Object.keys(purchaseResult.customerInfo?.entitlements.active || {})
      });
      
      // Check if user has Pro entitlement
      const hasProEntitlement = purchaseResult.customerInfo?.entitlements.active[entitlementIdentifier]?.isActive;
      
      if (hasProEntitlement) {
        console.log('Purchase successful - updating user to premium');
        
        // Use UserDataManager directly to ensure proper data flow
        const { UserDataManager } = await import('~/lib/services/userDataManager');
        UserDataManager.updateSubscriptionStatusFromRevenueCat(hasProEntitlement);
        
        // Also update settings as backup
        await updateSettings({ subscriptionStatus: 'premium' });
        
        // Small delay to ensure all listeners have processed the change
        setTimeout(() => {
          // Navigate back to the main app
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/popular');
          }
        }, 100);
      } else {
        console.warn('Purchase completed but Pro entitlement not active');
        Alert.alert(
          'Purchase Issue',
          'Purchase completed but subscription not activated. Please contact support.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('RevenueCat purchase failed:', error);
      
      // Handle user cancellation gracefully
      if (error?.userCancelled) {
        console.log('User cancelled the purchase');
        // Don't show error for cancellation
      } else {
        const errorMessage = error?.message || 'Purchase failed. Please try again.';
        Alert.alert('Purchase Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setIsProcessing(false);
      setProcessingOptionId(null);
    }
  };

  const handleRestorePurchases = async () => {
    setIsProcessing(true);
    setPurchaseError(null);
    
    try {
      console.log('Restoring RevenueCat purchases...');
      
      // Restore purchases through RevenueCat
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('Restore result:', {
        originalAppUserId: customerInfo.originalAppUserId,
        entitlements: Object.keys(customerInfo.entitlements.active || {})
      });
      
      // Check if user has Pro entitlement after restore
      const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
      const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
      const hasProEntitlement = customerInfo.entitlements.active[entitlementIdentifier]?.isActive;
      
      if (hasProEntitlement) {
        console.log('Restore successful - updating user to premium');
        
        // Use UserDataManager directly to ensure proper data flow
        const { UserDataManager } = await import('~/lib/services/userDataManager');
        UserDataManager.updateSubscriptionStatusFromRevenueCat(hasProEntitlement);
        
        // Also update settings as backup
        await updateSettings({ subscriptionStatus: 'premium' });
        
        // Small delay to ensure all listeners have processed the change
        setTimeout(() => {
          // Navigate back to the main app
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/popular');
          }
        }, 100);
      } else {
        console.log('No active subscription found to restore');
        Alert.alert(
          'No Purchases Found',
          'No active purchases found to restore.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('RevenueCat restore failed:', error);
      const errorMessage = error?.message || 'Failed to restore purchases. Please try again.';
      Alert.alert('Restore Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionSelect = async (optionId: string) => {
    if (optionId === 'free') {
      // User chose to continue with free - go to main app
      // Don't change subscription status as they're already free
      router.replace('/popular');
    } else {
      // Directly process the purchase instead of navigating to another screen
      await handlePurchase(optionId);
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
          {/* App Icon */}
          <View className="mb-4 items-center">
            <Image
              source={require('../assets/premiumIcon.png')}
              style={{ width: 160, height: 160 }}
              contentFit="contain"
            />
          </View>

          {/* Logo */}
          <View className="mb-6 items-center">
            <Image
              source={require('../assets/BarVibesLogo3.png')}
              style={{ width: 200, height: 60 }}
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
                disabled={isProcessing}
                style={({ pressed }) => ({ opacity: pressed || isProcessing ? 0.8 : 1 })}>
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
                    {isProcessing && processingOptionId === option.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-2xl font-bold text-white">{option.price}</Text>
                    )}
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
            disabled={isProcessing}
            style={({ pressed }) => ({ opacity: pressed || isProcessing ? 0.6 : 1 })}>
            <Text className="py-2 text-center text-xs text-gray-500">
              Continue with Free (Limited Access)
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
