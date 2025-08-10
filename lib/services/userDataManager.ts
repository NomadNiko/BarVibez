import { UserData, UserSettings, Venue } from '../types/user';
import { UserCocktail, CocktailIngredient } from '../types/cocktail';
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
   * Update subscription status based on RevenueCat entitlements
   * This method should be called when RevenueCat customer info changes
   */
  static updateSubscriptionStatusFromRevenueCat(hasProEntitlement: boolean): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const newSubscriptionStatus = hasProEntitlement ? 'premium' : 'free';
      
      // Only update if status has changed
      if (this.currentUser.settings.subscriptionStatus !== newSubscriptionStatus) {
        console.log(`Subscription status changed to: ${newSubscriptionStatus}`);
        
        // Update local cache with new object reference
        this.currentUser = {
          ...this.currentUser,
          isPro: hasProEntitlement,
          settings: {
            ...this.currentUser.settings,
            subscriptionStatus: newSubscriptionStatus
          },
          updatedAt: new Date().toISOString()
        };
        
        UserStorage.saveUserData(this.currentUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to update subscription status from RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Upgrade user to Pro (legacy method for backwards compatibility)
   * @deprecated Use updateSubscriptionStatusFromRevenueCat instead
   */
  static upgradeToProUser(): void {
    console.warn('upgradeToProUser is deprecated. Use RevenueCat purchase flow instead.');
    this.updateSubscriptionStatusFromRevenueCat(true);
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
   * Create a new user cocktail
   */
  static createUserCocktail(
    name: string,
    ingredients: CocktailIngredient[],
    instructions: string,
    glass: string,
    venueIds: string[]
  ): UserCocktail {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Cocktail name is required');
      }
      if (ingredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }
      if (!instructions.trim()) {
        throw new Error('Instructions are required');
      }
      if (instructions.length > 256) {
        throw new Error('Instructions must be 256 characters or less');
      }
      if (!glass.trim()) {
        throw new Error('Glass type is required');
      }

      // Get default venue ID
      const defaultVenue = this.currentUser.venues.find(v => v.isDefault);
      if (!defaultVenue) {
        throw new Error('Default venue not found');
      }

      // Always include default venue, plus any additional venues
      const allVenueIds = [defaultVenue.id, ...venueIds.filter(id => id !== defaultVenue.id)];

      const newCocktail: UserCocktail = {
        id: `user_cocktail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        glass: glass.trim(),
        instructions: instructions.trim(),
        ingredients: ingredients.map(ing => ({
          name: ing.name.trim(),
          measure: ing.measure?.trim()
        })),
        venues: allVenueIds,
        isUserCreated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the cocktail to storage
      UserStorage.saveUserCocktail(newCocktail);

      // Update user data to include the new cocktail ID
      this.currentUser = {
        ...this.currentUser,
        customCocktails: [...(this.currentUser.customCocktails || []), newCocktail.id],
        updatedAt: new Date().toISOString()
      };

      // Update venues to include the cocktail
      const updatedVenues = this.currentUser.venues.map(venue => {
        if (allVenueIds.includes(venue.id)) {
          return {
            ...venue,
            customCocktailIds: [...venue.customCocktailIds, newCocktail.id],
            updatedAt: new Date().toISOString()
          };
        }
        return venue;
      });

      this.currentUser = {
        ...this.currentUser,
        venues: updatedVenues,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();

      return newCocktail;
    } catch (error) {
      console.error('Failed to create user cocktail:', error);
      throw error;
    }
  }

  /**
   * Get a user cocktail by ID
   */
  static getUserCocktail(cocktailId: string): UserCocktail | null {
    try {
      return UserStorage.getUserCocktail(cocktailId);
    } catch (error) {
      console.error('Failed to get user cocktail:', error);
      return null;
    }
  }

  /**
   * Get all user cocktails
   */
  static getAllUserCocktails(): UserCocktail[] {
    if (!this.currentUser) {
      return [];
    }

    try {
      const cocktailIds = this.currentUser.customCocktails || [];
      return cocktailIds
        .map(id => UserStorage.getUserCocktail(id))
        .filter((cocktail): cocktail is UserCocktail => cocktail !== null);
    } catch (error) {
      console.error('Failed to get all user cocktails:', error);
      return [];
    }
  }

  /**
   * Update a user cocktail
   */
  static updateUserCocktail(
    cocktailId: string,
    updates: {
      name?: string;
      ingredients?: CocktailIngredient[];
      instructions?: string;
      glass?: string;
      venueIds?: string[];
    }
  ): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const existingCocktail = UserStorage.getUserCocktail(cocktailId);
      if (!existingCocktail) {
        throw new Error('User cocktail not found');
      }

      // Validate updates
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error('Cocktail name cannot be empty');
      }
      if (updates.instructions !== undefined) {
        if (!updates.instructions.trim()) {
          throw new Error('Instructions cannot be empty');
        }
        if (updates.instructions.length > 256) {
          throw new Error('Instructions must be 256 characters or less');
        }
      }
      if (updates.ingredients !== undefined && updates.ingredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }

      // Handle venue updates
      let finalVenueIds = existingCocktail.venues;
      if (updates.venueIds !== undefined) {
        const defaultVenue = this.currentUser.venues.find(v => v.isDefault);
        if (!defaultVenue) {
          throw new Error('Default venue not found');
        }
        // Always include default venue
        finalVenueIds = [defaultVenue.id, ...updates.venueIds.filter(id => id !== defaultVenue.id)];
      }

      const updatedCocktail: UserCocktail = {
        ...existingCocktail,
        name: updates.name?.trim() ?? existingCocktail.name,
        glass: updates.glass?.trim() ?? existingCocktail.glass,
        instructions: updates.instructions?.trim() ?? existingCocktail.instructions,
        ingredients: updates.ingredients?.map(ing => ({
          name: ing.name.trim(),
          measure: ing.measure?.trim()
        })) ?? existingCocktail.ingredients,
        venues: finalVenueIds,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserCocktail(updatedCocktail);

      // Update venue associations if venues changed
      if (updates.venueIds !== undefined) {
        const updatedVenues = this.currentUser.venues.map(venue => {
          const hadCocktail = existingCocktail.venues.includes(venue.id);
          const shouldHaveCocktail = finalVenueIds.includes(venue.id);

          if (hadCocktail && !shouldHaveCocktail) {
            // Remove from venue
            return {
              ...venue,
              customCocktailIds: venue.customCocktailIds.filter(id => id !== cocktailId),
              updatedAt: new Date().toISOString()
            };
          } else if (!hadCocktail && shouldHaveCocktail) {
            // Add to venue
            return {
              ...venue,
              customCocktailIds: [...venue.customCocktailIds, cocktailId],
              updatedAt: new Date().toISOString()
            };
          }
          return venue;
        });

        this.currentUser = {
          ...this.currentUser,
          venues: updatedVenues,
          updatedAt: new Date().toISOString()
        };

        UserStorage.saveUserData(this.currentUser);
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update user cocktail:', error);
      throw error;
    }
  }

  /**
   * Delete a user cocktail
   */
  static deleteUserCocktail(cocktailId: string): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      const existingCocktail = UserStorage.getUserCocktail(cocktailId);
      if (!existingCocktail) {
        throw new Error('User cocktail not found');
      }

      // Remove from storage
      UserStorage.deleteUserCocktail(cocktailId);

      // Remove from user's custom cocktails list
      this.currentUser = {
        ...this.currentUser,
        customCocktails: (this.currentUser.customCocktails || []).filter(id => id !== cocktailId),
        updatedAt: new Date().toISOString()
      };

      // Remove from all venues
      const updatedVenues = this.currentUser.venues.map(venue => ({
        ...venue,
        customCocktailIds: venue.customCocktailIds.filter(id => id !== cocktailId),
        updatedAt: new Date().toISOString()
      }));

      this.currentUser = {
        ...this.currentUser,
        venues: updatedVenues,
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete user cocktail:', error);
      throw error;
    }
  }

  /**
   * Add custom cocktail to venue (for existing user cocktails)
   */
  static addCustomCocktailToVenue(venueId: string, cocktailId: string): void {
    console.log('UserDataManager.addCustomCocktailToVenue called with:', { venueId, cocktailId });
    
    if (!this.currentUser) {
      console.error('No current user found');
      throw new Error('No current user');
    }

    try {
      const venues = this.currentUser.venues || [];
      console.log('Available venues:', venues.map(v => ({ id: v.id, name: v.name })));
      
      const venueIndex = venues.findIndex(v => v.id === venueId);
      console.log('Venue index:', venueIndex);
      
      if (venueIndex === -1) {
        console.error('Venue not found with ID:', venueId);
        throw new Error('Venue not found');
      }

      const venue = venues[venueIndex];
      console.log('Found venue:', { id: venue.id, name: venue.name, customCocktailIds: venue.customCocktailIds });
      
      const cocktail = UserStorage.getUserCocktail(cocktailId);
      console.log('Found cocktail:', cocktail ? { id: cocktail.id, name: cocktail.name } : null);
      
      if (!cocktail) {
        console.error('User cocktail not found with ID:', cocktailId);
        throw new Error('User cocktail not found');
      }

      // Update venue
      if (!venue.customCocktailIds.includes(cocktailId)) {
        console.log('Adding cocktail to venue (not already present)');
        const updatedVenue = {
          ...venue,
          customCocktailIds: [...venue.customCocktailIds, cocktailId],
          updatedAt: new Date().toISOString()
        };

        const newVenues = [...venues];
        newVenues[venueIndex] = updatedVenue;

        this.currentUser = {
          ...this.currentUser,
          venues: newVenues,
          updatedAt: new Date().toISOString()
        };

        // Update cocktail venues list
        const updatedCocktail = {
          ...cocktail,
          venues: [...cocktail.venues, venueId].filter((id, index, arr) => arr.indexOf(id) === index), // Remove duplicates
          updatedAt: new Date().toISOString()
        };

        console.log('Saving updated cocktail:', updatedCocktail);
        console.log('Saving updated user data');
        
        UserStorage.saveUserCocktail(updatedCocktail);
        UserStorage.saveUserData(this.currentUser);
        this.notifyListeners();
        
        console.log('Successfully added custom cocktail to venue');
      } else {
        console.log('Cocktail already exists in venue');
      }
    } catch (error) {
      console.error('Failed to add custom cocktail to venue:', error);
      throw error;
    }
  }

  /**
   * Remove custom cocktail from venue (but not from default venue)
   */
  static removeCustomCocktailFromVenue(venueId: string, cocktailId: string): void {
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
      const cocktail = UserStorage.getUserCocktail(cocktailId);
      
      if (!cocktail) {
        throw new Error('User cocktail not found');
      }

      // Cannot remove from default venue
      if (venue.isDefault) {
        throw new Error('Cannot remove custom cocktail from default venue');
      }

      // Update venue
      const updatedVenue = {
        ...venue,
        customCocktailIds: venue.customCocktailIds.filter(id => id !== cocktailId),
        updatedAt: new Date().toISOString()
      };

      const newVenues = [...venues];
      newVenues[venueIndex] = updatedVenue;

      this.currentUser = {
        ...this.currentUser,
        venues: newVenues,
        updatedAt: new Date().toISOString()
      };

      // Update cocktail venues list
      const updatedCocktail = {
        ...cocktail,
        venues: cocktail.venues.filter(id => id !== venueId),
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserCocktail(updatedCocktail);
      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove custom cocktail from venue:', error);
      throw error;
    }
  }


  /**
   * Clear all user custom data (venues and cocktails)
   */
  static async clearCustomData(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    try {
      // Get counts for logging
      const customVenues = this.currentUser.venues?.filter(v => !v.isDefault) || [];
      const customCocktails = this.currentUser.customCocktails || [];

      console.log(`Clearing ${customVenues.length} custom venues and ${customCocktails.length} custom cocktails`);

      // Delete all custom cocktails from storage
      for (const cocktailId of customCocktails) {
        try {
          UserStorage.deleteUserCocktail(cocktailId);
        } catch (error) {
          console.warn(`Failed to delete cocktail ${cocktailId}:`, error);
        }
      }

      // Update user data to keep only default venues and clear custom data
      this.currentUser = {
        ...this.currentUser,
        venues: this.currentUser.venues?.filter(v => v.isDefault) || [],
        customCocktails: [],
        updatedAt: new Date().toISOString()
      };

      UserStorage.saveUserData(this.currentUser);
      this.notifyListeners();

      console.log('Custom data cleared successfully');
    } catch (error) {
      console.error('Failed to clear custom data:', error);
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