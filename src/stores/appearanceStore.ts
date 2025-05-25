import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { isString } from 'lodash';
import { useStorageStore } from './storageStore';
import type { WordEffect } from '../components/LyricAnimation/Word';

interface AppearanceColors {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  textShadowColor: string;
}

interface EffectSettings {
  effectMode: 'auto' | 'manual' | 'fixed';
  effectChangeFrequency: number; // How many lyrics before effect changes (1 = every lyric, 2 = every 2nd lyric, etc.)
  fixedEffect: WordEffect | null; // Effect to use when mode is 'fixed'
  manualEffect: WordEffect | null; // Effect to use when mode is 'manual'
}

interface AppearanceState extends AppearanceColors, EffectSettings {
  // Actions
  setColor: (colorType: keyof AppearanceColors, color: string) => void;
  setColors: (colors: Partial<AppearanceColors>) => void;
  setEffectMode: (mode: 'auto' | 'manual' | 'fixed') => void;
  setEffectChangeFrequency: (frequency: number) => void;
  setFixedEffect: (effect: WordEffect | null) => void;
  setManualEffect: (effect: WordEffect | null) => void;
  setEffectSettings: (settings: Partial<EffectSettings>) => void;
  resetColors: () => void;
  resetEffectSettings: () => void;
  resetAll: () => void; // Complete reset including storage
  loadFromStorage: () => void;
}

const defaultColors: AppearanceColors = {
  primaryColor: "#FFF9C4",      // Light yellow for background stripe
  secondaryColor: "#FFCC80",    // Lighter orange-yellow for background stripe
  textColor: "#1E6D9A",         // Medium blue text color
  textShadowColor: "#1565C0"    // Medium blue shadow color
};

const defaultEffectSettings: EffectSettings = {
  effectMode: 'auto',
  effectChangeFrequency: 1, // Change effect every lyric (default behavior)
  fixedEffect: null,
  manualEffect: null
};

export const useAppearanceStore = create<AppearanceState>()(
  subscribeWithSelector((set, get) => ({
    ...defaultColors,
    ...defaultEffectSettings,

    setColor: (colorType, color) => {
      if (isString(color)) {
        set({
          [colorType]: color
        });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('appearance', { ...get(), [colorType]: color });
        }
      }
    },

    setColors: (colors) => {
      set((state) => ({
        ...state,
        ...colors
      }));
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), ...colors });
      }
    },

    setEffectMode: (mode) => {
      set({ effectMode: mode });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), effectMode: mode });
      }
    },

    setEffectChangeFrequency: (frequency) => {
      const safeFrequency = Math.max(1, Math.min(10, frequency)); // Between 1 and 10
      set({ effectChangeFrequency: safeFrequency });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), effectChangeFrequency: safeFrequency });
      }
    },

    setFixedEffect: (effect) => {
      set({ fixedEffect: effect });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), fixedEffect: effect });
      }
    },

    setManualEffect: (effect) => {
      set({ manualEffect: effect });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), manualEffect: effect });
      }
    },

    setEffectSettings: (settings) => {
      set((state) => ({
        ...state,
        ...settings
      }));
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), ...settings });
      }
    },

    resetColors: () => {
      set(defaultColors);
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), ...defaultColors });
      }
    },

    resetEffectSettings: () => {
      set(defaultEffectSettings);
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), ...defaultEffectSettings });
      }
    },

    resetAll: () => {
      set({ ...defaultColors, ...defaultEffectSettings });
      // Clear from storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.clearStorage('appearance');
      }
    },

    loadFromStorage: () => {
      const storageStore = useStorageStore.getState();
      const savedData = storageStore.loadFromStorage('appearance');
      if (savedData) {
        set({ ...defaultColors, ...defaultEffectSettings, ...savedData });
      }
    }
  }))
);