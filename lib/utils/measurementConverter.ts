import { MeasurementSystem } from '../types/user';

/**
 * Converts measurements between oz/tablespoons and ml
 * Provides clean, bartender-friendly conversions
 */
export class MeasurementConverter {
  
  /**
   * Convert a measurement string from oz/tablespoons/teaspoons/cups to ml or keep as-is
   */
  static convertMeasurement(originalMeasure: string, targetSystem: MeasurementSystem): string {
    if (!originalMeasure || targetSystem === 'oz') {
      return originalMeasure; // Return original if no conversion needed
    }

    // Handle different measurement patterns
    const ozPattern = /(\d+(?:\.\d+)?)\s*(?:ounces?|oz)\b/i;
    const cupPattern = /(\d+(?:\.\d+)?)\s*(?:cups?)\b/i;
    const tablespoonPattern = /(\d+(?:\.\d+)?)\s*(?:tablespoons?|tbsp|tblsp)\b/i;
    const teaspoonPattern = /(\d+(?:\.\d+)?)\s*(?:teaspoons?|tsp)\b/i;
    
    let convertedMeasure = originalMeasure;

    // Convert cups to ml (do this before oz since cups are larger)
    const cupMatch = originalMeasure.match(cupPattern);
    if (cupMatch) {
      const cupValue = parseFloat(cupMatch[1]);
      const mlValue = this.cupToMl(cupValue);
      const mlText = mlValue === Math.floor(mlValue) ? `${mlValue}` : `${mlValue}`;
      convertedMeasure = convertedMeasure.replace(cupPattern, `${mlText} ml`);
    }

    // Convert ounces to ml
    const ozMatch = convertedMeasure.match(ozPattern);
    if (ozMatch) {
      const ozValue = parseFloat(ozMatch[1]);
      const mlValue = this.ozToMl(ozValue);
      const mlText = mlValue === Math.floor(mlValue) ? `${mlValue}` : `${mlValue}`;
      convertedMeasure = convertedMeasure.replace(ozPattern, `${mlText} ml`);
    }

    // Convert tablespoons to ml
    const tablespoonMatch = convertedMeasure.match(tablespoonPattern);
    if (tablespoonMatch) {
      const tablespoonValue = parseFloat(tablespoonMatch[1]);
      const mlValue = this.tablespoonToMl(tablespoonValue);
      const mlText = mlValue === Math.floor(mlValue) ? `${mlValue}` : `${mlValue}`;
      convertedMeasure = convertedMeasure.replace(tablespoonPattern, `${mlText} ml`);
    }

    // Convert teaspoons to ml
    const teaspoonMatch = convertedMeasure.match(teaspoonPattern);
    if (teaspoonMatch) {
      const teaspoonValue = parseFloat(teaspoonMatch[1]);
      const mlValue = this.teaspoonToMl(teaspoonValue);
      const mlText = mlValue === Math.floor(mlValue) ? `${mlValue}` : `${mlValue}`;
      convertedMeasure = convertedMeasure.replace(teaspoonPattern, `${mlText} ml`);
    }

    return convertedMeasure;
  }

  /**
   * Convert ounces to ml with clean fraction handling
   * Uses bartender-friendly conversions
   */
  private static ozToMl(oz: number): number {
    // Handle clean fractions first for better presentation
    const roundedOz = Math.round(oz * 100) / 100; // Round to 2 decimal places
    
    // Clean thirds and quarters
    if (Math.abs(roundedOz - 0.33) < 0.01 || Math.abs(roundedOz - 1/3) < 0.01) return 10;
    if (Math.abs(roundedOz - 0.66) < 0.01 || Math.abs(roundedOz - 2/3) < 0.01) return 20;
    if (Math.abs(roundedOz - 0.25) < 0.01 || Math.abs(roundedOz - 1/4) < 0.01) return 7.5;
    if (Math.abs(roundedOz - 0.75) < 0.01 || Math.abs(roundedOz - 3/4) < 0.01) return 22.5;
    
    // Common clean conversions
    if (roundedOz === 0.5) return 15;
    if (roundedOz === 1) return 30;
    if (roundedOz === 1.5) return 45;
    if (roundedOz === 2) return 60;
    if (roundedOz === 2.5) return 75;
    if (roundedOz === 3) return 90;
    
    // Standard conversion for other values (1 oz = 30ml)
    const mlValue = roundedOz * 30;
    
    // Round to reasonable precision
    if (mlValue < 10) {
      return Math.round(mlValue * 2) / 2; // Round to nearest 0.5ml for small amounts
    } else {
      return Math.round(mlValue); // Round to nearest ml for larger amounts
    }
  }

  /**
   * Convert tablespoons to ml
   * 1 tablespoon = 15ml (standard)
   */
  private static tablespoonToMl(tablespoons: number): number {
    const mlValue = tablespoons * 15;
    
    // Round to nearest ml for tablespoon conversions
    return Math.round(mlValue);
  }

  /**
   * Convert teaspoons to ml
   * 1 teaspoon = 5ml (standard)
   */
  private static teaspoonToMl(teaspoons: number): number {
    const mlValue = teaspoons * 5;
    
    // Round to nearest ml for teaspoon conversions
    return Math.round(mlValue);
  }

  /**
   * Convert cups to ml
   * 1 cup = 237ml (US standard)
   */
  private static cupToMl(cups: number): number {
    const mlValue = cups * 237;
    
    // Round to nearest ml for cup conversions
    return Math.round(mlValue);
  }

  /**
   * Convert ingredient measure for display
   * This is the main function to be used in components
   */
  static convertIngredientMeasure(measure: string | undefined, targetSystem: MeasurementSystem): string {
    if (!measure) return '';
    
    return this.convertMeasurement(measure, targetSystem);
  }

  /**
   * Detect if a measurement string contains convertible units
   */
  static hasConvertibleUnits(measure: string): boolean {
    if (!measure) return false;
    
    const ozPattern = /\d+(?:\.\d+)?\s*(?:ounces?|oz)\b/i;
    const cupPattern = /\d+(?:\.\d+)?\s*(?:cups?)\b/i;
    const tablespoonPattern = /\d+(?:\.\d+)?\s*(?:tablespoons?|tbsp|tblsp)\b/i;
    const teaspoonPattern = /\d+(?:\.\d+)?\s*(?:teaspoons?|tsp)\b/i;
    
    return ozPattern.test(measure) || cupPattern.test(measure) || tablespoonPattern.test(measure) || teaspoonPattern.test(measure);
  }

  /**
   * Get conversion info for debugging
   */
  static getConversionInfo(originalMeasure: string): {
    original: string;
    hasOz: boolean;
    hasCup: boolean;
    hasTablespoon: boolean;
    hasTeaspoon: boolean;
    ozConverted?: string;
    cupConverted?: string;
    tablespoonConverted?: string;
    teaspoonConverted?: string;
  } {
    const ozPattern = /(\d+(?:\.\d+)?)\s*(?:ounces?|oz)\b/i;
    const cupPattern = /(\d+(?:\.\d+)?)\s*(?:cups?)\b/i;
    const tablespoonPattern = /(\d+(?:\.\d+)?)\s*(?:tablespoons?|tbsp|tblsp)\b/i;
    const teaspoonPattern = /(\d+(?:\.\d+)?)\s*(?:teaspoons?|tsp)\b/i;
    
    const ozMatch = originalMeasure.match(ozPattern);
    const cupMatch = originalMeasure.match(cupPattern);
    const tablespoonMatch = originalMeasure.match(tablespoonPattern);
    const teaspoonMatch = originalMeasure.match(teaspoonPattern);
    
    const info: any = {
      original: originalMeasure,
      hasOz: !!ozMatch,
      hasCup: !!cupMatch,
      hasTablespoon: !!tablespoonMatch,
      hasTeaspoon: !!teaspoonMatch,
    };
    
    if (ozMatch) {
      const ozValue = parseFloat(ozMatch[1]);
      const mlValue = this.ozToMl(ozValue);
      info.ozConverted = `${mlValue} ml`;
    }
    
    if (cupMatch) {
      const cupValue = parseFloat(cupMatch[1]);
      const mlValue = this.cupToMl(cupValue);
      info.cupConverted = `${mlValue} ml`;
    }
    
    if (tablespoonMatch) {
      const tablespoonValue = parseFloat(tablespoonMatch[1]);
      const mlValue = this.tablespoonToMl(tablespoonValue);
      info.tablespoonConverted = `${mlValue} ml`;
    }
    
    if (teaspoonMatch) {
      const teaspoonValue = parseFloat(teaspoonMatch[1]);
      const mlValue = this.teaspoonToMl(teaspoonValue);
      info.teaspoonConverted = `${mlValue} ml`;
    }
    
    return info;
  }
}