import { StatusBar } from 'expo-status-bar';
import { Platform, View, Switch, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '~/components/nativewindui/Text';
import { useUserSettings, useProStatus, useFavorites } from '~/lib/contexts/UserContext';
import { DisclaimerStorage } from '~/lib/utils/disclaimerStorage';

export default function Modal() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();
  const router = useRouter();

  const handleMeasurementToggle = async () => {
    if (!settings) return;
    
    try {
      const newMeasurement = settings.measurements === 'oz' ? 'ml' : 'oz';
      await updateSettings({ measurements: newMeasurement });
    } catch (error) {
      Alert.alert('Error', 'Failed to update measurement setting');
    }
  };

  const handleClearDisclaimer = () => {
    Alert.alert(
      'Clear Disclaimer',
      'This will clear the age verification disclaimer and you will see it again on next app launch. This is for testing purposes only.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            try {
              DisclaimerStorage.clearDisclaimerAcceptance();
              Alert.alert('Success', 'Disclaimer cleared. You will see it on next app launch.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear disclaimer');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 24, textAlign: 'center', marginBottom: 30 }}>
            Settings
          </Text>

          {/* Measurements Setting */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 4 }}>
                  Measurements
                </Text>
                <Text style={{ color: '#888888', fontSize: 14 }}>
                  Choose your preferred measurement system
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ 
                  color: settings?.measurements === 'oz' ? '#ffffff' : '#666666', 
                  fontSize: 16, 
                  marginRight: 10,
                }}>
                  oz
                </Text>
                <Switch
                  value={settings?.measurements === 'ml'}
                  onValueChange={handleMeasurementToggle}
                  trackColor={{ false: '#333333', true: '#007AFF' }}
                  thumbColor={settings?.measurements === 'ml' ? '#ffffff' : '#ffffff'}
                />
                <Text style={{ 
                  color: settings?.measurements === 'ml' ? '#ffffff' : '#666666', 
                  fontSize: 16, 
                  marginLeft: 10,
                }}>
                  ml
                </Text>
              </View>
            </View>
          </View>

          {/* Test Controls */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 15 }}>
              Test Controls
            </Text>
            
            {/* Test PayWall Button */}
            <Pressable
              onPress={() => router.push('/paywall')}
              style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#374151',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="dollar" size={20} color="#10B981" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ color: '#10B981', fontSize: 16 }}>
                    Test PayWall
                  </Text>
                  <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                    Testing only - show subscription screen
                  </Text>
                </View>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#10B981" />
            </Pressable>

            {/* Test Subscription Status */}
            <View
              style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#374151',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FontAwesome name="flask" size={20} color="#F59E0B" style={{ marginRight: 12 }} />
                <Text style={{ color: '#F59E0B', fontSize: 16 }}>
                  Test Subscription
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <Pressable
                  onPress={() => updateSettings({ subscriptionStatus: 'free' })}
                  style={{
                    backgroundColor: settings?.subscriptionStatus === 'free' ? '#374151' : '#111827',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: settings?.subscriptionStatus === 'free' ? '#6B7280' : '#374151',
                  }}>
                  <Text style={{ 
                    color: settings?.subscriptionStatus === 'free' ? '#ffffff' : '#9CA3AF', 
                    fontSize: 14,
                    }}>
                    Free
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => updateSettings({ subscriptionStatus: 'premium' })}
                  style={{
                    backgroundColor: settings?.subscriptionStatus === 'premium' ? '#374151' : '#111827',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: settings?.subscriptionStatus === 'premium' ? '#6B7280' : '#374151',
                  }}>
                  <Text style={{ 
                    color: settings?.subscriptionStatus === 'premium' ? '#ffffff' : '#9CA3AF', 
                    fontSize: 14,
                    }}>
                    Premium
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Clear Disclaimer Button */}
            <Pressable
              onPress={handleClearDisclaimer}
              style={{
                backgroundColor: '#2D1B24',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#4C1D2F',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="warning" size={20} color="#FF6B6B" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ color: '#FF6B6B', fontSize: 16 }}>
                    Clear Disclaimer
                  </Text>
                  <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                    Testing only - resets age verification
                  </Text>
                </View>
              </View>
              <FontAwesome name="trash" size={16} color="#FF6B6B" />
            </Pressable>
          </View>

          {/* Info */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Settings are automatically saved and synced to your App Store account. 
              Pro features and personalized content will be available with your subscription.
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
