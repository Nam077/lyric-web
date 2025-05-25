import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { clamp, toNumber, isString } from 'lodash';
import { useStorageStore, StorageManager } from './storageStore';

interface CustomFontData {
  base64: string;
  fontFamily: string;
  fileName: string;
  size: number;
}

interface TypographyState {
  fontFamily: string;
  fontSize: number; // em units
  letterSpacing: number; // em units
  lineHeight: number; // ratio
  textCase: 'uppercase' | 'lowercase' | 'normal';
  customFontData: CustomFontData | null; // Store uploaded font data
  
  // Actions
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setLetterSpacing: (letterSpacing: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setTextCase: (textCase: 'normal' | 'uppercase' | 'lowercase') => void;
  loadFontFromFile: (file: File) => Promise<boolean>;
  resetTypography: () => void;
  resetAll: () => void; // Complete reset including storage and CSS
  loadFromStorage: () => void;
}

const defaultTypography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 4,
  letterSpacing: 0.2,
  lineHeight: 1.2,
  textCase: 'normal' as const,
  customFontData: null
};

export const useTypographyStore = create<TypographyState>()(
  subscribeWithSelector((set, get) => ({
    ...defaultTypography,

    setFontFamily: (fontFamily) => {
      if (isString(fontFamily)) {
        set({ fontFamily });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('typography', { ...get(), fontFamily });
        }
      }
    },

    setFontSize: (fontSize) => {
      const safeSize = clamp(toNumber(fontSize), 0.5, 10);
      set({ fontSize: safeSize });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('typography', { ...get(), fontSize: safeSize });
      }
    },

    setLetterSpacing: (letterSpacing) => {
      const safeSpacing = clamp(toNumber(letterSpacing), -0.5, 2);
      set({ letterSpacing: safeSpacing });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('typography', { ...get(), letterSpacing: safeSpacing });
      }
    },

    setLineHeight: (lineHeight) => {
      const safeHeight = clamp(toNumber(lineHeight), 0.5, 3);
      set({ lineHeight: safeHeight });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('typography', { ...get(), lineHeight: safeHeight });
      }
    },

    setTextCase: (textCase) => {
      const validCases = ['normal', 'uppercase', 'lowercase'];
      if (validCases.includes(textCase)) {
        set({ textCase });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('typography', { ...get(), textCase });
        }
      }
    },

    /**
     * Load font file and convert to base64 for storage
     */
    loadFontFromFile: async (file: File): Promise<boolean> => {
      try {
        console.log(`Loading font file: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        
        // Validate font file type
        const validTypes = [
          'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
          'application/font-sfnt', 'application/x-font-ttf', 'application/x-font-otf'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
          console.warn('Invalid font file type:', file.type);
          return false;
        }

        // Check available storage space
        const availableSpace = StorageManager.getAvailableSpace();
        const estimatedSize = file.size * 1.37; // Base64 overhead ~37%
        
        if (estimatedSize > availableSpace) {
          console.warn(`Font file too large: ${(estimatedSize / 1024).toFixed(2)}KB, available: ${(availableSpace / 1024).toFixed(2)}KB`);
          return false;
        }

        // Convert font to base64
        const base64 = await StorageManager.fileToBase64(file);
        
        // Extract font family name from filename
        const fontFamily = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        
        // Create font data object
        const fontData: CustomFontData = {
          base64,
          fontFamily,
          fileName: file.name,
          size: file.size
        };

        // Create CSS font-face rule and inject it
        const fontFormat = file.name.toLowerCase().includes('.woff2') ? 'woff2' :
                          file.name.toLowerCase().includes('.woff') ? 'woff' :
                          file.name.toLowerCase().includes('.otf') ? 'opentype' : 'truetype';

        const fontFaceCSS = `
          @font-face {
            font-family: '${fontFamily}';
            src: url('${base64}') format('${fontFormat}');
            font-display: swap;
          }
        `;

        // Remove existing custom font style if any
        const existingStyle = document.getElementById('custom-font-style');
        if (existingStyle) {
          existingStyle.remove();
        }

        // Inject new font style
        const styleElement = document.createElement('style');
        styleElement.id = 'custom-font-style';
        styleElement.textContent = fontFaceCSS;
        document.head.appendChild(styleElement);

        // Update store
        set({
          customFontData: fontData,
          fontFamily: fontFamily
        });

        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('typography', {
            ...get(),
            customFontData: fontData,
            fontFamily: fontFamily
          });
        }

        console.log(`Font loaded and applied: ${fontFamily}`);
        return true;
      } catch (error) {
        console.error('Failed to load font file:', error);
        return false;
      }
    },

    resetTypography: () => {
      // Remove custom font style
      const existingStyle = document.getElementById('custom-font-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      set(defaultTypography);
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('typography', defaultTypography);
      }
    },

    resetAll: () => {
      // Remove custom font style
      const existingStyle = document.getElementById('custom-font-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Reset to default typography
      set(defaultTypography);

      // Clear storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.clearStorage('typography');
      }

      console.log('Typography reset to default values and storage cleared');
    },

    loadFromStorage: () => {
      const storageStore = useStorageStore.getState();
      const savedData = storageStore.loadFromStorage('typography');
      if (savedData) {
        // If we have stored font data, recreate the font-face CSS
        if (savedData.customFontData?.base64) {
          try {
            const { base64, fontFamily, fileName } = savedData.customFontData;
            
            const fontFormat = fileName.toLowerCase().includes('.woff2') ? 'woff2' :
                              fileName.toLowerCase().includes('.woff') ? 'woff' :
                              fileName.toLowerCase().includes('.otf') ? 'opentype' : 'truetype';

            const fontFaceCSS = `
              @font-face {
                font-family: '${fontFamily}';
                src: url('${base64}') format('${fontFormat}');
                font-display: swap;
              }
            `;

            // Remove existing custom font style if any
            const existingStyle = document.getElementById('custom-font-style');
            if (existingStyle) {
              existingStyle.remove();
            }

            // Inject font style
            const styleElement = document.createElement('style');
            styleElement.id = 'custom-font-style';
            styleElement.textContent = fontFaceCSS;
            document.head.appendChild(styleElement);

            console.log(`Restored custom font: ${fontFamily}`);
          } catch (error) {
            console.warn('Failed to restore custom font from storage:', error);
            // Remove corrupted font data
            savedData.customFontData = null;
            savedData.fontFamily = defaultTypography.fontFamily;
          }
        }
        set(savedData);
      }
    }
  }))
);