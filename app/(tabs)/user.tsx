import React, { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserSettings, useProStatus, useFavorites } from '~/lib/contexts/UserContext';
import { APP_CONFIG } from '~/config/app';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

export default function UserScreen() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);

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
