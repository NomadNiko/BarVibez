import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage for disclaimer
const disclaimerStorage = new MMKV({
  id: 'cocktail-native-disclaimer',
  encryptionKey: 'disclaimer-storage-key'
});

/**
 * Disclaimer storage utilities
 */
export class DisclaimerStorage {
  
  /**
   * Check if user has accepted the disclaimer
   */
  static hasAcceptedDisclaimer(): boolean {
    try {
      return disclaimerStorage.getBoolean('disclaimer_accepted') ?? false;
    } catch (error) {
      console.error('Failed to check disclaimer acceptance:', error);
      return false;
    }
  }

  /**
   * Mark disclaimer as accepted
   */
  static setDisclaimerAccepted(): void {
    try {
      disclaimerStorage.set('disclaimer_accepted', true);
      disclaimerStorage.set('disclaimer_accepted_date', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error);
      throw error;
    }
  }

  /**
   * Get the date when disclaimer was accepted (for audit purposes)
   */
  static getDisclaimerAcceptedDate(): string | null {
    try {
      return disclaimerStorage.getString('disclaimer_accepted_date') ?? null;
    } catch (error) {
      console.error('Failed to get disclaimer acceptance date:', error);
      return null;
    }
  }

  /**
   * Clear disclaimer acceptance (for testing purposes)
   */
  static clearDisclaimerAcceptance(): void {
    try {
      disclaimerStorage.delete('disclaimer_accepted');
      disclaimerStorage.delete('disclaimer_accepted_date');
    } catch (error) {
      console.error('Failed to clear disclaimer acceptance:', error);
      throw error;
    }
  }

  /**
   * Get disclaimer storage stats (for debugging)
   */
  static getDisclaimerStats(): {
    hasAccepted: boolean;
    acceptedDate: string | null;
    isValid: boolean;
  } {
    const hasAccepted = this.hasAcceptedDisclaimer();
    const acceptedDate = this.getDisclaimerAcceptedDate();
    
    return {
      hasAccepted,
      acceptedDate,
      isValid: hasAccepted && acceptedDate !== null,
    };
  }
}