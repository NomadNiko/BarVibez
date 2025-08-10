import { Image } from 'expo-image';
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
      console.log('Starting image cache initialization...');
      const startTime = Date.now();

      // Get all image sources and validate them
      const cocktailImages = Object.values(cocktailImageMap).filter(imageSource => 
        imageSource !== null && imageSource !== undefined && typeof imageSource === 'number'
      );
      const glassImages = getAllGlassImages().filter(imageSource => 
        imageSource !== null && imageSource !== undefined && typeof imageSource === 'number'
      );
      
      const totalImages = cocktailImages.length + glassImages.length;
      console.log(`Caching ${totalImages} images (${cocktailImages.length} cocktails, ${glassImages.length} glasses)...`);

      try {
        // Use Asset.loadAsync for batch loading of require() assets
        // This is more efficient and reliable than Image.prefetch for local assets
        const allAssets = [...cocktailImages, ...glassImages];
        
        // Load assets in chunks to prevent memory issues
        const CHUNK_SIZE = 100;
        let loadedCount = 0;
        
        for (let i = 0; i < allAssets.length; i += CHUNK_SIZE) {
          const chunk = allAssets.slice(i, i + CHUNK_SIZE);
          try {
            await Asset.loadAsync(chunk);
            loadedCount += chunk.length;
          } catch (chunkError) {
            console.warn(`Failed to load image chunk ${Math.floor(i/CHUNK_SIZE) + 1}`);
            // Continue with other chunks even if one fails
          }
          
          // Small delay between chunks
          if (i + CHUNK_SIZE < allAssets.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        const elapsedTime = Date.now() - startTime;
        console.log(`Image caching completed in ${elapsedTime}ms`);
        console.log(`Successfully cached: ${loadedCount}/${totalImages} images`);
        
        if (loadedCount < totalImages * 0.8) {
          console.warn(`Warning: Only ${loadedCount} of ${totalImages} images were cached`);
        }
        
      } catch (assetError) {
        console.warn('Asset loading failed, falling back to Image.prefetch');
        
        // Fallback to Image.prefetch but with better error handling
        const prefetchPromises = [...cocktailImages, ...glassImages].map(imageSource => 
          Image.prefetch(imageSource).catch(() => false)
        );
        
        const results = await Promise.all(prefetchPromises);
        const successCount = results.filter(Boolean).length;
        
        console.log(`Fallback prefetch completed: ${successCount}/${totalImages} images cached`);
      }

      this.isPreloaded = true;
      this.preloadPromise = null;
    } catch (error) {
      console.error('Error during image preload:', error);
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