export const EXPORT_VERSION = '1.0';
export const SUPPORTED_EXPORT_VERSIONS = ['1.0'];
export const MAX_FILE_SIZE_MB = 10;

export interface BarVibezExportMetadata {
  exportVersion: string;
  exportDate: string;
  exportedBy: string;
  appVersion: string;
  totalVenues: number;
  totalCustomCocktails: number;
  totalFavorites: number;
}

export interface ExportVenue {
  id: string;
  name: string;
  ingredients: string[];
  cocktailIds: string[];
  customCocktailIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportUserCocktail {
  id: string;
  name: string;
  glass: string;
  instructions: string;
  ingredients: { name: string; measure?: string }[];
  venues: string[];
  isUserCreated: true;
  createdAt: string;
  updatedAt: string;
}

export interface BarVibezExport {
  metadata: BarVibezExportMetadata;
  favorites: string[];
  venues: ExportVenue[];
  customCocktails: ExportUserCocktail[];
}

export interface ExportValidation {
  isValid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
  totalVenues: number;
  totalCustomCocktails: number;
  totalFavorites: number;
}

export interface ImportResult {
  success: boolean;
  favorites: { imported: number; skipped: number };
  venues: { imported: number; merged: number };
  customCocktails: { imported: number; skipped: number };
  errors: string[];
}
