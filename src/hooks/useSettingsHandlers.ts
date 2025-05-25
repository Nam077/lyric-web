import { useCallback } from 'react';
import { 
  get, isObject, isString, isNumber, 
  clamp, toNumber
} from 'lodash';
import { useTypographyStore } from '../stores/typographyStore';
import { useAppearanceStore } from '../stores/appearanceStore';
import { useLyricStore } from '../stores/lyricStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Custom hook for handling all Settings component events
 * Manages typography, appearance, timing, and display option changes
 */
export const useSettingsHandlers = () => {
  const uiStore = useUIStore();
  const appearanceStore = useAppearanceStore();
  const typographyStore = useTypographyStore();
  const lyricStore = useLyricStore();

  // Close handler using store
  const handleClose = useCallback(() => {
    uiStore.setShowSettings(false);
  }, [uiStore]);

  /**
   * Enhanced color change handler with lodash safety
   */
  const handleColorChange = useCallback((
    colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', 
    color: string
  ) => {
    if (isString(color)) {
      appearanceStore.setColor(colorType, color);
    }
  }, [appearanceStore]);

  /**
   * Enhanced delay change handler with lodash safety
   */
  const handleDelayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    
    // Allow empty string for clearing the input
    if (value === '') {
      lyricStore.setLyricDelay(0);
      return;
    }
    
    // Enhanced number parsing with lodash
    const numericValue = toNumber(value);
    if (isNumber(numericValue) && !isNaN(numericValue)) {
      lyricStore.setLyricDelay(clamp(numericValue, -5000, 5000));
    }
  }, [lyricStore]);

  /**
   * Enhanced font size change handler
   */
  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue) && numericValue > 0) {
      typographyStore.setFontSize(clamp(numericValue, 0.5, 20));
    }
  }, [typographyStore]);

  /**
   * Enhanced letter spacing change handler
   */
  const handleLetterSpacingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue)) {
      typographyStore.setLetterSpacing(clamp(numericValue, -2, 5));
    }
  }, [typographyStore]);

  /**
   * Enhanced line height change handler
   */
  const handleLineHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue) && numericValue > 0) {
      typographyStore.setLineHeight(clamp(numericValue, 0.5, 5));
    }
  }, [typographyStore]);

  /**
   * Enhanced text case change handler
   */
  const handleTextCaseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    
    if (isString(value) && ['normal', 'uppercase', 'lowercase'].includes(value)) {
      typographyStore.setTextCase(value as 'normal' | 'uppercase' | 'lowercase');
    }
  }, [typographyStore]);

  /**
   * Handle merge toggle div click
   */
  const handleMergeToggleClick = useCallback(() => {
    lyricStore.setMergeSentences(!lyricStore.mergeSentences);
  }, [lyricStore]);

  /**
   * Handle merge threshold change
   */
  const handleMergeThresholdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue)) {
      lyricStore.setMergeThreshold(clamp(numericValue, 0.5, 5.0));
    }
  }, [lyricStore]);

  // Enhanced color input handlers
  const createColorChangeHandler = useCallback((
    colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor'
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isObject(e)) return;
      
      const target = get(e, 'target');
      const value = get(target, 'value', '');
      
      if (isString(value) && value.length > 0) {
        handleColorChange(colorType, value);
      }
    };
  }, [handleColorChange]);

  return {
    handleClose,
    handleColorChange,
    handleDelayChange,
    handleFontSizeChange,
    handleLetterSpacingChange,
    handleLineHeightChange,
    handleTextCaseChange,
    handleMergeToggleClick,
    handleMergeThresholdChange,
    createColorChangeHandler,
  };
};