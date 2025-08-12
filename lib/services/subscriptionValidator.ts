import Purchases, { CustomerInfo, PurchasesError } from 'react-native-purchases';
import Constants from 'expo-constants';
import { UserDataManager } from './userDataManager';

export class SubscriptionValidator {
  private static navigationInProgress = false;

  /**
   * Validates the user's subscription status with RevenueCat.
   * IMPORTANT: This will only downgrade users if we successfully connect to RevenueCat
   * and confirm they don't have an active subscription.
   * If offline or any network error occurs, the current status is preserved.
   * 
   * @returns {Promise<{shouldShowPaywall: boolean, validationPerformed: boolean}>}
   */
  static async validateSubscription(): Promise<{
    shouldShowPaywall: boolean;
    validationPerformed: boolean;
    isOffline: boolean;
  }> {
    try {
      console.log('[SubscriptionValidator] Starting subscription validation...');
      
      // Check if RevenueCat is configured
      const isConfigured = await Purchases.isConfigured();
      if (!isConfigured) {
        console.log('[SubscriptionValidator] RevenueCat not configured, skipping validation');
        return { 
          shouldShowPaywall: false, 
          validationPerformed: false,
          isOffline: false 
        };
      }

      // Attempt to get fresh customer info from RevenueCat
      // This will throw an error if offline
      const customerInfo = await Purchases.getCustomerInfo();
      
      // If we reach here, we successfully connected to RevenueCat
      console.log('[SubscriptionValidator] Successfully connected to RevenueCat');
      console.log('[SubscriptionValidator] Customer ID:', customerInfo.originalAppUserId);
      console.log('[SubscriptionValidator] Active entitlements:', Object.keys(customerInfo.entitlements.active || {}));
      
      // Check for Pro entitlement
      const revenueCatConfig = Constants.expoConfig?.extra?.revenueCat;
      const entitlementIdentifier = revenueCatConfig?.entitlementIdentifier || 'Pro';
      const hasProEntitlement = customerInfo.entitlements.active[entitlementIdentifier]?.isActive === true;
      
      console.log(`[SubscriptionValidator] Pro entitlement (${entitlementIdentifier}):`, hasProEntitlement);
      
      // Get current user data
      const userData = UserDataManager.getCurrentUser();
      const currentSubscriptionStatus = userData?.settings?.subscriptionStatus || 'free';
      
      // Only update subscription status if we have a definitive answer from RevenueCat
      if (hasProEntitlement && currentSubscriptionStatus !== 'premium') {
        // User has Pro but app thinks they're free - upgrade them
        console.log('[SubscriptionValidator] Upgrading user to premium (RevenueCat shows active subscription)');
        UserDataManager.updateSettings({ subscriptionStatus: 'premium' });
        return { 
          shouldShowPaywall: false, 
          validationPerformed: true,
          isOffline: false 
        };
      } else if (!hasProEntitlement && currentSubscriptionStatus === 'premium') {
        // User doesn't have Pro but app thinks they're premium - downgrade them
        console.log('[SubscriptionValidator] Downgrading user to free (RevenueCat shows no active subscription)');
        UserDataManager.updateSettings({ subscriptionStatus: 'free' });
        
        // Only show paywall if we're certain they don't have a subscription
        return { 
          shouldShowPaywall: true, 
          validationPerformed: true,
          isOffline: false 
        };
      }
      
      // Status matches what RevenueCat says - no action needed
      console.log('[SubscriptionValidator] Subscription status matches RevenueCat, no update needed');
      return { 
        shouldShowPaywall: false, 
        validationPerformed: true,
        isOffline: false 
      };
      
    } catch (error: any) {
      // Check if this is a network/offline error
      const errorCode = error?.code;
      const isNetworkError = 
        errorCode === 'NETWORK_ERROR' || 
        errorCode === 'OFFLINE_CONNECTION_ERROR' ||
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('offline') ||
        error?.message?.toLowerCase().includes('internet') ||
        error?.message?.toLowerCase().includes('connection');
      
      if (isNetworkError) {
        // Device is offline - DO NOT change subscription status
        console.log('[SubscriptionValidator] Device appears to be offline, preserving current subscription status');
        console.log('[SubscriptionValidator] Error details:', error?.message || 'No error message');
        
        // Never show paywall when offline - preserve access for paying users
        return { 
          shouldShowPaywall: false, 
          validationPerformed: false,
          isOffline: true 
        };
      }
      
      // Some other error occurred - log it but don't change subscription status
      console.error('[SubscriptionValidator] Unexpected error during validation:', error);
      console.error('[SubscriptionValidator] Error code:', errorCode);
      console.error('[SubscriptionValidator] Error message:', error?.message);
      
      // Don't show paywall on unexpected errors - give users benefit of the doubt
      return { 
        shouldShowPaywall: false, 
        validationPerformed: false,
        isOffline: false 
      };
    }
  }
  
  /**
   * Performs subscription validation and handles navigation to paywall if needed.
   * This should be called during app initialization after RevenueCat is configured.
   * 
   * @param router - The router instance for navigation
   * @param isAppResuming - Whether app is resuming from background (true) or cold starting (false)
   */
  static async validateAndHandlePaywall(router: any, isAppResuming: boolean = false): Promise<void> {
    try {
      const result = await this.validateSubscription();
      
      // Only show paywall if subscription specifically expired (not just because user is free)
      const shouldNavigateToPaywall = result.shouldShowPaywall;
      
      if (shouldNavigateToPaywall) {
        // Prevent multiple simultaneous navigation attempts
        if (this.navigationInProgress) {
          console.log('[SubscriptionValidator] Navigation already in progress, skipping duplicate');
          return;
        }
        
        this.navigationInProgress = true;
        
        if (result.shouldShowPaywall) {
          console.log('[SubscriptionValidator] Navigating to paywall - subscription expired or not found');
        } else {
          console.log('[SubscriptionValidator] Free user on cold start - showing paywall');
        }
        
        // Small delay to ensure app is fully initialized
        setTimeout(() => {
          // Check if we're already on the paywall
          const currentPath = router.pathname || '';
          if (currentPath.includes('/paywall')) {
            console.log('[SubscriptionValidator] Already on paywall, skipping navigation');
            this.navigationInProgress = false;
            return;
          }
          
          try {
            const result = router.push('/paywall');
            // Some routers return a promise, others don't
            if (result && typeof result.finally === 'function') {
              result.finally(() => {
                setTimeout(() => {
                  this.navigationInProgress = false;
                }, 1000);
              });
            } else {
              // Reset flag after a delay if no promise returned
              setTimeout(() => {
                this.navigationInProgress = false;
              }, 1000);
            }
          } catch (error) {
            console.error('[SubscriptionValidator] Navigation error:', error);
            this.navigationInProgress = false;
          }
        }, 500);
        
      } else if (result.isOffline) {
        console.log('[SubscriptionValidator] Offline mode - subscription check skipped');
      } else if (result.validationPerformed) {
        console.log('[SubscriptionValidator] Subscription validated successfully');
      }
    } catch (error) {
      console.error('[SubscriptionValidator] Error in validateAndHandlePaywall:', error);
      // Never block app usage on errors
    }
  }
}