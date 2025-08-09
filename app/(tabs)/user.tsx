import React from 'react';
import { View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserSettings, useProStatus, useFavorites } from '~/lib/contexts/UserContext';
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
