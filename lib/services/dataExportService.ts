import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BarVibezExport, ExportVenue, ExportUserCocktail, EXPORT_VERSION } from '../types/export';
import { UserData } from '../types/user';
import { UserCocktail } from '../types/cocktail';
import { APP_CONFIG } from '../../config/app';

export class DataExportService {
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
}
