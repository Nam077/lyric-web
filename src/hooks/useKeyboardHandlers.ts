import { useEffect } from 'react';
import { isObject, get, isString } from 'lodash';
import { useUIStore } from '../stores/uiStore';

/**
 * Custom hook for handling keyboard events
 * Manages keyboard shortcuts for UI interactions
 */
export const useKeyboardHandlers = () => {
  const uiStore = useUIStore();

  /**
   * Add keyboard event listeners for 'U' and 'I' keys with lodash safety
   * U - Toggle upload modal
   * I - Toggle settings modal
   */
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isObject(event)) return;
      
      const key = get(event, 'key', '');
      const lowerKey = isString(key) ? key.toLowerCase() : '';
      
      if (lowerKey === 'u') {
        uiStore.toggleUpload();
      } else if (lowerKey === 'i') {
        uiStore.toggleSettings();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [uiStore]);

  // This hook doesn't return anything as it only manages event listeners
};