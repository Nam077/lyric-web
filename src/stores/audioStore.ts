import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { isObject, isString } from 'lodash';
import { useStorageStore, StorageManager } from './storageStore';

interface SongInfo {
  title: string;
  artist: string;
}

interface AudioFileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  base64Data: string;
  uploadedAt: string;
  title: string;
  artist: string;
}

/**
 * Extract song information from filename
 * Supports formats like "Artist - Song Title.mp3" or "Song Title.mp3"
 */
const extractSongInfo = (fileName: string): SongInfo => {
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Try to split by " - " to separate artist and title
  const parts = nameWithoutExt.split(' - ');
  
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim()
    };
  } else {
    // If no artist separator found, use filename as title
    return {
      artist: 'Unknown Artist',
      title: nameWithoutExt.trim()
    };
  }
};

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  isAudioReady: boolean;
  currentAudioUrl: string;
  currentSongInfo: SongInfo;
  audioFileData: AudioFileData | null; // Store uploaded audio file data
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsAudioReady: (ready: boolean) => void;
  setCurrentAudioUrl: (url: string) => void;
  setCurrentSongInfo: (info: Partial<SongInfo>) => void;
  setAudioFileData: (fileData: AudioFileData | null) => void;
  loadAudioFromFile: (file: File) => Promise<boolean>;
  togglePlayback: () => void;
  resetAll: () => void; // Complete reset including storage and uploaded audio
  loadFromStorage: () => void;
}

export const useAudioStore = create<AudioState>()(
  subscribeWithSelector((set, get) => ({
    isPlaying: false,
    currentTime: 0,
    isAudioReady: false,
    currentAudioUrl: "/SOOBIN - DANCING IN THE DARK.mp3",
    currentSongInfo: {
      title: "DANCING IN THE DARK",
      artist: "SOOBIN"
    },
    audioFileData: null,

    setIsPlaying: (playing) => set({ isPlaying: playing }),
    
    setCurrentTime: (time) => set({ currentTime: time }),
    
    setIsAudioReady: (ready) => set({ isAudioReady: ready }),
    
    setCurrentAudioUrl: (url) => {
      if (isString(url)) {
        set({ currentAudioUrl: url, isAudioReady: false });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('audio', { ...get(), currentAudioUrl: url });
        }
      }
    },
    
    setCurrentSongInfo: (info) => {
      if (isObject(info)) {
        const newSongInfo = {
          ...get().currentSongInfo,
          ...info
        };
        set({
          currentSongInfo: newSongInfo
        });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('audio', { ...get(), currentSongInfo: newSongInfo });
        }
      }
    },

    setAudioFileData: (fileData) => {
      set({ audioFileData: fileData });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('audio', { ...get(), audioFileData: fileData });
      }
    },

    /**
     * Load audio file and convert to base64 for storage
     */
    loadAudioFromFile: async (file: File): Promise<boolean> => {
      const { setCurrentAudioUrl, setCurrentSongInfo, setAudioFileData } = get();
      
      try {
        console.log('Loading audio file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Check file size before processing
        const fileSizeMB = file.size / 1024 / 1024;
        const maxSizeMB = StorageManager.getMaxStorageSize() / 1024 / 1024;
        const availableSpaceMB = StorageManager.getAvailableSpace() / 1024 / 1024;
        
        if (fileSizeMB > maxSizeMB) {
          console.warn(`File too large: ${fileSizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB.toFixed(2)}MB`);
          alert(`File too large! Maximum size is ${maxSizeMB.toFixed(2)}MB, but your file is ${fileSizeMB.toFixed(2)}MB. Please choose a smaller file.`);
          return false;
        }
        
        if (fileSizeMB > availableSpaceMB) {
          console.warn(`Not enough storage space: Need ${fileSizeMB.toFixed(2)}MB, Available: ${availableSpaceMB.toFixed(2)}MB`);
          alert(`Not enough storage space! Need ${fileSizeMB.toFixed(2)}MB but only ${availableSpaceMB.toFixed(2)}MB available. Try clearing some data or choosing a smaller file.`);
          return false;
        }

        // Convert to base64
        const base64Data = await StorageManager.fileToBase64(file);
        
        // Extract song info from filename
        const songInfo = extractSongInfo(file.name);
        
        // Create audio file data object
        const newAudioFileData: AudioFileData = {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          base64Data,
          uploadedAt: new Date().toISOString(),
          ...songInfo
        };

        // Update stores with new data
        setAudioFileData(newAudioFileData);
        setCurrentSongInfo(songInfo);
        
        // Create blob URL for immediate playback
        const blobUrl = StorageManager.base64ToUrl(base64Data);
        setCurrentAudioUrl(blobUrl);
        
        console.log('✅ Audio file loaded successfully and saved to storage');
        return true;
        
      } catch (error) {
        console.error('Failed to load audio file:', error);
        alert(`Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    },
    
    togglePlayback: () => {
      set((state) => ({ isPlaying: !state.isPlaying }));
    },

    resetAll: () => {
      // Reset all audio state including uploaded files
      set({
        isPlaying: false,
        currentTime: 0,
        isAudioReady: false,
        currentAudioUrl: '',
        currentSongInfo: {
          title: 'Unknown',
          artist: 'Unknown',
        },
        audioFileData: null,
      });
      
      // Clear from storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.clearStorage('audio');
      }
    },

    loadFromStorage: () => {
      const storageStore = useStorageStore.getState();
      const savedData = storageStore.loadFromStorage('audio') as Partial<AudioState> | null;
      if (savedData) {
        // If we have stored audio file data, recreate the blob URL
        if (savedData.audioFileData?.base64Data) {
          try {
            const blobUrl = StorageManager.base64ToUrl(savedData.audioFileData.base64Data);
            savedData.currentAudioUrl = blobUrl;
            console.log(`Restored audio file: ${savedData.audioFileData.fileName}`);
          } catch (error) {
            console.warn('Failed to restore audio file from storage:', error);
            // Remove corrupted data
            savedData.audioFileData = null;
            savedData.currentAudioUrl = "/SOOBIN - DANCING IN THE DARK.mp3";
          }
        }
        set(savedData);
      }
    }
  }))
);