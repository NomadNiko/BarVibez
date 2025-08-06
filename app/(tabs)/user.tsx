import React from 'react';
import { View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserSettings, useProStatus, useFavorites } from '~/lib/contexts/UserContext';
import { DisclaimerStorage } from '~/lib/utils/disclaimerStorage';
import { APP_CONFIG } from '~/config/app';

export default function UserScreen() {
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

  const handlePrivacyPress = () => {
    Linking.openURL(APP_CONFIG.privacyPolicyUrl);
  };

  const handleSupportPress = () => {
    Linking.openURL(APP_CONFIG.supportUrl);
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
            <Text style={{ 
              color: '#ffffff', 
              fontSize: 24, 
              fontWeight: 'bold', 
              textAlign: 'center' 
            }}>
              {APP_CONFIG.name}
            </Text>
            <Text style={{ 
              color: '#888888', 
              fontSize: 16, 
              textAlign: 'center',
              marginTop: 4
            }}>
              Your Personal Cocktail Companion
            </Text>
          </View>

          {/* User Stats Card */}
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Account Overview
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#888888', fontSize: 14 }}>Status:</Text>
              <Text style={{ color: isPro ? '#00FF88' : '#888888', fontSize: 14, fontWeight: '600' }}>
                {isPro ? 'Pro User' : 'Free User'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
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

          {/* Actions Section */}
          <View style={{ marginBottom: 30 }}>
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
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500' }}>
                  Settings
                </Text>
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
                <FontAwesome name="life-ring" size={20} color="#007AFF" style={{ marginRight: 12 }} />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500' }}>
                  Support & Help
                </Text>
              </View>
              <FontAwesome name="external-link" size={16} color="#666666" />
            </Pressable>

            {/* Clear Disclaimer Button (Testing Only) */}
            <Pressable
              onPress={handleClearDisclaimer}
              style={{
                backgroundColor: '#2D1B24',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#5D2E3C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="warning" size={20} color="#FF6B6B" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '500' }}>
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

          {/* Spacer to push footer to bottom */}
          <View style={{ flex: 1 }} />

          {/* Privacy Footer */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Pressable onPress={handlePrivacyPress} style={{ marginBottom: 12 }}>
              <Text style={{ 
                color: '#007AFF', 
                fontSize: 14, 
                textDecorationLine: 'underline' 
              }}>
                Privacy Policy
              </Text>
            </Pressable>

            <Text style={{ 
              color: '#666666', 
              fontSize: 12, 
              textAlign: 'center',
              marginBottom: 8
            }}>
              {APP_CONFIG.copyright}
            </Text>

            <Text style={{ 
              color: '#666666', 
              fontSize: 12, 
              textAlign: 'center' 
            }}>
              Version {APP_CONFIG.version}
            </Text>
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
}