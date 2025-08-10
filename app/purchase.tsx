import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '~/components/nativewindui/Text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserSettings } from '~/lib/contexts/UserContext';
import { useAppStoreIdentification } from '~/lib/hooks/useAppStoreIdentification';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

export default function PurchaseScreen() {
  const router = useRouter();
  const { optionId, title, price, period } = useLocalSearchParams<{
    optionId: string;
    title: string;
    price: string;
    period?: string;
  }>();
  const { updateSettings } = useUserSettings();
  const { hasProSubscription } = useAppStoreIdentification();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Redirect premium users away from purchase screen
  useEffect(() => {
    if (hasProSubscription()) {
      console.log('User already has Pro subscription, redirecting away from purchase screen');
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        router.replace('/popular');
      }
    }
  }, [hasProSubscription]);

  const handlePurchase = async () => {
    setIsProcessing(true);
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
        setPurchaseError('You already have an active subscription. If you need to change your subscription, please manage it in Settings > Subscriptions.');
        setIsProcessing(false);
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
      
      // Check if user has Pro entitlement (reuse entitlementIdentifier from above)
      const hasProEntitlement = purchaseResult.customerInfo?.entitlements.active[entitlementIdentifier]?.isActive;
      
      if (hasProEntitlement) {
        // Update subscription status to premium
        await updateSettings({ subscriptionStatus: 'premium' });
        console.log('Purchase successful - user upgraded to premium');
        
        // Navigate back to the main app
        if (router.canDismiss()) {
          router.dismissAll();
        } else {
          router.replace('/popular');
        }
      } else {
        console.warn('Purchase completed but Pro entitlement not active');
        setPurchaseError('Purchase completed but subscription not activated. Please contact support.');
      }
      
    } catch (error: any) {
      console.error('RevenueCat purchase failed:', error);
      
      // Handle user cancellation gracefully
      if (error?.userCancelled) {
        console.log('User cancelled the purchase');
        // Don't show error for cancellation
      } else {
        const errorMessage = error?.message || 'Purchase failed. Please try again.';
        setPurchaseError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
        // Update subscription status to premium
        await updateSettings({ subscriptionStatus: 'premium' });
        console.log('Restore successful - user upgraded to premium');
        
        // Navigate back to the main app
        if (router.canDismiss()) {
          router.dismissAll();
        } else {
          router.replace('/popular');
        }
      } else {
        console.log('No active subscription found to restore');
        setPurchaseError('No active purchases found to restore.');
      }
      
    } catch (error: any) {
      console.error('RevenueCat restore failed:', error);
      const errorMessage = error?.message || 'Failed to restore purchases. Please try again.';
      setPurchaseError(errorMessage);
    } finally {
      setIsProcessing(false);
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

          {/* Purchase Error */}
          {purchaseError && (
            <View style={{
              backgroundColor: '#3d1a1a',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#664444',
            }}>
              <Text style={{ fontSize: 14, color: '#ff6666', textAlign: 'center' }}>
                {purchaseError}
              </Text>
            </View>
          )}

          {/* RevenueCat Purchase Section */}
          <View style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333',
          }}>
            
            {/* Purchase Button */}
            <Pressable
              onPress={handlePurchase}
              disabled={isProcessing}
              style={({ pressed }) => ({
                backgroundColor: isProcessing ? '#666666' : '#10B981',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
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

            {/* Restore Purchases Button */}
            <Pressable
              onPress={handleRestorePurchases}
              disabled={isProcessing}
              style={({ pressed }) => ({
                backgroundColor: 'transparent',
                borderRadius: 8,
                padding: 12,
                opacity: pressed ? 0.6 : 1,
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              <Text style={{ color: '#888888', fontSize: 14 }}>
                Restore Purchases
              </Text>
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