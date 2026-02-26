import { useState, useEffect, useCallback, useRef } from 'react';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { MMKV } from 'react-native-mmkv';

// Separate MMKV instance for ad data (no encryption needed for timestamps)
const adStorage = new MMKV({ id: 'barvibez-ad-storage' });

const AD_ACCESS_KEY = '@barvibez:ad_access_granted_at';
const ACCESS_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Ad unit IDs (public identifiers, not secrets)
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-8406679264944836/3733680381';

// Use test ID in dev, production ID in release builds
const getAdUnitId = (): string => {
  if (__DEV__) {
    return TestIds.INTERSTITIAL;
  }
  return INTERSTITIAL_AD_UNIT_ID;
};

export function useAdAccess() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [accessGrantedAt, setAccessGrantedAt] = useState<number | null>(() => {
    const stored = adStorage.getNumber(AD_ACCESS_KEY);
    return stored ?? null;
  });
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Load (or reload) the interstitial ad
  const loadAd = useCallback(() => {
    // Clean up previous listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const adUnitId = getAdUnitId();
    const interstitial = InterstitialAd.createForAdRequest(adUnitId);
    interstitialRef.current = interstitial;

    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
      setAdError(null);
    });

    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      // Ad was watched/closed — grant 10 min access
      const now = Date.now();
      adStorage.set(AD_ACCESS_KEY, now);
      setAccessGrantedAt(now);
      setIsShowingAd(false);
      setAdLoaded(false);
      // Pre-load next ad
      loadAd();
    });

    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      setAdError(error.message);
      setAdLoaded(false);
      setIsShowingAd(false);
    });

    cleanupRef.current = () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };

    interstitial.load();
  }, []);

  // Load ad on mount
  useEffect(() => {
    loadAd();
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [loadAd]);

  // Check if user currently has ad-based access
  const hasAdAccess = useCallback((): boolean => {
    const grantedAt = accessGrantedAt ?? adStorage.getNumber(AD_ACCESS_KEY);
    if (!grantedAt) return false;
    return Date.now() - grantedAt < ACCESS_DURATION_MS;
  }, [accessGrantedAt]);

  // Get remaining seconds for countdown display
  const getRemainingSeconds = useCallback((): number => {
    const grantedAt = accessGrantedAt ?? adStorage.getNumber(AD_ACCESS_KEY);
    if (!grantedAt) return 0;
    const remaining = ACCESS_DURATION_MS - (Date.now() - grantedAt);
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [accessGrantedAt]);

  // Show the interstitial ad
  const showAdForAccess = useCallback(async () => {
    if (!adLoaded || !interstitialRef.current) {
      setAdError('Ad not ready yet. Please try again.');
      loadAd();
      return;
    }
    setIsShowingAd(true);
    await interstitialRef.current.show();
  }, [adLoaded, loadAd]);

  return {
    hasAdAccess,
    showAdForAccess,
    getRemainingSeconds,
    adLoaded,
    adError,
    isShowingAd,
    accessGrantedAt,
  };
}
