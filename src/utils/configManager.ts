import { useAppearanceStore } from '../stores/appearanceStore';
import { useAudioStore } from '../stores/audioStore';
import { useLyricStore } from '../stores/lyricStore';
import { useStorageStore, StorageManager } from '../stores/storageStore';
import { useTypographyStore } from '../stores/typographyStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Global configuration manager for the lyric web application
 * Provides centralized reset functionality and configuration management
 */
export class ConfigManager {
  /**
   * Perform a complete application reset
   * This will:
   * - Reset all store data to defaults
   * - Clear all localStorage data
   * - Remove custom uploaded fonts and audio files
   * - Remove injected CSS styles
   * - Close all modals
   */
  static async resetAll(): Promise<void> {
    try {
      console.log('🔄 Starting complete application reset...');

      // 1. Close all modals first
      const uiStore = useUIStore.getState();
      uiStore.closeAllModals();

      // 2. Stop any playing audio
      const audioStore = useAudioStore.getState();
      audioStore.setIsPlaying(false);

      // 3. Remove injected font styles from DOM
      const existingFontStyles = document.querySelectorAll('style[data-font-family]');
      existingFontStyles.forEach(style => style.remove());

      // 4. Reset all stores (this will also clear their storage)
      const stores = [
        useAppearanceStore.getState(),
        useAudioStore.getState(), 
        useLyricStore.getState(),
        useTypographyStore.getState(),
        useUIStore.getState()
      ];

      // Call resetAll on each store
      for (const store of stores) {
        if ('resetAll' in store && typeof store.resetAll === 'function') {
          store.resetAll();
        }
      }

      // 5. Clear all localStorage data as a final cleanup
      const storageStore = useStorageStore.getState();
      storageStore.clearStorage(); // Clear all storage

      // 6. Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('✅ Complete application reset finished');
      
      // Notify user
      alert('Application has been completely reset to defaults. All custom settings, fonts, audio files, and lyrics have been cleared.');

    } catch (error) {
      console.error('❌ Error during application reset:', error);
      alert('There was an error resetting the application. Please refresh the page.');
    }
  }

  /**
   * Reset only appearance settings (colors, backgrounds, effects)
   */
  static resetAppearance(): void {
    const appearanceStore = useAppearanceStore.getState();
    if ('resetAll' in appearanceStore && typeof appearanceStore.resetAll === 'function') {
      appearanceStore.resetAll();
    }
  }

  /**
   * Reset only typography settings (fonts, sizes, weights)
   */
  static resetTypography(): void {
    const typographyStore = useTypographyStore.getState();
    if ('resetAll' in typographyStore && typeof typographyStore.resetAll === 'function') {
      typographyStore.resetAll();
    }
    
    // Also remove injected font styles
    const existingFontStyles = document.querySelectorAll('style[data-font-family]');
    existingFontStyles.forEach(style => style.remove());
  }

  /**
   * Reset only audio settings and clear uploaded audio
   */
  static resetAudio(): void {
    const audioStore = useAudioStore.getState();
    if ('resetAll' in audioStore && typeof audioStore.resetAll === 'function') {
      audioStore.resetAll();
    }
  }

  /**
   * Reset only lyric settings and clear uploaded lyrics
   */
  static resetLyrics(): void {
    const lyricStore = useLyricStore.getState();
    if ('resetAll' in lyricStore && typeof lyricStore.resetAll === 'function') {
      lyricStore.resetAll();
    }
  }

  /**
   * Get current storage usage information
   */
  static getStorageInfo(): {
    totalUsed: number;
    available: number;
    maxSize: number;
    usagePercentage: number;
  } {
    const storageStore = useStorageStore.getState();
    const totalUsed = storageStore.getStorageSize();
    const maxSize = StorageManager.getMaxStorageSize();
    const available = maxSize - totalUsed;
    const usagePercentage = (totalUsed / maxSize) * 100;

    return {
      totalUsed,
      available,
      maxSize,
      usagePercentage
    };
  }

  /**
   * Export all current settings as JSON
   */
  static exportSettings(): string {
    const settings = {
      appearance: useAppearanceStore.getState(),
      audio: useAudioStore.getState(),
      lyrics: useLyricStore.getState(),
      typography: useTypographyStore.getState(),
      ui: useUIStore.getState(),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(settings, null, 2);
  }

  /**
   * Check if the application has any custom data that would be lost on reset
   */
  static hasCustomData(): boolean {
    const audioStore = useAudioStore.getState();
    const lyricStore = useLyricStore.getState();
    const typographyStore = useTypographyStore.getState();

    return !!(
      audioStore.audioFileData || 
      lyricStore.customLyricData || 
      typographyStore.customFontData
    );
  }
}