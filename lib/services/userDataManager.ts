import { UserData, UserSettings, Venue } from '../types/user';
import { UserStorage } from '../utils/storage';

/**
 * User Data Manager - Central service for managing user data, settings, and favorites
 * This service handles user identification, data persistence, and business logic
 */
export class UserDataManager {
  private static currentUser: UserData | null = null;
  private static listeners: Set<(userData: UserData | null) => void> = new Set();

  /**
   * Initialize the user data manager and load current user
   */
  static initialize(): UserData | null {
    try {
      const currentUserId = UserStorage.getCurrentUserId();
      
      if (currentUserId) {
        const userData = UserStorage.getUserData(currentUserId);
        if (userData) {
          // Ensure venues array exists
          if (!userData.venues) {
            userData.venues = [];
          }
          
          // Ensure default venue exists for existing users
          const hasDefaultVenue = userData.venues.some(v => v.isDefault);
          if (!hasDefaultVenue) {
            const defaultVenue = UserStorage.createDefaultVenue(userData.userId);
            userData.venues = [defaultVenue, ...userData.venues];
            UserStorage.saveUserData(userData);
          }
          
          this.currentUser = userData;
          return userData;
        }
      }

      // If no current user, create a device-based user
      const deviceUserId = UserStorage.getOrCreateDeviceUserId();
      const existingUserData = UserStorage.getUserData(deviceUserId);
      
      if (existingUserData) {
        // Ensure venues array exists
        if (!existingUserData.venues) {
          existingUserData.venues = [];
        }
        
        // Ensure default venue exists for existing users
        const hasDefaultVenue = existingUserData.venues.some(v => v.isDefault);
        if (!hasDefaultVenue) {
          const defaultVenue = UserStorage.createDefaultVenue(existingUserData.userId);
          existingUserData.venues = [defaultVenue, ...existingUserData.venues];
          UserStorage.saveUserData(existingUserData);
        }
        
        this.currentUser = existingUserData;
        UserStorage.setCurrentUserId(deviceUserId);
      } else {
        // Create new user data
        const newUserData = UserStorage.createNewUserData(deviceUserId);
        UserStorage.saveUserData(newUserData);
        UserStorage.setCurrentUserId(deviceUserId);
        this.currentUser = newUserData;
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Failed to initialize user data:', error);
      return null;
    }
  }

  /**
   * Get current user data
   */
  static getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  /**
   * Force update user data (for migrations)
   */
  static forceUpdateUserData(userData: UserData): void {
    this.currentUser = userData;
    UserStorage.saveUserData(userData);
    this.notifyListeners();
  }

  /**
   * Sign in with App Store ID (placeholder for future RevenueCat integration)
   */
  static signIn(appStoreId: string): UserData {
    try {
      // Check if user with this App Store ID already exists
      let userData = this.findUserByAppStoreId(appStoreId);
      
      if (!userData) {
        // Create new user for this App Store ID
        userData = UserStorage.createNewUserData(`appstore_${appStoreId}`, appStoreId);
        UserStorage.saveUserData(userData);
      }

      // Set as current user
      UserStorage.setCurrentUserId(userData.userId);
      this.currentUser = userData;
      this.notifyListeners();
      
      return userData;
    } catch (error) {
      console.error('Failed to sign in user:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static signOut(): void {
    try {
      UserStorage.clearCurrentUserData();
      this.currentUser = null;
      this.notifyListeners();
      
      // Reinitialize with device user
      this.initialize();
    } catch (error) {
      console.error('Failed to sign out user:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static updateSettings(settings: Partial<UserSettings>): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      UserStorage.updateUserSettings(this.currentUser.userId, settings);
      
      // Update local cache with new object reference
      this.currentUser = {
        ...this.currentUser,
        settings: { ...this.currentUser.settings, ...settings },
        updatedAt: new Date().toISOString()
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  }

  /**
   * Add cocktail to favorites
   */
  static addToFavorites(cocktailId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      UserStorage.addFavorite(this.currentUser.userId, cocktailId);
      
      // Update local cache with new object reference
      if (!this.currentUser.favorites.includes(cocktailId)) {
        this.currentUser = {
          ...this.currentUser,
          favorites: [...this.currentUser.favorites, cocktailId],
          updatedAt: new Date().toISOString()
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove cocktail from favorites
   */
  static removeFromFavorites(cocktailId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      UserStorage.removeFavorite(this.currentUser.userId, cocktailId);
      
      // Update local cache with new object reference
      this.currentUser = {
        ...this.currentUser,
        favorites: this.currentUser.favorites.filter(id => id !== cocktailId),
        updatedAt: new Date().toISOString()
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  /**
   * Check if cocktail is in favorites
   */
  static isFavorite(cocktailId: string): boolean {
    return UserStorage.isFavorite(this.currentUser, cocktailId);
  }

  /**
   * Upgrade user to Pro (placeholder for RevenueCat integration)
   */
  static upgradeToProUser(): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      // Update local cache with new object reference
      this.currentUser = {
        ...this.currentUser,
        isPro: true,
        updatedAt: new Date().toISOString()
      };
      
      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to upgrade user to Pro:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user data changes
   */
  static subscribe(listener: (userData: UserData | null) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of user data changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Error in user data listener:', error);
      }
    });
  }

  /**
   * Find user by App Store ID (helper method)
   */
  private static findUserByAppStoreId(appStoreId: string): UserData | null {
    try {
      const allUserIds = UserStorage.getAllUserIds();
      
      for (const userId of allUserIds) {
        const userData = UserStorage.getUserData(userId);
        if (userData?.appStoreId === appStoreId) {
          return userData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to find user by App Store ID:', error);
      return null;
    }
  }

  /**
   * Create a new venue
   */
  static createVenue(name: string): Venue {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const newVenue: Venue = {
        id: `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        ingredients: [],
        cocktailIds: [],
        customCocktailIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.currentUser = {
        ...this.currentUser,
        venues: [...(this.currentUser.venues || []), newVenue],
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
      
      return newVenue;
    } catch (error) {
      console.error('Failed to create venue:', error);
      throw error;
    }
  }

  /**
   * Update a venue
   */
  static updateVenue(venueId: string, updates: Partial<Venue>): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venueIndex = venues.findIndex(v => v.id === venueId);
      
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }

      // Prevent updating default venue's name
      if (venues[venueIndex].isDefault && updates.name) {
        delete updates.name;
      }

      const updatedVenue = {
        ...venues[venueIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const newVenues = [...venues];
      newVenues[venueIndex] = updatedVenue;

      this.currentUser = {
        ...this.currentUser,
        venues: newVenues,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update venue:', error);
      throw error;
    }
  }

  /**
   * Delete a venue (cannot delete default venue)
   */
  static deleteVenue(venueId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venue = venues.find(v => v.id === venueId);
      
      if (!venue) {
        throw new Error('Venue not found');
      }
      
      if (venue.isDefault) {
        throw new Error('Cannot delete default venue');
      }

      this.currentUser = {
        ...this.currentUser,
        venues: venues.filter(v => v.id !== venueId),
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      throw error;
    }
  }

  /**
   * Add ingredient to venue
   */
  static addIngredientToVenue(venueId: string, ingredient: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venueIndex = venues.findIndex(v => v.id === venueId);
      
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }

      const venue = venues[venueIndex];
      if (!venue.ingredients.includes(ingredient)) {
        const updatedVenue = {
          ...venue,
          ingredients: [...venue.ingredients, ingredient],
          updatedAt: new Date().toISOString()
        };

        const newVenues = [...venues];
        newVenues[venueIndex] = updatedVenue;

        this.currentUser = {
          ...this.currentUser,
          venues: newVenues,
          updatedAt: new Date().toISOString()
        };

        UserStorage.saveUserData(this.currentUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to add ingredient to venue:', error);
      throw error;
    }
  }

  /**
   * Remove ingredient from venue
   */
  static removeIngredientFromVenue(venueId: string, ingredient: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venueIndex = venues.findIndex(v => v.id === venueId);
      
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }

      const venue = venues[venueIndex];
      const updatedVenue = {
        ...venue,
        ingredients: venue.ingredients.filter(i => i !== ingredient),
        updatedAt: new Date().toISOString()
      };

      const newVenues = [...venues];
      newVenues[venueIndex] = updatedVenue;

      this.currentUser = {
        ...this.currentUser,
        venues: newVenues,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove ingredient from venue:', error);
      throw error;
    }
  }

  /**
   * Add cocktail to venue
   */
  static addCocktailToVenue(venueId: string, cocktailId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venueIndex = venues.findIndex(v => v.id === venueId);
      
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }

      const venue = venues[venueIndex];
      
      // If it's the default venue, add to favorites instead
      if (venue.isDefault) {
        this.addToFavorites(cocktailId);
        return;
      }
      
      if (!venue.cocktailIds.includes(cocktailId)) {
        const updatedVenue = {
          ...venue,
          cocktailIds: [...venue.cocktailIds, cocktailId],
          updatedAt: new Date().toISOString()
        };

        const newVenues = [...venues];
        newVenues[venueIndex] = updatedVenue;

        this.currentUser = {
          ...this.currentUser,
          venues: newVenues,
          updatedAt: new Date().toISOString()
        };

        UserStorage.saveUserData(this.currentUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to add cocktail to venue:', error);
      throw error;
    }
  }

  /**
   * Remove cocktail from venue
   */
  static removeCocktailFromVenue(venueId: string, cocktailId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      const venueIndex = venues.findIndex(v => v.id === venueId);
      
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }

      const venue = venues[venueIndex];
      
      // If it's the default venue, remove from favorites instead
      if (venue.isDefault) {
        this.removeFromFavorites(cocktailId);
        return;
      }
      
      const updatedVenue = {
        ...venue,
        cocktailIds: venue.cocktailIds.filter(id => id !== cocktailId),
        updatedAt: new Date().toISOString()
      };

      const newVenues = [...venues];
      newVenues[venueIndex] = updatedVenue;

      this.currentUser = {
        ...this.currentUser,
        venues: newVenues,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove cocktail from venue:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (for debugging)
   */
  static getUserStats(): {
    totalUsers: number;
    proUsers: number;
    deviceUsers: number;
    appStoreUsers: number;
  } {
    try {
      const allUserIds = UserStorage.getAllUserIds();
      let proUsers = 0;
      let deviceUsers = 0;
      let appStoreUsers = 0;

      allUserIds.forEach(userId => {
        const userData = UserStorage.getUserData(userId);
        if (userData) {
          if (userData.isPro) proUsers++;
          if (userId.startsWith('device_')) deviceUsers++;
          if (userId.startsWith('appstore_')) appStoreUsers++;
        }
      });

      return {
        totalUsers: allUserIds.length,
        proUsers,
        deviceUsers,
        appStoreUsers,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return { totalUsers: 0, proUsers: 0, deviceUsers: 0, appStoreUsers: 0 };
    }
  }
}