import { useCallback } from 'react';
import { isString } from 'lodash';
import { useAppearanceStore } from '../stores/appearanceStore';

/**
 * Custom hook for handling appearance and styling changes
 * Manages color changes and visual settings
 */
export const useAppearanceHandlers = () => {
  const appearanceStore = useAppearanceStore();

  /**
   * Handle color changes from Settings component with lodash safety
   * Supports all color types: primary, secondary, text, and text shadow
   */
  const handleColorChange = useCallback((
    colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', 
    color: string
  ) => {
    if (!isString(colorType) || !isString(color)) return;
    appearanceStore.setColor(colorType, color);
  }, [appearanceStore]);

  return {
    handleColorChange,
  };
};