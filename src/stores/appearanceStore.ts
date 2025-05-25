import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { isString } from 'lodash';
import { useStorageStore } from './storageStore';

interface AppearanceColors {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  textShadowColor: string;
}

interface AppearanceState extends AppearanceColors {
  // Actions
  setColor: (colorType: keyof AppearanceColors, color: string) => void;
  setOpacity: (colorType: keyof AppearanceColors, opacity: number) => void;
  setColors: (colors: Partial<AppearanceColors>) => void;
  getHexColor: (colorType: keyof AppearanceColors) => string;
  getOpacity: (colorType: keyof AppearanceColors) => number;
  resetColors: () => void;
  resetAll: () => void;
  loadFromStorage: () => void;
}

const defaultColors: AppearanceColors = {
  primaryColor: "rgba(255, 249, 196, 1)",      // Light yellow for background stripe
  secondaryColor: "rgba(255, 204, 128, 1)",    // Lighter orange-yellow for background stripe
  textColor: "rgba(21, 1, 4, 1)",          // Medium blue text color
  textShadowColor: "rgba(25, 9, 9, 0)"     // Medium blue shadow color
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to extract hex from rgba or return hex as is
const extractHex = (color: string): string => {
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      const [, r, g, b] = match;
      return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return color;
};

// Helper function to extract opacity from rgba
const extractOpacity = (color: string): number => {
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      return parseFloat(match[4]);
    }
  }
  return 1;
};

export const useAppearanceStore = create<AppearanceState>()(
  subscribeWithSelector((set, get) => ({
    ...defaultColors,

    setColor: (colorType, color) => {
      if (isString(color)) {
        const currentOpacity = extractOpacity(get()[colorType]);
        const newColor = hexToRgba(extractHex(color), currentOpacity);
        set({
          [colorType]: newColor
        });
        // Sync to storage
        const storageStore = useStorageStore.getState();
        if (storageStore.isInitialized) {
          storageStore.syncToStorage('appearance', { ...get(), [colorType]: newColor });
        }
      }
    },

    setOpacity: (colorType, opacity) => {
      const currentHex = extractHex(get()[colorType]);
      const newColor = hexToRgba(currentHex, opacity);
      set({
        [colorType]: newColor
      });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), [colorType]: newColor });
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

    getHexColor: (colorType) => {
      const state = get();
      return extractHex(state[colorType]);
    },

    getOpacity: (colorType) => {
      const state = get();
      return extractOpacity(state[colorType]);
    },

    resetColors: () => {
      set({ ...defaultColors });
      // Sync to storage
      const storageStore = useStorageStore.getState();
      if (storageStore.isInitialized) {
        storageStore.syncToStorage('appearance', { ...get(), ...defaultColors });
      }
    },

    resetAll: () => {
      set({ ...defaultColors });
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
        set({ ...defaultColors, ...savedData });
      }
    }
  }))
);