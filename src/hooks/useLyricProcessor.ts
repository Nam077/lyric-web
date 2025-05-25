import { useMemo } from 'react';
import { useLyricStore } from '../stores/lyricStore';
import type { LyricLine } from '../utils/lyricParser';

/**
 * Custom hook for smart lyric processing with caching
 * Replaces manual calls to processLyricData, normalizeTiming, mergeSentenceWords
 * Automatically handles: Default JSON → Parse → Normalize → Merge → Cache
 */
export function useProcessedLyrics(): {
  lyrics: LyricLine[];
  isLoading: boolean;
  hasData: boolean;
  cacheStatus: 'fresh' | 'cached' | 'none';
} {
  const lyricStore = useLyricStore();

  const result = useMemo(() => {
    try {
      // Get processed lyrics from store (with smart caching)
      const processedLyrics = lyricStore.getProcessedLyrics();
      
      // Determine cache status
      const cacheStatus: 'fresh' | 'cached' | 'none' = 
        lyricStore.parsedCache 
          ? lyricStore.isCacheValid() 
            ? 'cached' 
            : 'fresh'
          : 'none';

      return {
        lyrics: processedLyrics,
        isLoading: false,
        hasData: processedLyrics.length > 0,
        cacheStatus
      };
    } catch (error) {
      console.error('Error in useProcessedLyrics:', error);
      return {
        lyrics: [],
        isLoading: false,
        hasData: false,
        cacheStatus: 'none' as const
      };
    }
  }, [lyricStore]);

  return result;
}

/**
 * Hook for loading lyric data from upload or API
 * Automatically processes and caches the data
 */
export function useLyricLoader() {
  const lyricStore = useLyricStore();

  const loadFromData = (data: any, fileName: string) => {
    lyricStore.loadLyricFromData(data, fileName);
  };

  const clearCache = () => {
    lyricStore.clearCache();
  };

  const resetToDefault = () => {
    lyricStore.setCurrentLyricData(null); // This will trigger default JSON loading
    lyricStore.clearCache();
  };

  return {
    loadFromData,
    clearCache,
    resetToDefault,
    hasCustomData: !!lyricStore.customLyricData,
    currentFileName: lyricStore.customLyricData?.fileName || 'default-lyric.json'
  };
}