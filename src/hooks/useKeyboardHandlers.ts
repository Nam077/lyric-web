import { useEffect, useCallback } from 'react';
import { isObject, get, isString } from 'lodash';
import { useUIStore } from '../stores/uiStore';

/**
 * Custom hook for handling keyboard events and mobile gestures
 * Manages keyboard shortcuts and touch gestures for UI interactions
 */
export const useKeyboardHandlers = () => {
  const uiStore = useUIStore();

  /**
   * Check if any modal is currently open to prevent gesture conflicts
   */
  const isAnyModalOpen = useCallback(() => {
    const { showUpload, showSettings, showAudioPlayer } = uiStore;
    return showUpload || showSettings || showAudioPlayer;
  }, [uiStore]);

  /**
   * Add keyboard event listeners for 'U', 'I', and 'P' keys with lodash safety
   * U - Toggle upload modal
   * I - Toggle settings modal  
   * P - Toggle audio player modal
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
      } else if (lowerKey === 'p') {
        uiStore.toggleAudioPlayer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [uiStore]);

  /**
   * Add mobile gesture handlers for touch devices
   * Swipe up - Open audio player
   * Swipe down - Open settings
   * Swipe left - Open upload
   */
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50; // Minimum distance for a valid swipe
    const maxSwipeTime = 300; // Maximum time for a swipe gesture (ms)
    let touchStartTime = 0;

    /**
     * Handle touch start event
     */
    const handleTouchStart = (event: TouchEvent) => {
      if (!isObject(event) || isAnyModalOpen()) return;
      
      const touch = get(event, 'touches[0]');
      if (!isObject(touch)) return;

      touchStartX = get(touch, 'clientX', 0);
      touchStartY = get(touch, 'clientY', 0);
      touchStartTime = Date.now();
    };

    /**
     * Handle touch end event and determine swipe direction
     */
    const handleTouchEnd = (event: TouchEvent) => {
      if (!isObject(event) || isAnyModalOpen()) return;
      
      const touch = get(event, 'changedTouches[0]');
      if (!isObject(touch)) return;

      touchEndX = get(touch, 'clientX', 0);
      touchEndY = get(touch, 'clientY', 0);
      
      const touchEndTime = Date.now();
      const swipeTime = touchEndTime - touchStartTime;
      
      // Check if gesture was quick enough to be a swipe
      if (swipeTime > maxSwipeTime) return;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if this is a valid swipe gesture
      const isHorizontalSwipe = absDeltaX > absDeltaY && absDeltaX > minSwipeDistance;
      const isVerticalSwipe = absDeltaY > absDeltaX && absDeltaY > minSwipeDistance;

      if (isHorizontalSwipe) {
        // Horizontal swipes
        if (deltaX < 0) {
          // Swipe left - Open upload
          console.log('📱 Swipe left detected - Opening upload');
          uiStore.setShowUpload(true);
        }
        // Note: Swipe right could be added here if needed
      } else if (isVerticalSwipe) {
        // Vertical swipes
        if (deltaY < 0) {
          // Swipe up - Open audio player
          console.log('📱 Swipe up detected - Opening audio player');
          uiStore.setShowAudioPlayer(true);
        } else if (deltaY > 0) {
          // Swipe down - Open settings
          console.log('📱 Swipe down detected - Opening settings');
          uiStore.setShowSettings(true);
        }
      }
    };

    /**
     * Prevent default touch behavior on swipe gestures
     */
    const handleTouchMove = (event: TouchEvent) => {
      if (!isObject(event) || isAnyModalOpen()) return;
      
      // Only prevent default if we're in the middle of a potential swipe
      const touch = get(event, 'touches[0]');
      if (!isObject(touch)) return;

      const currentX = get(touch, 'clientX', 0);
      const currentY = get(touch, 'clientY', 0);
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);

      // If user is swiping, prevent default scrolling
      if (deltaX > 10 || deltaY > 10) {
        event.preventDefault();
      }
    };

    // Add touch event listeners with passive option for better performance
    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchend', handleTouchEnd, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [uiStore, isAnyModalOpen]);

  // This hook doesn't return anything as it only manages event listeners
};