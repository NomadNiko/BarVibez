import { Asset } from 'expo-asset';
import { cocktailImageMap } from './cocktailImageMap';
import { getAllGlassImages } from './glassImageMap';

/**
 * Preload all cocktail and glass images to ensure they're cached
 * This runs during app initialization regardless of subscription status
 * to ensure smooth experience when users upgrade
 */
export class ImagePreloader {
  private static isPreloaded = false;
  private static preloadPromise: Promise<void> | null = null;

  /**
   * Preload all images (cocktails and glasses)
   * Returns a promise that resolves when all images are preloaded
   */
  static async preloadAllImages(): Promise<void> {
    // If already preloaded, return immediately
    if (this.isPreloaded) {
      console.log('Images already preloaded, skipping...');
      return;
    }

    // If preloading is in progress, return the existing promise
    if (this.preloadPromise) {
      console.log('Image preloading already in progress...');
      return this.preloadPromise;
    }

    // Start preloading
    this.preloadPromise = this.performPreload();
    return this.preloadPromise;
  }

  private static async performPreload(): Promise<void> {
    try {
      console.log('Starting Asset.loadAsync preloading...');
      const startTime = Date.now();

      // Get all image sources and validate them
      const cocktailImages = Object.values(cocktailImageMap).filter(imageSource => 
        imageSource !== null && imageSource !== undefined
      );
      const glassImages = getAllGlassImages().filter(imageSource => 
        imageSource !== null && imageSource !== undefined
      );
      
      const allImages = [...cocktailImages, ...glassImages];
      const totalImages = allImages.length;
      console.log(`Preloading ${totalImages} images using Asset.loadAsync (${cocktailImages.length} cocktails, ${glassImages.length} glasses)...`);

      // Use Asset.loadAsync for require() resources - this works with expo-image
      const CHUNK_SIZE = 20; // Smaller chunks for memory management
      let loadedCount = 0;
      
      for (let i = 0; i < allImages.length; i += CHUNK_SIZE) {
        const chunk = allImages.slice(i, i + CHUNK_SIZE);
        
        try {
          await Asset.loadAsync(chunk);
          loadedCount += chunk.length;
          console.log(`Chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(allImages.length/CHUNK_SIZE)}: ${chunk.length}/${chunk.length} images loaded`);
          
          // Small delay between chunks to prevent overwhelming the system
          if (i + CHUNK_SIZE < allImages.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (chunkError) {
          console.warn(`Chunk ${Math.floor(i/CHUNK_SIZE) + 1} failed:`, chunkError);
          // Try individual images in this chunk
          for (const imageSource of chunk) {
            try {
              await Asset.loadAsync([imageSource]);
              loadedCount++;
            } catch (individualError) {
              console.warn(`Failed to load individual image:`, individualError?.message || 'unknown error');
            }
          }
        }
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`Asset.loadAsync preloading completed in ${elapsedTime}ms`);
      console.log(`Successfully loaded: ${loadedCount}/${totalImages} images`);
      
      if (loadedCount < totalImages * 0.8) {
        console.warn(`Warning: Only ${loadedCount} of ${totalImages} images were successfully loaded`);
        console.warn('Images may load slowly in the UI. Check for corrupted image files.');
      } else {
        console.log('✅ Image preloading successful - images should load instantly in UI');
      }

      this.isPreloaded = true;
      this.preloadPromise = null;
    } catch (error) {
      console.error('Error during Asset.loadAsync preload:', error);
      this.preloadPromise = null;
      // Don't throw - continue app startup even if image preloading fails
    }
  }

  /**
   * Check if images have been preloaded
   */
  static areImagesPreloaded(): boolean {
    return this.isPreloaded;
  }

  /**
   * Reset preload state (useful for testing)
   */
  static reset(): void {
    this.isPreloaded = false;
    this.preloadPromise = null;
  }
}