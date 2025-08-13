import React from 'react';
import { View, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
// import FontAwesome from '@expo/vector-icons/FontAwesome'; // Unused
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { DisclaimerStorage } from '~/lib/utils/disclaimerStorage';
import { useUserSettings } from '~/lib/contexts/UserContext';
import { APP_CONFIG } from '~/config/app';

export default function DisclaimerScreen() {
  const { settings } = useUserSettings();
  
  const handleAccept = async () => {
    try {
      // Store that user has accepted the disclaimer
      DisclaimerStorage.setDisclaimerAccepted();
      
      // Android users bypass paywall for now
      if (Platform.OS === 'android') {
        // Android users get instant Free access
        router.replace('/popular');
      } else {
        // iOS users go through normal paywall flow
        if (settings?.subscriptionStatus === 'free') {
          // Free user - show paywall
          router.replace('/paywall');
        } else {
          // Premium user - go to main app
          router.replace('/popular');
        }
      }
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error);
      Alert.alert('Error', 'Failed to save your response. Please try again.');
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Age Verification Required',
      'You must be of legal drinking age to use this app. The app will now close.',
      [
        {
          text: 'OK',
          onPress: () => {
            // On mobile, we can't actually close the app, but we can stay on this screen
            // The user would need to manually close the app
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        {/* App Icon/Logo */}
        <View style={{ 
          marginBottom: 20,
          alignItems: 'center'
        }}>
          <Image
            source={require('../assets/icon.png')}
            style={{ width: 80, height: 80, marginBottom: 24 }}
            contentFit="contain"
          />
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 28, 
            textAlign: 'center',
            letterSpacing: 1,
            marginBottom: 8,
            lineHeight: 36,
            paddingVertical: 4,
          }}>
            {APP_CONFIG.name}
          </Text>
          <Text style={{ 
            color: '#888888', 
            fontSize: 16, 
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Mixology Made Simple
          </Text>
        </View>

        {/* Disclaimer Text */}
        <View style={{ 
          backgroundColor: '#1a1a1a', 
          borderRadius: 16, 
          padding: 24, 
          marginBottom: 40,
          borderWidth: 1,
          borderColor: '#333333'
        }}>
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 18, 
            lineHeight: 26,
            textAlign: 'center',
            marginBottom: 20,
          }}>
            Age Verification Required
          </Text>
          
          <Text style={{ 
            color: '#cccccc', 
            fontSize: 16, 
            lineHeight: 24,
            textAlign: 'center',
          }}>
            By clicking &ldquo;I Agree&rdquo; below, you confirm that you are of legal drinking age in your current location.
            {'\n\n'}
            Please drink responsibly and always follow local laws. We do not take responsibility for anyone&apos;s actions after consuming beverages containing alcohol.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ width: '100%', gap: 16 }}>
          <Button 
            onPress={handleAccept}
            style={{
              backgroundColor: '#007AFF',
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
            }}>
            <Text style={{ 
              color: '#ffffff', 
              fontSize: 18, 
              textAlign: 'center',
            }}>
              I Agree - I am of Legal Drinking Age
            </Text>
          </Button>

          <Button 
            onPress={handleDecline}
            variant="secondary"
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: '#666666',
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
            }}>
            <Text style={{ 
              color: '#999999', 
              fontSize: 16, 
              textAlign: 'center',
              }}>
              I am not of legal drinking age
            </Text>
          </Button>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40 }}>
          <Text style={{ 
            color: '#666666', 
            fontSize: 12, 
            textAlign: 'center',
            lineHeight: 18,
            marginBottom: 8,
          }}>
            By using this app, you agree to our terms of service.
            {'\n'}
            Always consume alcohol responsibly.
          </Text>
          <Text style={{ 
            color: '#666666', 
            fontSize: 11, 
            textAlign: 'center',
          }}>
            {APP_CONFIG.copyright} • Version {APP_CONFIG.version}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}