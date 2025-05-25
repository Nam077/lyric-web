import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { clamp, toNumber } from 'lodash';
import { useStorageStore } from './storageStore';
import { parseLyricDataOptimized, normalizeTiming, mergeSentenceWords } from '../utils/lyricParser';
import lyricData from '../lyrics/lyric.json'; // Default lyric data
import type { LyricData, LyricLine } from '../utils/lyricParser';

interface CustomLyricData {
  data: LyricData;
  fileName: string;
  uploadDate: string;
}

interface ParsedLyricCache {
  originalData: LyricData;
  parsedLyrics: LyricLine[];
  processedLyrics: LyricLine[]; // After normalization and processing
  fileName: string;
  parseDate: string;
  lyricDelay: number; // Delay used when parsing
  mergeSentences: boolean; // Merge state when parsing
}

interface LyricState {
  currentLyricData: LyricData | null;
  lyricDelay: number; // in milliseconds
  mergeSentences: boolean;
  customLyricData: CustomLyricData | null; // Store uploaded lyric data
  parsedCache: ParsedLyricCache | null; // Cache for parsed lyrics
  
  // Actions
  setCurrentLyricData: (data: LyricData | null) => void;
  setLyricDelay: (delay: number) => void;
  setMergeSentences: (merge: boolean) => void;
  loadLyricFromData: (data: LyricData, fileName: string) => void;
  
  // Smart processing with cache
  getProcessedLyrics: () => LyricLine[];
  isCacheValid: () => boolean;
  clearCache: () => void;
  
  resetLyricSettings: () => void;
  resetAll: () => void; // Complete reset including storage and custom data
  loadFromStorage: () => void;
}

const defaultLyricSettings = {
  lyricDelay: 0,
  mergeSentences: false,
  customLyricData: null,
  parsedCache: null
};

export const useLyricStore = create<LyricState>()(
  subscribeWithSelector((set, get) => ({
    currentLyricData: null, // Will be initialized from default JSON
    ...defaultLyricSettings,

    setCurrentLyricData: (data) => {
      set({ currentLyricData: data, parsedCache: null }); // Clear cache when data changes
    },

    setLyricDelay: (delay) => {
      const safeDelay = clamp(toNumber(delay), -10000, 10000);
      set({ lyricDelay: safeDelay, parsedCache: null }); // Clear cache when settings change
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('lyric', { ...get(), lyricDelay: safeDelay });
      }
    },

    setMergeSentences: (merge) => {
      set({ mergeSentences: merge, parsedCache: null }); // Clear cache when settings change
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('lyric', { ...get(), mergeSentences: merge });
      }
    },

    /**
     * Load lyric data and save for persistence
     */
    loadLyricFromData: (data: LyricData, fileName: string) => {
      try {
        console.log(`📝 Loading lyric data from: ${fileName}`);
        
        // Create custom lyric data object
        const customData: CustomLyricData = {
          data,
          fileName,
          uploadDate: new Date().toISOString()
        };

        // Update store
        set({
          currentLyricData: data,
          customLyricData: customData,
          parsedCache: null // Clear cache when new data is loaded
        });

        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('lyric', {
            ...get(),
            customLyricData: customData
          });
        }

        console.log(`✅ Lyric data loaded and saved: ${fileName}`);
      } catch (error) {
        console.error('Failed to load lyric data:', error);
      }
    },

    /**
     * Smart lyric processor with caching - Main processing function
     * Handles: Default JSON → Parse → Normalize → Merge (if enabled) → Cache
     * Returns cached result if settings haven't changed
     */
    getProcessedLyrics: (): LyricLine[] => {
      const { currentLyricData, customLyricData, parsedCache, lyricDelay, mergeSentences } = get();
      
      // Step 1: Prioritize uploaded data, then current data, finally default JSON
      let dataToProcess = currentLyricData;
      
      // If no current data, check if we have uploaded custom data
      if (!dataToProcess && customLyricData?.data) {
        console.log('🔄 Using uploaded custom lyric data:', customLyricData.fileName);
        dataToProcess = customLyricData.data;
        get().setCurrentLyricData(dataToProcess);
      }
      
      // Only fallback to default if no custom data exists
      if (!dataToProcess) {
        console.log('🔄 No custom data found, using default JSON');
        dataToProcess = lyricData as LyricData;
        get().setCurrentLyricData(dataToProcess);
      }

      // Step 2: Check if we have valid cache
      if (parsedCache && get().isCacheValid()) {
        console.log('✅ Using cached processed lyrics');
        return parsedCache.processedLyrics;
      }

      // Step 3: Process lyrics (use parseLyricDataOptimized for LyricData format)
      console.log('🔄 Processing lyrics with settings:', { lyricDelay, mergeSentences });

      try {
        // Parse raw lyric data using the correct parser for LyricData format
        let processed = parseLyricDataOptimized(dataToProcess);
        
        if (!processed || processed.length === 0) {
          console.warn('No valid lyrics found after parsing');
          return [];
        }

        // Apply merge sentences if enabled (like App.tsx)
        if (mergeSentences) {
          processed = mergeSentenceWords(processed);
        }
        
        // Apply delay to normalized timing (like App.tsx)
        const withDelay = normalizeTiming(processed, lyricDelay);

        // Step 4: Cache the results
        const cache: ParsedLyricCache = {
          originalData: dataToProcess,
          parsedLyrics: parseLyricDataOptimized(dataToProcess), // Keep original parsed
          processedLyrics: withDelay, // Final processed result
          fileName: get().customLyricData?.fileName || 'default-lyric.json',
          parseDate: new Date().toISOString(),
          lyricDelay,
          mergeSentences
        };

        set({ parsedCache: cache });

        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('lyric', { ...get(), parsedCache: cache });
        }

        console.log('✅ Lyrics processed and cached successfully');
        return withDelay;

      } catch (error) {
        console.error('Failed to process lyrics:', error);
        return [];
      }
    },

    /**
     * Check if current cache is valid for current settings
     */
    isCacheValid: () => {
      const { parsedCache, currentLyricData, lyricDelay, mergeSentences } = get();
      
      if (!parsedCache || !currentLyricData) {
        return false;
      }

      // Check if settings match cached settings
      const settingsMatch = 
        parsedCache.lyricDelay === lyricDelay &&
        parsedCache.mergeSentences === mergeSentences;

      // Check if original data matches (simple reference check)
      const dataMatch = parsedCache.originalData === currentLyricData;

      return settingsMatch && dataMatch;
    },

    /**
     * Clear the parsed cache
     */
    clearCache: () => {
      set({ parsedCache: null });
    },

    resetLyricSettings: () => {
      set({
        lyricDelay: 0,
        mergeSentences: true,
      });
      
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('lyric', { ...get(), lyricDelay: 0, mergeSentences: true });
      }
    },

    resetAll: () => {
      // Reset all lyric state including custom data
      set({
        currentLyricData: null,
        lyricDelay: 0,
        mergeSentences: false,
        customLyricData: null,
        parsedCache: null,
      });
      
      // Clear from storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('lyric', {
          currentLyricData: null,
          lyricDelay: 0,
          mergeSentences: false ,
          customLyricData: null,
          parsedCache: null,
        });
      }
    },

    loadFromStorage: () => {
      const storageStore = useStorageStore.getState();
      const savedData = storageStore.loadFromStorage('lyric');
      if (savedData) {
        // If we have stored custom lyric data, restore it
        if (savedData.customLyricData?.data) {
          try {
            const { data, fileName } = savedData.customLyricData;
            set({
              ...savedData,
              currentLyricData: data
            });
            console.log(`🔄 Restored custom lyric data: ${fileName}`);
            
            // Check if we also have valid cached parsed data
            if (savedData.parsedCache) {
              console.log(`🔄 Restored parsed lyric cache: ${savedData.parsedCache.fileName}`);
            }
          } catch (error) {
            console.warn('Failed to restore custom lyric data from storage:', error);
            // Remove corrupted data and fall back to default
            set({
              ...savedData,
              customLyricData: null,
              parsedCache: null,
              currentLyricData: lyricData as LyricData
            });
          }
        } else {
          // No custom data, set default
          set({
            ...savedData,
            currentLyricData: lyricData as LyricData
          });
        }
      } else {
        // No saved data, initialize with default
        set({
          currentLyricData: lyricData as LyricData
        });
      }
    }
  }))
);