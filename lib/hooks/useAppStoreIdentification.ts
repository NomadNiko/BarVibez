import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';

/**
 * Hook for RevenueCat user identification and subscription status
 * Following RevenueCat's best practices from their example implementation
 */
export function useAppStoreIdentification() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoadingIdentification, setIsLoadingIdentification] = useState(true);
  const [identificationError, setIdentificationError] = useState<string | null>(null);

  /**
   * Force refresh customer info from RevenueCat
   * Call this after purchases or restores to ensure UI updates immediately
   */
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const freshCustomerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(freshCustomerInfo);
      console.log('Customer info refreshed:', {
        originalAppUserId: freshCustomerInfo.originalAppUserId,
        entitlements: Object.keys(freshCustomerInfo.entitlements.active || {})
      });
      return freshCustomerInfo;
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
      throw error;
    }
  }, []);

  /**
   * Initialize RevenueCat customer info streaming
   * Based on the official RevenueCat example UserViewModel pattern
   */
  useEffect(() => {
    let isActive = true;

    const initializeCustomerInfo = async () => {
      try {
        setIsLoadingIdentification(true);
        
        // Get initial customer info
        const initialCustomerInfo = await Purchases.getCustomerInfo();
        if (isActive) {
          setCustomerInfo(initialCustomerInfo);
          console.log('Initial customer info loaded:', {
            originalAppUserId: initialCustomerInfo.originalAppUserId,
            entitlements: Object.keys(initialCustomerInfo.entitlements.active || {})
          });
        }
        
      } catch (error) {
        console.error('Failed to get initial customer info:', error);
        if (isActive) {
          setIdentificationError('Failed to load subscription status');
        }
      } finally {
        if (isActive) {
          setIsLoadingIdentification(false);
        }
      }
    };

    // Set up customer info streaming (following RevenueCat example)
    const setupCustomerInfoStream = async () => {
      try {
        // Listen to changes in the customerInfo object using customerInfoUpdateListener
        const listener = Purchases.addCustomerInfoUpdateListener((info) => {
          if (isActive) {
            console.log('Customer info updated:', {
              originalAppUserId: info.originalAppUserId,
              entitlements: Object.keys(info.entitlements.active || {})
            });
            setCustomerInfo(info);
          }
        });

        // Store the listener for cleanup
        return listener;
      } catch (error) {
        console.error('Failed to set up customer info stream:', error);
        if (isActive) {
          setIdentificationError('Failed to monitor subscription status');
        }
        return null;
      }
    };

    // Initialize customer info and set up streaming
    initializeCustomerInfo();
    let listenerCleanup: (() => void) | null = null;
    
    setupCustomerInfoStream().then(cleanup => {
      listenerCleanup = cleanup;
    });

    // Cleanup function
    return () => {
      isActive = false;
      if (listenerCleanup) {
        listenerCleanup();
      }
    };
  }, []);

  /**
   * Get the App Store user ID from RevenueCat
   */
  const appStoreId = customerInfo?.originalAppUserId || null;

  /**
   * Check if user has Pro subscription
   * Uses the entitlement identifier from app.json config
   */
  const hasProSubscription = (): boolean => {
    if (!customerInfo) return false;
    
    const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
    const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
    
    return customerInfo.entitlements.active[entitlementIdentifier]?.isActive === true;
  };

  /**
   * Login user with RevenueCat
   */
  const loginUser = async (userId: string): Promise<void> => {
    try {
      setIsLoadingIdentification(true);
      const result = await Purchases.logIn(userId);
      setCustomerInfo(result.customerInfo);
      console.log('User logged in:', result.customerInfo.originalAppUserId);
    } catch (error) {
      console.error('Failed to login user:', error);
      setIdentificationError('Failed to login user');
      throw error;
    } finally {
      setIsLoadingIdentification(false);
    }
  };

  /**
   * Logout current user
   */
  const logoutUser = async (): Promise<void> => {
    try {
      setIsLoadingIdentification(true);
      const result = await Purchases.logOut();
      setCustomerInfo(result.customerInfo);
      console.log('User logged out, new anonymous user:', result.customerInfo.originalAppUserId);
    } catch (error) {
      console.error('Failed to logout user:', error);
      setIdentificationError('Failed to logout user');
      throw error;
    } finally {
      setIsLoadingIdentification(false);
    }
  };

  /**
   * Clear identification error
   */
  const clearError = () => {
    setIdentificationError(null);
  };

  return {
    customerInfo,
    appStoreId,
    isLoadingIdentification,
    identificationError,
    hasProSubscription,
    loginUser,
    logoutUser,
    clearError,
    refreshCustomerInfo,
  };
}