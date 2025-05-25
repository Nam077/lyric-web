import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useStorageStore } from './storageStore';

interface UIState {
  showUpload: boolean;
  showSettings: boolean;
  showAudioPlayer: boolean;
  
  // Actions
  setShowUpload: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowAudioPlayer: (show: boolean) => void;
  toggleUpload: () => void;
  toggleSettings: () => void;
  toggleAudioPlayer: () => void;
  closeAllModals: () => void;
  resetAll: () => void; // Complete reset including storage
  loadFromStorage: () => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    showUpload: false,
    showSettings: false,
    showAudioPlayer: false,

    setShowUpload: (show) => {
      // If opening upload, close all other modals
      if (show) {
        set({ showUpload: true, showSettings: false, showAudioPlayer: false });
      } else {
        set({ showUpload: false });
      }
      
      // Sync to storage immediately for important state changes
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    setShowSettings: (show) => {
      // If opening settings, close all other modals
      if (show) {
        set({ showSettings: true, showUpload: false, showAudioPlayer: false });
      } else {
        set({ showSettings: false });
      }
      
      // Sync to storage immediately for important state changes  
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    setShowAudioPlayer: (show) => {
      // If opening audio player, close all other modals
      if (show) {
        set({ showAudioPlayer: true, showUpload: false, showSettings: false });
      } else {
        set({ showAudioPlayer: false });
      }
      
      // Sync to storage immediately for important state changes  
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    toggleUpload: () => {
      const currentUpload = get().showUpload;
      // If toggling upload on, close all other modals
      if (!currentUpload) {
        set({ showUpload: true, showSettings: false, showAudioPlayer: false });
      } else {
        set({ showUpload: false });
      }
      
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    toggleSettings: () => {
      const currentSettings = get().showSettings;
      // If toggling settings on, close all other modals
      if (!currentSettings) {
        set({ showSettings: true, showUpload: false, showAudioPlayer: false });
      } else {
        set({ showSettings: false });
      }
      
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    toggleAudioPlayer: () => {
      const currentAudioPlayer = get().showAudioPlayer;
      // If toggling audio player on, close all other modals
      if (!currentAudioPlayer) {
        set({ showAudioPlayer: true, showUpload: false, showSettings: false });
      } else {
        set({ showAudioPlayer: false });
      }
      
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        const { showUpload, showSettings, showAudioPlayer } = get();
        storageStore.syncToStorage('ui', { showUpload, showSettings, showAudioPlayer });
      }
    },
    
    closeAllModals: () => {
      set({ showUpload: false, showSettings: false, showAudioPlayer: false });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { showUpload: false, showSettings: false, showAudioPlayer: false });
      }
    },

    resetAll: () => {
      set({ showUpload: false, showSettings: false, showAudioPlayer: false });
      // Also clear from storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.clearStorage('ui');
      }
    },

    loadFromStorage: () => {
      const storageStore = useStorageStore.getState();
      const savedData = storageStore.loadFromStorage('ui');
      if (savedData) {
        set(savedData);
      }
    }
  }))
);