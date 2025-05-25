import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Storage configuration for each store
 */
interface StoreConfig {
  storeName: string;
  keys: string[];
  defaultValues?: Record<string, any>;
}

/**
 * Storage state interface
 */
interface StorageState {
  isInitialized: boolean;
  lastSyncTime: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  
  // Actions
  initializeStorage: () => Promise<void>;
  syncToStorage: (storeName: string, data: Record<string, any>) => void;
  loadFromStorage: (storeName: string) => Record<string, any> | null;
  clearStorage: (storeName?: string) => void;
  exportSettings: () => string;
  importSettings: (jsonString: string) => boolean;
  getStorageSize: () => number;
}

/**
 * Store configurations for each Zustand store
 */
const STORE_CONFIGS: StoreConfig[] = [
  {
    storeName: 'audio',
    keys: ['currentAudioUrl', 'currentSongInfo', 'audioFileData'],
    defaultValues: {
      currentAudioUrl: "/SOOBIN - DANCING IN THE DARK.mp3",
      currentSongInfo: {
        title: "DANCING IN THE DARK",
        artist: "SOOBIN"
      },
      audioFileData: null // Will store base64 data for uploaded files
    }
  },
  {
    storeName: 'appearance',
    keys: ['primaryColor', 'secondaryColor', 'textColor', 'textShadowColor'],
    defaultValues: {
      primaryColor: "#FFF9C4",
      secondaryColor: "#FFCC80",
      textColor: "#1E6D9A",
      textShadowColor: "#1565C0"
    }
  },
  {
    storeName: 'typography',
    keys: ['fontFamily', 'fontSize', 'letterSpacing', 'lineHeight', 'textCase', 'customFontData'],
    defaultValues: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 4,
      letterSpacing: 0.2,
      lineHeight: 1.2,
      textCase: 'normal',
      customFontData: null // Will store base64 font data
    }
  },
  {
    storeName: 'lyric',
    keys: ['lyricDelay', 'mergeSentences', 'customLyricData'],
    defaultValues: {
      lyricDelay: 0,
      mergeSentences: false,
      customLyricData: null // Will store uploaded lyric files
    }
  },
  {
    storeName: 'ui',
    keys: ['showUpload', 'showSettings'],
    defaultValues: {
      showUpload: false,
      showSettings: false
    }
  }
];

/**
 * Storage utility functions with error handling
 */
class StorageManager {
  private static readonly STORAGE_PREFIX = 'lyric-web-';
  private static readonly MAX_STORAGE_SIZE = 15 * 1024 * 1024; // Increased to 15MB for audio files

  /**
   * Safely get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`Failed to get localStorage item: ${key}`, error);
      return null;
    }
  }

  /**
   * Safely set item to localStorage with size check
   */
  static setItem(key: string, value: string): boolean {
    try {
      // Check if the data is too large
      const dataSize = new Blob([value]).size;
      const currentStorage = this.getStorageSize();
      const availableSpace = this.MAX_STORAGE_SIZE - currentStorage;
      
      if (dataSize > availableSpace) {
        console.warn(`Not enough storage space: Need ${(dataSize / 1024 / 1024).toFixed(2)}MB, Available: ${(availableSpace / 1024 / 1024).toFixed(2)}MB`);
        return false;
      }

      localStorage.setItem(this.STORAGE_PREFIX + key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item: ${key}`, error);
      return false;
    }
  }

  /**
   * Safely remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item: ${key}`, error);
      return false;
    }
  }

  /**
   * Get all storage keys for this app
   */
  static getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keys.push(key.replace(this.STORAGE_PREFIX, ''));
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to get localStorage keys', error);
      return [];
    }
  }

  /**
   * Calculate storage size in bytes
   */
  static getStorageSize(): number {
    try {
      let size = 0;
      const keys = this.getAllKeys();
      keys.forEach(key => {
        const value = this.getItem(key);
        if (value) {
          size += new Blob([key + value]).size;
        }
      });
      return size;
    } catch (error) {
      console.warn('Failed to calculate storage size', error);
      return 0;
    }
  }

  /**
   * Clear all app storage
   */
  static clearAll(): boolean {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Failed to clear storage', error);
      return false;
    }
  }

  /**
   * Convert file to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create blob URL from base64 data
   */
  static base64ToUrl(base64Data: string): string {
    try {
      // Extract mime type and data from base64 string
      const [header, data] = base64Data.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Convert base64 to blob
      const byteCharacters = atob(data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      
      const blob = new Blob(byteArrays, { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to convert base64 to URL:', error);
      throw error;
    }
  }

  /**
   * Check available storage space
   */
  static getAvailableSpace(): number {
    try {
      const used = this.getStorageSize();
      return Math.max(0, this.MAX_STORAGE_SIZE - used);
    } catch (error) {
      console.warn('Failed to calculate available space', error);
      return 0;
    }
  }

  /**
   * Get max storage limit
   */
  static getMaxStorageSize(): number {
    return this.MAX_STORAGE_SIZE;
  }

  /**
   * Format bytes to human readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Track last synced data to prevent unnecessary writes
 */
const lastSyncedData: Map<string, string> = new Map();

/**
 * Debounced sync function with duplicate prevention
 */
const debouncedSync = (() => {
  const timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  return (storeName: string, data: Record<string, any>) => {
    // Clear existing timeout for this store
    const existingTimeout = timeouts.get(storeName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      try {
        const serialized = JSON.stringify(data);
        const lastSynced = lastSyncedData.get(storeName);
        
        // Only sync if data has actually changed
        if (lastSynced !== serialized) {
          StorageManager.setItem(storeName, serialized);
          lastSyncedData.set(storeName, serialized);
          console.log(`Synced ${storeName} to localStorage`);
        }
      } catch (error) {
        console.warn(`Failed to sync ${storeName}:`, error);
      } finally {
        timeouts.delete(storeName);
      }
    }, 300);
    
    timeouts.set(storeName, timeout);
  };
})();

/**
 * Create the storage store with subscription middleware
 */
export const useStorageStore = create<StorageState>()(
  subscribeWithSelector((set, get) => ({
    isInitialized: false,
    lastSyncTime: 0,
    syncStatus: 'idle',

    /**
     * Initialize storage and load saved data for all stores
     */
    initializeStorage: async () => {
      try {
        set({ syncStatus: 'syncing' });
        
        // Check if localStorage is available
        if (typeof Storage === 'undefined') {
          console.warn('localStorage is not available');
          set({ isInitialized: true, syncStatus: 'error' });
          return;
        }

        // Pre-load all existing data into cache
        for (const config of STORE_CONFIGS) {
          const savedData = get().loadFromStorage(config.storeName);
          
          if (savedData && typeof savedData === 'object') {
            // Cache the current localStorage data
            const serialized = JSON.stringify(savedData);
            lastSyncedData.set(config.storeName, serialized);
            console.log(`Loaded ${config.storeName} data from storage`);
          }
        }

        set({ 
          isInitialized: true, 
          syncStatus: 'idle',
          lastSyncTime: Date.now()
        });

        console.log('Storage initialized successfully');
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        set({ isInitialized: true, syncStatus: 'error' });
      }
    },

    /**
     * Sync store data to localStorage with debouncing and duplicate prevention
     */
    syncToStorage: (storeName: string, data: Record<string, any>) => {
      if (!get().isInitialized) return;

      try {
        // Filter data to only include configured keys
        const config = STORE_CONFIGS.find(c => c.storeName === storeName);
        if (!config) return;

        const filteredData: Record<string, any> = {};
        config.keys.forEach(key => {
          if (key in data) {
            filteredData[key] = data[key];
          }
        });

        // Use debounced sync with duplicate prevention
        debouncedSync(storeName, filteredData);
        
        // Don't update lastSyncTime here to prevent infinite loops
      } catch (error) {
        console.warn(`Failed to sync ${storeName} to storage:`, error);
        set({ syncStatus: 'error' });
      }
    },

    /**
     * Load store data from localStorage
     */
    loadFromStorage: (storeName: string) => {
      try {
        const savedData = StorageManager.getItem(storeName);
        if (!savedData) return null;

        const parsed = JSON.parse(savedData);
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
      } catch (error) {
        console.warn(`Failed to load ${storeName} from storage:`, error);
        return null;
      }
    },

    /**
     * Clear storage for specific store or all stores
     */
    clearStorage: (storeName?: string) => {
      try {
        if (storeName) {
          StorageManager.removeItem(storeName);
          lastSyncedData.delete(storeName);
        } else {
          StorageManager.clearAll();
          lastSyncedData.clear();
        }
        set({ lastSyncTime: Date.now() });
      } catch (error) {
        console.warn('Failed to clear storage:', error);
        set({ syncStatus: 'error' });
      }
    },

    /**
     * Export all settings as JSON string
     */
    exportSettings: () => {
      try {
        const allSettings: Record<string, any> = {};
        
        STORE_CONFIGS.forEach(config => {
          const data = get().loadFromStorage(config.storeName);
          if (data) {
            allSettings[config.storeName] = data;
          }
        });

        return JSON.stringify({
          version: '1.0',
          timestamp: new Date().toISOString(),
          settings: allSettings
        }, null, 2);
      } catch (error) {
        console.error('Failed to export settings:', error);
        return '{}';
      }
    },

    /**
     * Import settings from JSON string
     */
    importSettings: (jsonString: string) => {
      try {
        if (typeof jsonString !== 'string' || jsonString.trim() === '') {
          return false;
        }

        const imported = JSON.parse(jsonString);
        
        if (typeof imported !== 'object' || !imported.settings) {
          return false;
        }

        const { settings } = imported;
        
        // Validate and import each store's data
        STORE_CONFIGS.forEach(config => {
          const storeData = settings[config.storeName];
          if (typeof storeData === 'object' && storeData !== null) {
            // Merge with default values to ensure all required keys exist
            const mergedData = {
              ...config.defaultValues,
              ...storeData
            };
            
            // Force sync this data
            const serialized = JSON.stringify(mergedData);
            StorageManager.setItem(config.storeName, serialized);
            lastSyncedData.set(config.storeName, serialized);
          }
        });

        set({ lastSyncTime: Date.now() });
        return true;
      } catch (error) {
        console.error('Failed to import settings:', error);
        return false;
      }
    },

    /**
     * Get total storage size in bytes
     */
    getStorageSize: () => {
      return StorageManager.getStorageSize();
    }
  }))
);

/**
 * Storage configuration export for use by other stores
 */
export { STORE_CONFIGS, StorageManager };

/**
 * Utility function to initialize storage on app startup
 */
export const initializeAppStorage = async () => {
  const storageStore = useStorageStore.getState();
  await storageStore.initializeStorage();
  return storageStore.isInitialized;
};