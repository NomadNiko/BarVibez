import { StatusBar } from 'expo-status-bar';
import { Platform, View, Alert, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';

import { Text } from '~/components/nativewindui/Text';
import { useUser } from '~/lib/contexts/UserContext';

export default function Modal() {
  const { clearCustomData } = useUser();
  const router = useRouter();
  const [isClearingData, setIsClearingData] = useState(false);

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

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, padding: 20 }}>
          {/* Header with Close Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ffffff', fontSize: 24, textAlign: 'center' }}>
                Settings
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={{ position: 'absolute', right: 0, padding: 10 }}>
              <FontAwesome name="times" size={24} color="#888888" />
            </Pressable>
          </View>

          {/* Data Management Section */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 15 }}>
              Data Management
            </Text>
            
            {/* Clear Data Button */}
            <Pressable
              onPress={handleClearData}
              disabled={isClearingData}
              style={{
                backgroundColor: '#2D1B24',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#4C1D2F',
                opacity: isClearingData ? 0.6 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome 
                  name="trash" 
                  size={20} 
                  color="#FF6B6B" 
                  style={{ marginRight: 12 }} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FF6B6B', fontSize: 16 }}>
                    {isClearingData ? 'Clearing...' : 'Clear All Custom Data'}
                  </Text>
                  <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                    Permanently delete all custom venues and cocktails
                  </Text>
                </View>
              </View>
              {isClearingData ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <FontAwesome name="chevron-right" size={16} color="#FF6B6B" />
              )}
            </Pressable>
          </View>

          {/* Privacy Info */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 12, 
            padding: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#888888', fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
              All user data is stored locally on your device. RevenueCat, our subscription provider, maintains subscription-related information for Premium users. For data deletion requests, please contact support@nomadsoft.us or visit the link below and we will submit a case to RevenueCat.
            </Text>
            <Pressable
              onPress={() => Linking.openURL('https://nomadsoft.us/support')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#007AFF', fontSize: 14, textDecorationLine: 'underline', marginRight: 6 }}>
                Contact Support
              </Text>
              <FontAwesome name="external-link" size={12} color="#007AFF" />
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}