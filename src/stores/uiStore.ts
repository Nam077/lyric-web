import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useStorageStore } from './storageStore';

interface UIState {
  showUpload: boolean;
  showSettings: boolean;
  
  // Actions
  setShowUpload: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  toggleUpload: () => void;
  toggleSettings: () => void;
  closeAllModals: () => void;
  resetAll: () => void; // Complete reset including storage
  loadFromStorage: () => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    showUpload: false,
    showSettings: false,

    setShowUpload: (show) => {
      set({ showUpload: show });
      // Sync to storage immediately for important state changes
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { ...get(), showUpload: show });
      }
    },
    
    setShowSettings: (show) => {
      set({ showSettings: show });
      // Sync to storage immediately for important state changes  
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { ...get(), showSettings: show });
      }
    },
    
    toggleUpload: () => {
      const newState = !get().showUpload;
      set({ showUpload: newState });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { ...get(), showUpload: newState });
      }
    },
    
    toggleSettings: () => {
      const newState = !get().showSettings;
      set({ showSettings: newState });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { ...get(), showSettings: newState });
      }
    },
    
    closeAllModals: () => {
      set({ showUpload: false, showSettings: false });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('ui', { showUpload: false, showSettings: false });
      }
    },

    resetAll: () => {
      set({ showUpload: false, showSettings: false });
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