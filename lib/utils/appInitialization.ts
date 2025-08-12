/**
 * Global app initialization state manager
 * Prevents duplicate initialization in development mode (StrictMode)
 */
class AppInitializationManager {
  private static isInitialized = false;
  private static isInitializing = false;
  private static subscriptionValidated = false;
  
  static hasInitialized(): boolean {
    return this.isInitialized;
  }
  
  static isCurrentlyInitializing(): boolean {
    return this.isInitializing;
  }
  
  static hasValidatedSubscription(): boolean {
    return this.subscriptionValidated;
  }
  
  static markAsInitialized(): void {
    this.isInitialized = true;
    this.isInitializing = false;
  }
  
  static markAsInitializing(): void {
    this.isInitializing = true;
  }
  
  static markSubscriptionValidated(): void {
    this.subscriptionValidated = true;
  }
  
  static reset(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    this.subscriptionValidated = false;
  }
}

export { AppInitializationManager };