import { useEffect } from 'react';
import { router } from 'expo-router';
import { DisclaimerStorage } from '~/lib/utils/disclaimerStorage';

export default function Index() {
  useEffect(() => {
    // Check if user has accepted disclaimer
    const hasAcceptedDisclaimer = DisclaimerStorage.hasAcceptedDisclaimer();
    
    if (hasAcceptedDisclaimer) {
      // User has already accepted, go to main app
      router.replace('/popular');
    } else {
      // User hasn't accepted disclaimer, show disclaimer screen
      router.replace('/disclaimer');
    }
  }, []);

  return null;
}