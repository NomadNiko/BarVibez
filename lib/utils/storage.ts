import { MMKV } from 'react-native-mmkv';
import { UserData, DEFAULT_USER_SETTINGS } from '../types/user';

// Initialize MMKV storage
const storage = new MMKV({
  id: 'cocktail-native-user-storage',
  encryptionKey: 'cocktail-user-data-encryption-key'
});

// Storage keys
const STORAGE_KEYS = {
  CURRENT_USER_ID: '@cocktail_native:current_user_id',
  USER_DATA: '@cocktail_native:user_data',
  DEVICE_ID: '@cocktail_native:device_id',
} as const;

/**
 * Generate a namespaced key for user-specific data
 */
const getUserKey = (userId: string, key: string): string => {
  return `${STORAGE_KEYS.USER_DATA}:${userId}:${key}`;
};

/**
 * Storage utility class for user data management
 */
export class UserStorage {
  
  /**
   * Get current active user ID
   */
  static getCurrentUserId(): string | null {
    try {
      return storage.getString(STORAGE_KEYS.CURRENT_USER_ID) || null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  /**
   * Set current active user ID
   */
  static setCurrentUserId(userId: string | null): void {
    try {
      if (userId) {
        storage.set(STORAGE_KEYS.CURRENT_USER_ID, userId);
      } else {
        storage.delete(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (error) {
      console.error('Failed to set current user ID:', error);
      throw error;
    }
  }

  /**
   * Get user data for a specific user ID
   */
  static getUserData(userId: string): UserData | null {
    try {
      const key = getUserKey(userId, 'profile');
      const userData = storage.getString(key);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Save user data for a specific user ID
   */
  static saveUserData(userData: UserData): void {
    try {
      const key = getUserKey(userData.userId, 'profile');
      storage.set(key, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  }

  /**
   * Create new user data with defaults
   */
  static createNewUserData(userId: string, appStoreId?: string): UserData {
    const now = new Date().toISOString();
    return {
      userId,
      appStoreId,
      settings: { ...DEFAULT_USER_SETTINGS },
      favorites: [],
      customCocktails: [],
      isPro: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update user settings
   */
  static updateUserSettings(userId: string, settings: Partial<UserData['settings']>): void {
    const userData = this.getUserData(userId);
    if (!userData) throw new Error('User data not found');

    userData.settings = { ...userData.settings, ...settings };
    userData.updatedAt = new Date().toISOString();
    
    this.saveUserData(userData);
  }

  /**
   * Add cocktail to favorites
   */
  static addFavorite(userId: string, cocktailId: string): void {
    const userData = this.getUserData(userId);
    if (!userData) throw new Error('User data not found');

    if (!userData.favorites.includes(cocktailId)) {
      userData.favorites.push(cocktailId);
      userData.updatedAt = new Date().toISOString();
      this.saveUserData(userData);
    }
  }

  /**
   * Remove cocktail from favorites
   */
  static removeFavorite(userId: string, cocktailId: string): void {
    const userData = this.getUserData(userId);
    if (!userData) throw new Error('User data not found');

    userData.favorites = userData.favorites.filter(id => id !== cocktailId);
    userData.updatedAt = new Date().toISOString();
    this.saveUserData(userData);
  }

  /**
   * Check if cocktail is in favorites
   */
  static isFavorite(userData: UserData | null, cocktailId: string): boolean {
    return userData?.favorites.includes(cocktailId) ?? false;
  }

  /**
   * Clear all user data (for sign out)
   */
  static clearCurrentUserData(): void {
    try {
      storage.delete(STORAGE_KEYS.CURRENT_USER_ID);
    } catch (error) {
      console.error('Failed to clear current user data:', error);
      throw error;
    }
  }

  /**
   * Generate device-based user ID as fallback
   */
  static getOrCreateDeviceUserId(): string {
    try {
      let deviceId = storage.getString(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storage.set(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Failed to get or create device user ID:', error);
      // Fallback to timestamp-based ID
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get all stored user IDs (for debugging/admin)
   */
  static getAllUserIds(): string[] {
    try {
      const allKeys = storage.getAllKeys();
      const userDataKeys = allKeys.filter(key => key.includes(STORAGE_KEYS.USER_DATA));
      return userDataKeys.map(key => {
        const parts = key.split(':');
        return parts[2]; // Extract user ID from key structure
      }).filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
    } catch (error) {
      console.error('Failed to get all user IDs:', error);
      return [];
    }
  }
}