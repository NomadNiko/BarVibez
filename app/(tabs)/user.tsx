import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Linking, Alert, ActivityIndicator, Switch, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserSettings, useProStatus, useFavorites, useVenues, useUserCocktails } from '~/lib/contexts/UserContext';
import { APP_CONFIG } from '~/config/app';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import { useCallback } from 'react';

export default function UserScreen() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();
  const { venues } = useVenues();
  const { getAllUserCocktails } = useUserCocktails();
  
  
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [revenueCatUserId, setRevenueCatUserId] = useState<string>('Loading...');
  
  // Get RevenueCat User ID and listen for subscription changes
  useEffect(() => {
    const getRevenueCatId = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        let userId = customerInfo.originalAppUserId;
        // Remove the $RCAnonymousID: prefix if present
        if (userId.startsWith('$RCAnonymousID:')) {
          userId = userId.substring('$RCAnonymousID:'.length);
        }
        setRevenueCatUserId(userId);
      } catch (error) {
        console.error('Failed to get RevenueCat ID:', error);
        setRevenueCatUserId('Not available');
      }
    };
    getRevenueCatId();
    
    // Set up listener for customer info updates (subscription changes)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[User Tab] Customer info updated, refreshing UI');
      // Update RevenueCat ID
      let userId = info.originalAppUserId;
      if (userId.startsWith('$RCAnonymousID:')) {
        userId = userId.substring('$RCAnonymousID:'.length);
      }
      setRevenueCatUserId(userId);
    });
    
    return () => {
      // Clean up listener
      if (listener) {
        listener();
      }
    };
  }, []);
  
  // Get custom content counts
  const customCocktails = getAllUserCocktails();
  const customVenueCount = venues.filter(v => !v.isDefault).length; // Don't count default "My Speakeasy"
  

  const handleRestorePurchases = async () => {
    setIsRestoringPurchases(true);
    
    try {
      console.log('Starting restore purchases...');
      
      // This will trigger OS-level sign-in if needed
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
        
        Alert.alert(
          'Restore Successful',
          'Your Pro subscription has been restored successfully!',
          [{ text: 'OK' }]
        );
      } else {
        console.log('No active subscription found to restore');
        Alert.alert(
          'No Purchases Found',
          'No active purchases were found for your Apple ID. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('RevenueCat restore failed:', error);
      
      // Handle user cancellation gracefully
      if (error?.userCancelled) {
        console.log('User cancelled the restore');
        // Don't show error for cancellation
      } else {
        const errorMessage = error?.message || 'Failed to restore purchases. Please try again.';
        Alert.alert(
          'Restore Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  const handleMeasurementToggle = async () => {
    if (!settings) return;

    try {
      const newMeasurement = settings.measurements === 'oz' ? 'ml' : 'oz';
      await updateSettings({ measurements: newMeasurement });
    } catch (error) {
      Alert.alert('Error', 'Failed to update measurement setting');
    }
  };

  const handlePrivacyPress = () => {
    Linking.openURL(APP_CONFIG.privacyPolicyUrl);
  };

  const handleSupportPress = () => {
    Linking.openURL(APP_CONFIG.supportUrl);
  };

  const handleSettingsPress = () => {
    router.push('/modal');
  };

  const handlePurchasePremium = () => {
    router.push('/paywall');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 12, flex: 1 }}>
        <Container>
          <View
            style={{ flex: 1, paddingVertical: Platform.OS === 'android' ? 10 : 20 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: Platform.OS === 'android' ? 12 : 20 }}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 80, height: 80, marginBottom: Platform.OS === 'android' ? 10 : 16 }}
              contentFit="contain"
            />
            <Image
              source={require('../../assets/BarVibesLogo3.png')}
              style={{ width: 200, height: 60 }}
              contentFit="contain"
            />
          </View>

          {/* User Stats Card */}
          <View
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              padding: Platform.OS === 'android' ? 16 : 20,
              marginBottom: Platform.OS === 'android' ? 8 : 12,
              borderWidth: 1,
              borderColor: '#333333',
            }}>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Status:</Text>
              <Text style={{ color: isPro ? '#00FF88' : '#888888', fontSize: 14 }}>
                {isPro ? 'Pro User' : 'Free User'}
              </Text>
            </View>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Favorites:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>{favorites.length}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Custom Cocktails:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>{customCocktails.length}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Custom Venues:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>{customVenueCount}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Measurements:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ 
                  color: settings?.measurements === 'oz' ? '#ffffff' : '#666666', 
                  fontSize: 14, 
                  marginRight: 8,
                }}>
                  oz
                </Text>
                <Switch
                  value={settings?.measurements === 'ml'}
                  onValueChange={handleMeasurementToggle}
                  trackColor={{ false: '#333333', true: '#007AFF' }}
                  thumbColor={'#ffffff'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <Text style={{ 
                  color: settings?.measurements === 'ml' ? '#ffffff' : '#666666', 
                  fontSize: 14, 
                  marginLeft: 8,
                }}>
                  ml
                </Text>
              </View>
            </View>

            <View style={{ 
              borderTopWidth: 1, 
              borderTopColor: '#333333', 
              paddingTop: 12, 
              marginTop: 4 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#666666', fontSize: 12 }}>RevenueCat ID:</Text>
                <Text style={{ 
                  color: '#666666', 
                  fontSize: 11, 
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  flex: 1,
                  textAlign: 'right',
                  marginLeft: 8,
                }}>
                  {revenueCatUserId}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={{ marginBottom: 12 }}>
            {/* Purchase Premium Button - Only show for free users */}
            {!isPro && (
              <Pressable
                onPress={handlePurchasePremium}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome 
                    name="star" 
                    size={20} 
                    color="#ffffff" 
                    style={{ marginRight: 12 }} 
                  />
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    Upgrade to Premium
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#ffffff" />
              </Pressable>
            )}

            {/* Restore Purchases Button */}
            <Pressable
              onPress={handleRestorePurchases}
              disabled={isRestoringPurchases}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#333333',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isRestoringPurchases ? 0.6 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome 
                  name="refresh" 
                  size={20} 
                  color="#10B981" 
                  style={{ marginRight: 12 }} 
                />
                <Text style={{ color: '#ffffff', fontSize: 16 }}>
                  {isRestoringPurchases ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </View>
              {isRestoringPurchases ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <FontAwesome name="chevron-right" size={16} color="#666666" />
              )}
            </Pressable>

            {/* Settings Button */}
            <Pressable
              onPress={handleSettingsPress}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#333333',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="cog" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text style={{ color: '#ffffff', fontSize: 16 }}>Settings</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#666666" />
            </Pressable>

            {/* Support Button */}
            <Pressable
              onPress={handleSupportPress}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#333333',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome
                  name="life-ring"
                  size={20}
                  color="#007AFF"
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: '#ffffff', fontSize: 16 }}>Support & Help</Text>
              </View>
              <FontAwesome name="external-link" size={16} color="#666666" />
            </Pressable>
          </View>

          {/* Privacy Footer */}
          <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 8 }}>
            <Pressable onPress={handlePrivacyPress}>
              <Text
                style={{
                  color: '#007AFF',
                  fontSize: 14,
                  textDecorationLine: 'underline',
                  lineHeight: 22,
                }}>
                Privacy Policy
              </Text>
            </Pressable>
            <Text
              style={{
                color: '#666666',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 20,
              }}>
              {APP_CONFIG.copyright}
            </Text>
            <Text
              style={{
                color: '#666666',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18,
              }}>
              Version {APP_CONFIG.version}
            </Text>
          </View>

        </View>
      </Container>
      </View>
    </SafeAreaView>
  );
}
