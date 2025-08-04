import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to popular tab immediately
    router.replace('/popular');
  }, []);

  return null;
}