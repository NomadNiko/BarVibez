import { useEffect } from 'react';
import { router } from 'expo-router';
import { DisclaimerStorage } from '~/lib/utils/disclaimerStorage';
import { useUserSettings } from '~/lib/contexts/UserContext';

export default function Index() {
  const { settings } = useUserSettings();
  
  useEffect(() => {
    // Check if user has accepted disclaimer
    const hasAcceptedDisclaimer = DisclaimerStorage.hasAcceptedDisclaimer();
    
    if (!hasAcceptedDisclaimer) {
      // User hasn't accepted disclaimer, show disclaimer screen
      router.replace('/disclaimer');
    } else {
      // User has accepted disclaimer, now check subscription status
      if (settings?.subscriptionStatus === 'free') {
        // Free user - show paywall
        router.replace('/paywall');
      } else {
        // Premium user - go to main app
        router.replace('/popular');
      }
    }
  }, [settings]);

  return null;
}