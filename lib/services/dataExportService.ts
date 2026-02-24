import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { BarVibezExport, ExportVenue, ExportUserCocktail, EXPORT_VERSION } from '../types/export';
import { UserData, Venue } from '../types/user';
import { Cocktail, UserCocktail } from '../types/cocktail';
import { APP_CONFIG } from '../../config/app';

/** Sanitise a string to be safe as a filename component. */
function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 60);
}

export class DataExportService {
  // ── Full export ─────────────────────────────────────────────────────────────

  static buildExportData(userData: UserData, allUserCocktails: UserCocktail[]): BarVibezExport {
    const exportVenues: ExportVenue[] = (userData.venues || [])
      .filter(v => !v.isDefault)
      .map(v => ({
        id: v.id,
        name: v.name,
        ingredients: [...v.ingredients],
        cocktailIds: [...v.cocktailIds],
        customCocktailIds: [...v.customCocktailIds],
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }));

    const exportCocktails: ExportUserCocktail[] = allUserCocktails.map(c => ({
      id: c.id,
      name: c.name,
      glass: c.glass,
      instructions: c.instructions,
      ingredients: c.ingredients.map(ing => ({ name: ing.name, measure: ing.measure })),
      venues: [...c.venues],
      isUserCreated: true,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      metadata: {
        exportVersion: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        exportedBy: 'BarVibez',
        appVersion: APP_CONFIG.version,
        totalVenues: exportVenues.length,
        totalCustomCocktails: exportCocktails.length,
        totalFavorites: userData.favorites.length,
      },
      favorites: [...userData.favorites],
      venues: exportVenues,
      customCocktails: exportCocktails,
    };
  }

  static async exportToFile(exportData: BarVibezExport): Promise<string> {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `barvibez-export-${dateStr}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`Export written to: ${fileUri}`);
    return fileUri;
  }

  static async shareExportFile(fileUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Share BarVibez Data',
      UTI: 'public.json',
    });
  }

  // ── Single custom-cocktail export ────────────────────────────────────────────

  static buildSingleCocktailExport(cocktail: UserCocktail): BarVibezExport {
    const exportCocktail: ExportUserCocktail = {
      id: cocktail.id,
      name: cocktail.name,
      glass: cocktail.glass,
      instructions: cocktail.instructions,
      ingredients: cocktail.ingredients.map(ing => ({ name: ing.name, measure: ing.measure })),
      venues: [],        // strip venue refs — recipient won't have the same venue IDs
      isUserCreated: true,
      createdAt: cocktail.createdAt,
      updatedAt: cocktail.updatedAt,
    };

    return {
      metadata: {
        exportVersion: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        exportedBy: 'BarVibez',
        appVersion: APP_CONFIG.version,
        totalVenues: 0,
        totalCustomCocktails: 1,
        totalFavorites: 0,
      },
      favorites: [],
      venues: [],
      customCocktails: [exportCocktail],
    };
  }

  static async exportCocktailToFile(cocktail: UserCocktail): Promise<string> {
    const exportData = this.buildSingleCocktailExport(cocktail);
    const fileName = `barvibez-cocktail-${safeFileName(cocktail.name)}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`Cocktail export written to: ${fileUri}`);
    return fileUri;
  }

  // ── Venue export ─────────────────────────────────────────────────────────────

  static buildVenueExport(
    venue: Venue,
    userData: UserData,
    allUserCocktails: UserCocktail[]
  ): BarVibezExport {
    const exportVenue: ExportVenue = {
      id: venue.id,
      name: venue.name,
      ingredients: [...venue.ingredients],
      cocktailIds: [...venue.cocktailIds],
      customCocktailIds: [...venue.customCocktailIds],
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
    };

    // Include only the custom cocktails that belong to this venue
    const venueCocktails = allUserCocktails.filter(c => c.venues.includes(venue.id));
    const exportCocktails: ExportUserCocktail[] = venueCocktails.map(c => ({
      id: c.id,
      name: c.name,
      glass: c.glass,
      instructions: c.instructions,
      ingredients: c.ingredients.map(ing => ({ name: ing.name, measure: ing.measure })),
      venues: [venue.id],   // keep only this venue's ID; remapped on import
      isUserCreated: true,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      metadata: {
        exportVersion: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        exportedBy: 'BarVibez',
        appVersion: APP_CONFIG.version,
        totalVenues: 1,
        totalCustomCocktails: exportCocktails.length,
        totalFavorites: 0,
      },
      favorites: [],
      venues: [exportVenue],
      customCocktails: exportCocktails,
    };
  }

  static async exportVenueToFile(
    venue: Venue,
    userData: UserData,
    allUserCocktails: UserCocktail[]
  ): Promise<string> {
    const exportData = this.buildVenueExport(venue, userData, allUserCocktails);
    const fileName = `barvibez-venue-${safeFileName(venue.name)}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`Venue export written to: ${fileUri}`);
    return fileUri;
  }

  // ── Share recipe as plain text ────────────────────────────────────────────────
  // Works for BOTH regular (Cocktail) and custom (UserCocktail) cocktails.

  static buildRecipeText(cocktail: Cocktail | UserCocktail): string {
    const isUser = (cocktail as UserCocktail).isUserCreated === true;
    const instructions = isUser
      ? (cocktail as UserCocktail).instructions
      : (cocktail as Cocktail).instructions?.en || '';

    const ingredientLines = cocktail.ingredients
      .map(ing => {
        const measure = ing.measure ? `${ing.measure} ` : '';
        return `• ${measure}${ing.name}`;
      })
      .join('\n');

    return [
      `🍹 ${cocktail.name}`,
      `Glass: ${cocktail.glass}`,
      '',
      'Ingredients:',
      ingredientLines,
      '',
      'Instructions:',
      instructions,
      '',
      '— Shared via BarVibez',
    ].join('\n');
  }

  static async shareCocktailRecipe(cocktail: Cocktail | UserCocktail): Promise<void> {
    const message = this.buildRecipeText(cocktail);
    await Share.share({
      message,
      title: `${cocktail.name} Recipe`,
    });
  }
}
