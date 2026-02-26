import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import {
  BarVibezExport,
  ExportValidation,
  ImportResult,
  SUPPORTED_EXPORT_VERSIONS,
  MAX_FILE_SIZE_MB,
} from '../types/export';
import { UserData, Venue } from '../types/user';
import { UserCocktail } from '../types/cocktail';
import { UserStorage } from '../utils/storage';

export class DataImportService {
  static async pickImportFile(): Promise<BarVibezExport | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return null;

      const file = result.assets[0];
      console.log(`Selected file: ${file.name} (${file.size ?? '?'} bytes)`);

      if (file.size && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      }

      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let importData: any;
      try {
        importData = JSON.parse(fileContent);
      } catch {
        throw new Error('File is not valid JSON');
      }

      const validation = this.validateImportData(importData);
      if (!validation.isValid) {
        throw new Error(`Invalid import file: ${validation.errors.join(', ')}`);
      }

      return importData as BarVibezExport;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateImportData(data: any): ExportValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid JSON structure');
      return { isValid: false, version: 'unknown', errors, warnings, totalVenues: 0, totalCustomCocktails: 0, totalFavorites: 0 };
    }

    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.exportVersion) {
        errors.push('Missing export version');
      } else if (!SUPPORTED_EXPORT_VERSIONS.includes(data.metadata.exportVersion)) {
        errors.push(`Unsupported export version: ${data.metadata.exportVersion}`);
      }
    }

    if (!Array.isArray(data.favorites)) errors.push('Favorites must be an array');
    if (!Array.isArray(data.venues)) {
      errors.push('Venues must be an array');
    } else {
      data.venues.forEach((v: any, i: number) => {
        if (!v?.id || typeof v.id !== 'string') errors.push(`Venue ${i}: missing id`);
        if (!v?.name || typeof v.name !== 'string') errors.push(`Venue ${i}: missing name`);
        if (!Array.isArray(v?.ingredients)) errors.push(`Venue ${i}: ingredients must be array`);
        if (!Array.isArray(v?.cocktailIds)) errors.push(`Venue ${i}: cocktailIds must be array`);
        if (!Array.isArray(v?.customCocktailIds)) errors.push(`Venue ${i}: customCocktailIds must be array`);
      });
    }

    if (!Array.isArray(data.customCocktails)) {
      errors.push('Custom cocktails must be an array');
    } else {
      data.customCocktails.forEach((c: any, i: number) => {
        if (!c?.id || typeof c.id !== 'string') errors.push(`Cocktail ${i}: missing id`);
        if (!c?.name || typeof c.name !== 'string') errors.push(`Cocktail ${i}: missing name`);
        if (!c?.glass || typeof c.glass !== 'string') errors.push(`Cocktail ${i}: missing glass`);
        if (!c?.instructions || typeof c.instructions !== 'string') errors.push(`Cocktail ${i}: missing instructions`);
        if (!Array.isArray(c?.ingredients)) errors.push(`Cocktail ${i}: ingredients must be array`);
        if (!Array.isArray(c?.venues)) errors.push(`Cocktail ${i}: venues must be array`);
      });
    }

    const actualVenues = Array.isArray(data.venues) ? data.venues.length : 0;
    const actualCocktails = Array.isArray(data.customCocktails) ? data.customCocktails.length : 0;
    const actualFavorites = Array.isArray(data.favorites) ? data.favorites.length : 0;

    return {
      isValid: errors.length === 0,
      version: data.metadata?.exportVersion || 'unknown',
      errors,
      warnings,
      totalVenues: actualVenues,
      totalCustomCocktails: actualCocktails,
      totalFavorites: actualFavorites,
    };
  }

  static applyImport(
    importData: BarVibezExport,
    userData: UserData,
    existingCocktails: UserCocktail[]
  ): { updatedUserData: UserData; result: ImportResult } {
    const result: ImportResult = {
      success: false,
      favorites: { imported: 0, skipped: 0 },
      venues: { imported: 0, merged: 0 },
      customCocktails: { imported: 0, skipped: 0 },
      errors: [],
    };

    try {
      let updatedUserData: UserData = {
        ...userData,
        favorites: [...userData.favorites],
        venues: userData.venues.map(v => ({
          ...v,
          ingredients: [...v.ingredients],
          cocktailIds: [...v.cocktailIds],
          customCocktailIds: [...v.customCocktailIds],
        })),
        customCocktails: [...userData.customCocktails],
        updatedAt: new Date().toISOString(),
      };

      // 1. Favourites
      for (const favId of importData.favorites) {
        if (!updatedUserData.favorites.includes(favId)) {
          updatedUserData.favorites.push(favId);
          result.favorites.imported++;
        } else {
          result.favorites.skipped++;
        }
      }

      // 2. Custom cocktails — build old-ID → new-ID map
      const existingCocktailNames = new Set(existingCocktails.map(c => c.name.toLowerCase().trim()));
      const cocktailIdMap = new Map<string, string>();
      const newCocktailEntries: UserCocktail[] = [];

      for (const importedCocktail of importData.customCocktails) {
        const nameLower = importedCocktail.name.toLowerCase().trim();
        if (existingCocktailNames.has(nameLower)) {
          result.customCocktails.skipped++;
          // Find the actual existing cocktail's ID (may differ from imported ID)
          const existingMatch = existingCocktails.find(c => c.name.toLowerCase().trim() === nameLower);
          cocktailIdMap.set(importedCocktail.id, existingMatch ? existingMatch.id : importedCocktail.id);
          continue;
        }

        const newId = `user_cocktail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        cocktailIdMap.set(importedCocktail.id, newId);
        existingCocktailNames.add(nameLower);

        const newCocktail: UserCocktail = {
          id: newId,
          name: importedCocktail.name,
          glass: importedCocktail.glass,
          instructions: importedCocktail.instructions,
          ingredients: importedCocktail.ingredients.map(ing => ({ name: ing.name, measure: ing.measure })),
          venues: [],
          isUserCreated: true,
          createdAt: importedCocktail.createdAt,
          updatedAt: new Date().toISOString(),
        };

        newCocktailEntries.push(newCocktail);
        updatedUserData.customCocktails.push(newId);
        result.customCocktails.imported++;
      }

      // 3. Venues
      const venueIdMap = new Map<string, string>();

      for (const importedVenue of importData.venues) {
        if ((importedVenue as any).isDefault) continue;

        const existingIdx = updatedUserData.venues.findIndex(
          v => v.name.toLowerCase().trim() === importedVenue.name.toLowerCase().trim()
        );

        if (existingIdx >= 0) {
          const existing = updatedUserData.venues[existingIdx];
          venueIdMap.set(importedVenue.id, existing.id);

          const existingIngLower = new Set(existing.ingredients.map(i => i.toLowerCase()));
          for (const ing of importedVenue.ingredients) {
            if (!existingIngLower.has(ing.toLowerCase())) {
              existing.ingredients.push(ing);
              existingIngLower.add(ing.toLowerCase());
            }
          }
          const existingCocktailIdSet = new Set(existing.cocktailIds);
          for (const cId of importedVenue.cocktailIds) {
            if (!existingCocktailIdSet.has(cId)) {
              existing.cocktailIds.push(cId);
              existingCocktailIdSet.add(cId);
            }
          }
          // Merge customCocktailIds (remapped through cocktailIdMap)
          const existingCustomIdSet = new Set(existing.customCocktailIds);
          for (const cId of importedVenue.customCocktailIds) {
            const mappedId = cocktailIdMap.get(cId) || cId;
            if (!existingCustomIdSet.has(mappedId)) {
              existing.customCocktailIds.push(mappedId);
              existingCustomIdSet.add(mappedId);
            }
          }
          existing.updatedAt = new Date().toISOString();
          result.venues.merged++;
        } else {
          const newVenueId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          venueIdMap.set(importedVenue.id, newVenueId);

          // Remap customCocktailIds through cocktailIdMap
          const remappedCustomIds = importedVenue.customCocktailIds
            .map(cId => cocktailIdMap.get(cId) || cId)
            .filter((id, idx, arr) => arr.indexOf(id) === idx); // dedupe

          const newVenue: Venue = {
            id: newVenueId,
            name: importedVenue.name,
            ingredients: [...importedVenue.ingredients],
            cocktailIds: [...importedVenue.cocktailIds],
            customCocktailIds: remappedCustomIds,
            createdAt: importedVenue.createdAt,
            updatedAt: new Date().toISOString(),
          };
          updatedUserData.venues.push(newVenue);
          result.venues.imported++;
        }
      }

      // 4. Remap venue refs on new cocktails & write to MMKV
      for (const newCocktail of newCocktailEntries) {
        const importedCocktail = importData.customCocktails.find(
          c => cocktailIdMap.get(c.id) === newCocktail.id
        );
        if (!importedCocktail) continue;

        const remappedVenueIds: string[] = [];
        for (const originalVenueId of importedCocktail.venues) {
          const mappedId = venueIdMap.get(originalVenueId);
          if (mappedId) {
            remappedVenueIds.push(mappedId);
            const venueIdx = updatedUserData.venues.findIndex(v => v.id === mappedId);
            if (venueIdx >= 0 && !updatedUserData.venues[venueIdx].customCocktailIds.includes(newCocktail.id)) {
              updatedUserData.venues[venueIdx].customCocktailIds.push(newCocktail.id);
            }
          }
        }

        const defaultVenue = updatedUserData.venues.find(v => v.isDefault);
        if (defaultVenue && !remappedVenueIds.includes(defaultVenue.id)) {
          remappedVenueIds.unshift(defaultVenue.id);
          if (!defaultVenue.customCocktailIds.includes(newCocktail.id)) {
            defaultVenue.customCocktailIds.push(newCocktail.id);
          }
        }

        newCocktail.venues = remappedVenueIds;
        UserStorage.saveUserCocktail(newCocktail);
      }

      // 5. Update venue refs on skipped (duplicate) cocktails
      for (const importedCocktail of importData.customCocktails) {
        const mappedCocktailId = cocktailIdMap.get(importedCocktail.id);
        if (!mappedCocktailId) continue;
        // Skip cocktails that were newly created (already handled in step 4)
        if (newCocktailEntries.some(c => c.id === mappedCocktailId)) continue;

        // This is a skipped/duplicate cocktail — update its venue associations
        const existingCocktail = UserStorage.getUserCocktail(mappedCocktailId);
        if (!existingCocktail) continue;

        let venuesChanged = false;
        for (const originalVenueId of importedCocktail.venues) {
          const mappedVenueId = venueIdMap.get(originalVenueId);
          if (mappedVenueId && !existingCocktail.venues.includes(mappedVenueId)) {
            existingCocktail.venues.push(mappedVenueId);
            venuesChanged = true;
          }
        }

        // Also ensure the cocktail is in the default venue
        const defaultVenue = updatedUserData.venues.find(v => v.isDefault);
        if (defaultVenue && !existingCocktail.venues.includes(defaultVenue.id)) {
          existingCocktail.venues.unshift(defaultVenue.id);
          venuesChanged = true;
          if (!defaultVenue.customCocktailIds.includes(mappedCocktailId)) {
            defaultVenue.customCocktailIds.push(mappedCocktailId);
          }
        }

        if (venuesChanged) {
          UserStorage.saveUserCocktail(existingCocktail);
        }
      }

      result.success = result.errors.length === 0;
      return { updatedUserData, result };
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown processing error');
      return { updatedUserData: userData, result };
    }
  }
}
