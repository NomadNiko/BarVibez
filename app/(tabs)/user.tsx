import React, { useState } from 'react';
import { View, ScrollView, Pressable, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserSettings, useProStatus, useFavorites, useUser } from '~/lib/contexts/UserContext';
import { APP_CONFIG } from '~/config/app';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

export default function UserScreen() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();
  const { clearCustomData } = useUser();
  
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isResettingRevenueCat, setIsResettingRevenueCat] = useState(false);

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

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      `⚠️ WARNING: This will permanently delete all your custom venues and cocktails.\n\nThis cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            setIsClearingData(true);
            try {
              await clearCustomData();
              Alert.alert('Data Cleared', 'All custom venues and cocktails have been deleted.');
            } catch (error: any) {
              console.error('Clear data failed:', error);
              Alert.alert('Clear Failed', error?.message || 'Failed to clear data.');
            } finally {
              setIsClearingData(false);
            }
          }
        }
      ]
    );
  };

  const handleResetRevenueCat = async () => {
    Alert.alert(
      'Reset RevenueCat',
      `⚠️ WARNING: This will:\n• Log out of current RevenueCat user\n• Reset subscription status to free\n• Allow testing with a new Apple ID\n\nUse this for testing purposes only!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset RevenueCat',
          style: 'destructive',
          onPress: async () => {
            setIsResettingRevenueCat(true);
            try {
              console.log('Resetting RevenueCat user...');
              
              // Clear RevenueCat cache and reset everything
              try {
                // First try to log out
                await Purchases.logOut();
                console.log('RevenueCat logged out successfully');
              } catch (logoutError: any) {
                if (logoutError?.message?.includes('anonymous')) {
                  console.log('User is anonymous, proceeding with reset');
                } else {
                  throw logoutError;
                }
              }
              
              // Clear offerings cache
              try {
                await Purchases.invalidateCustomerInfoCache();
                console.log('Customer info cache invalidated');
              } catch (cacheError) {
                console.warn('Could not invalidate cache:', cacheError);
              }
              
              // Create a completely new anonymous user
              const newAnonymousId = `$RCAnonymousID:${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
              await Purchases.logIn(newAnonymousId);
              console.log('Created new anonymous RevenueCat user:', newAnonymousId);
              
              // Reset subscription status to free
              await updateSettings({ subscriptionStatus: 'free' });
              console.log('Subscription status reset to free');
              
              Alert.alert(
                'RevenueCat Reset Complete',
                'RevenueCat user has been reset and caches cleared.\n\n🔸 To test with a new Apple ID:\n1. Go to Settings > App Store\n2. Sign out of current Apple ID\n3. Sign back in with test Apple ID\n4. Return to app and try purchasing\n\nThis ensures the App Store uses the new Apple ID for purchases.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('RevenueCat reset failed:', error);
              Alert.alert('Reset Failed', error?.message || 'Failed to reset RevenueCat.');
            } finally {
              setIsResettingRevenueCat(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
      <Container>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 80, height: 80, marginBottom: 16 }}
              contentFit="contain"
            />
            <Text
              style={{
                color: '#ffffff',
                fontSize: 24,
                textAlign: 'center',
              }}>
              {APP_CONFIG.name}
            </Text>
            <Text
              style={{
                color: '#888888',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 4,
              }}>
              Mixology Made Simple
            </Text>
          </View>

          {/* User Stats Card */}
          <View
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#333333',
            }}>
            <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 16 }}>
              Account Overview
            </Text>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Status:</Text>
              <Text style={{ color: isPro ? '#00FF88' : '#888888', fontSize: 14 }}>
                {isPro ? 'Pro User' : 'Free User'}
              </Text>
            </View>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Favorites:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>{favorites.length} cocktails</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Measurement System:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, textTransform: 'uppercase' }}>
                {settings?.measurements || 'oz'}
              </Text>
            </View>
          </View>

          {/* Actions Section */}
          <View style={{ marginBottom: 30 }}>
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

          {/* Data Management Section */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 16 }}>
              Data Management
            </Text>

            {/* Clear Data Button */}
            <Pressable
              onPress={handleClearData}
              disabled={isClearingData}
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
                opacity: isClearingData ? 0.6 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome 
                  name="trash" 
                  size={20} 
                  color="#F44336" 
                  style={{ marginRight: 12 }} 
                />
                <Text style={{ color: '#ffffff', fontSize: 16 }}>
                  {isClearingData ? 'Clearing...' : 'Clear All Data'}
                </Text>
              </View>
              {isClearingData ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <FontAwesome name="chevron-right" size={16} color="#666666" />
              )}
            </Pressable>

            {/* Reset RevenueCat Button */}
            <Pressable
              onPress={handleResetRevenueCat}
              disabled={isResettingRevenueCat}
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
                opacity: isResettingRevenueCat ? 0.6 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome 
                  name="sign-out" 
                  size={20} 
                  color="#FF9500" 
                  style={{ marginRight: 12 }} 
                />
                <Text style={{ color: '#ffffff', fontSize: 16 }}>
                  {isResettingRevenueCat ? 'Resetting...' : 'Reset RevenueCat'}
                </Text>
              </View>
              {isResettingRevenueCat ? (
                <ActivityIndicator size="small" color="#FF9500" />
              ) : (
                <FontAwesome name="chevron-right" size={16} color="#666666" />
              )}
            </Pressable>
          </View>

          {/* Privacy Footer */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Pressable onPress={handlePrivacyPress}>
              <Text
                style={{
                  color: '#007AFF',
                  fontSize: 14,
                  textDecorationLine: 'underline',
                  lineHeight: 16,
                }}>
                Privacy Policy
              </Text>
            </Pressable>
            <Text
              style={{
                color: '#666666',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 14,
              }}>
              {APP_CONFIG.copyright}
            </Text>
            <Text
              style={{
                color: '#666666',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 14,
              }}>
              Version {APP_CONFIG.version}
            </Text>
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
}
