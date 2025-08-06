import { StatusBar } from 'expo-status-bar';
import { Platform, View, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '~/components/nativewindui/Text';
import { useUserSettings, useProStatus, useFavorites } from '~/lib/contexts/UserContext';

export default function Modal() {
  const { settings, updateSettings } = useUserSettings();
  const { isPro } = useProStatus();
  const { favorites } = useFavorites();

  const handleMeasurementToggle = async () => {
    if (!settings) return;
    
    try {
      const newMeasurement = settings.measurements === 'oz' ? 'ml' : 'oz';
      await updateSettings({ measurements: newMeasurement });
    } catch (error) {
      Alert.alert('Error', 'Failed to update measurement setting');
    }
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
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
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
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
                  marginRight: 10 
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
                  marginLeft: 10 
                }}>
                  ml
                </Text>
              </View>
            </View>
          </View>

          {/* User Stats */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
              Account Info
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Status:</Text>
              <Text style={{ color: isPro ? '#00FF88' : '#888888', fontSize: 14, fontWeight: '600' }}>
                {isPro ? 'Pro User' : 'Free User'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Favorites:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>
                {favorites.length} cocktails
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Measurement System:</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, textTransform: 'uppercase' }}>
                {settings?.measurements || 'oz'}
              </Text>
            </View>
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
