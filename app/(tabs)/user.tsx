import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import {
  useUserSettings,
  useProStatus,
  useFavorites,
  useVenues,
  useUserCocktails,
} from '~/lib/contexts/UserContext';
import { APP_CONFIG } from '~/config/app';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';
import { useCallback } from 'react';

// Interface for holding structured subscription details
interface SubscriptionDetails {
  plan: string;
  renewsOn: string | null;
}

export default function UserScreen() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();
  const { venues } = useVenues();
  const { getAllUserCocktails } = useUserCocktails();

  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [revenueCatUserId, setRevenueCatUserId] = useState<string>('Loading...');
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

  // Helper function to process RevenueCat customer info
  const processCustomerInfo = (customerInfo: CustomerInfo) => {
    const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
    const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
    const proEntitlement = customerInfo.entitlements.active[entitlementIdentifier];

    if (proEntitlement) {
      let plan = 'Pro User'; // Default name
      const productId = proEntitlement.productIdentifier;

      // Map product identifiers from your paywall to user-friendly names
      if (productId.includes('monthly')) {
        plan = '$4.99 Monthly Premium';
      } else if (productId.includes('yearly')) {
        plan = '$24.99 Yearly Premium';
      } else if (productId.toLowerCase().includes('lifetime')) {
        plan = 'Lifetime Premium';
      }

      let renewsOn = null;
      // Only show a renewal date for subscriptions, not for lifetime purchases
      if (proEntitlement.expirationDate && !plan.toLowerCase().includes('lifetime')) {
        const date = new Date(proEntitlement.expirationDate);
        renewsOn = date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      setSubscriptionDetails({ plan, renewsOn });
    } else {
      setSubscriptionDetails(null);
    }

    // Update RevenueCat User ID
    let userId = customerInfo.originalAppUserId;
    if (userId.startsWith('$RCAnonymousID:')) {
      userId = userId.substring('$RCAnonymousID:'.length);
    }
    setRevenueCatUserId(userId);
  };

  // Get RevenueCat User ID and listen for subscription changes
  useEffect(() => {
    const getAndProcessInfo = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        processCustomerInfo(customerInfo);
      } catch (error) {
        console.error('Failed to get RevenueCat info:', error);
        setRevenueCatUserId('Not available');
        setSubscriptionDetails(null);
      }
    };

    getAndProcessInfo();

    // Set up listener for customer info updates (e.g., after a purchase or restore)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[User Tab] Customer info updated, processing new info...');
      processCustomerInfo(info);
    });

    return () => {
      if (listener) {
        listener();
      }
    };
  }, []);

  // Get custom content counts
  const customCocktails = getAllUserCocktails();
  const customVenueCount = venues.filter((v) => !v.isDefault).length;

  const handleRestorePurchases = async () => {
    setIsRestoringPurchases(true);

    try {
      console.log('Starting restore purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('Restore result:', {
        originalAppUserId: customerInfo.originalAppUserId,
        entitlements: Object.keys(customerInfo.entitlements.active || {}),
      });

      const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
      const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
      const hasProEntitlement = customerInfo.entitlements.active[entitlementIdentifier]?.isActive;

      if (hasProEntitlement) {
        await updateSettings({ subscriptionStatus: 'premium' });
        console.log('Restore successful - user upgraded to premium');
        Alert.alert('Restore Successful', 'Your Pro subscription has been restored successfully!', [
          { text: 'OK' },
        ]);
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
      if (error?.userCancelled) {
        console.log('User cancelled the restore');
      } else {
        const errorMessage = error?.message || 'Failed to restore purchases. Please try again.';
        Alert.alert('Restore Failed', errorMessage, [{ text: 'OK' }]);
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

  const handleTermsPress = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flex: 1, paddingVertical: 2 }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={{ width: 80, height: 80, marginBottom: 8 }}
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
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#333333',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <Text style={{ color: '#888888', fontSize: 14 }}>Status:</Text>
                  <Text style={{ color: isPro ? '#00FF88' : '#888888', fontSize: 14 }}>
                    {isPro ? 'Pro User' : 'Free User'}
                  </Text>
                </View>

                {/* --- Display Subscription Details if Pro --- */}
                {isPro && subscriptionDetails && (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}>
                      <Text style={{ color: '#888888', fontSize: 14 }}>Plan:</Text>
                      <Text style={{ color: '#ffffff', fontSize: 14 }}>
                        {subscriptionDetails.plan}
                      </Text>
                    </View>
                    {subscriptionDetails.renewsOn && (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}>
                        <Text style={{ color: '#888888', fontSize: 14 }}>Renews On:</Text>
                        <Text style={{ color: '#ffffff', fontSize: 14 }}>
                          {subscriptionDetails.renewsOn}
                        </Text>
                      </View>
                    )}
                  </>
                )}
                {/* --- End Subscription Details --- */}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <Text style={{ color: '#888888', fontSize: 14 }}>Favorites:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 14 }}>{favorites.length}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <Text style={{ color: '#888888', fontSize: 14 }}>Custom Cocktails:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 14 }}>{customCocktails.length}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <Text style={{ color: '#888888', fontSize: 14 }}>Custom Venues:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 14 }}>{customVenueCount}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <Text style={{ color: '#888888', fontSize: 14 }}>Measurements:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
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
                    <Text
                      style={{
                        color: settings?.measurements === 'ml' ? '#ffffff' : '#666666',
                        fontSize: 14,
                        marginLeft: 8,
                      }}>
                      ml
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#333333',
                    paddingTop: 12,
                    marginTop: 4,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}>
                    <Text style={{ color: '#666666', fontSize: 12 }}>RevenueCat ID:</Text>
                    <Text
                      style={{
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
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Pressable onPress={handlePrivacyPress}>
                      <Text
                        style={{
                          color: '#6ab2ffff',
                          fontSize: 12,
                          textDecorationLine: 'underline',
                        }}>
                        Privacy Policy
                      </Text>
                    </Pressable>
                    <Text style={{ color: '#666666', fontSize: 12, marginHorizontal: 8 }}>|</Text>
                    <Pressable onPress={handleTermsPress}>
                      <Text
                        style={{
                          color: '#6ab2ffff',
                          fontSize: 12,
                          textDecorationLine: 'underline',
                        }}>
                        Terms of Use
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Actions Section */}
              <View style={{ marginBottom: 12 }}>
                {!isPro && (
                  <Pressable
                    onPress={handlePurchasePremium}
                    style={{
                      backgroundColor: '#10B981',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome
                        name="star"
                        size={20}
                        color="#ffd900ff"
                        style={{ marginRight: 12 }}
                      />
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                        Upgrade to Premium
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#ffffff" />
                  </Pressable>
                )}

                {!isPro && (
                  <Pressable
                    onPress={handleRestorePurchases}
                    disabled={isRestoringPurchases}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: 12,
                      padding: 10,
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
                )}

                <Pressable
                  onPress={handleSettingsPress}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#333333',
                    color: '#fdff94ff',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                      name="cog"
                      size={20}
                      color="#fdff94ff"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: '#ffffff', fontSize: 16 }}>Settings</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#666666" />
                </Pressable>

                <Pressable
                  onPress={handleSupportPress}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 12,
                    padding: 10,
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

              {/* Privacy & Terms Footer */}
              <View style={{ alignItems: 'center' }}>
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
          </ScrollView>
        </Container>
      </View>
    </SafeAreaView>
  );
}
