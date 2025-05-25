import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { get } from 'lodash';
import { Sketch } from '@uiw/react-color';
import type { ColorResult } from '@uiw/react-color';
import { useAppearanceStore } from '../../stores/appearanceStore';
import styles from './AppearanceSettings.module.css';

interface AppearanceSettingsProps {
  createColorChangeHandler?: (colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor') => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = () => {
  const appearanceStore = useAppearanceStore();
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const {
    primaryColor,
    secondaryColor,
    textColor,
    textShadowColor,
    setColor,
    setOpacity
  } = appearanceStore;

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveColorPicker(null);
      }
    };

    if (activeColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeColorPicker]);

  /**
   * Handle color change from the color picker
   * @param colorType - The type of color being changed
   * @param color - The color result from the picker
   */
  const handleColorChange = (
    colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', 
    color: ColorResult
  ) => {
    // Extract hex from color result and set color + opacity separately
    const { hex } = color;
    const { a } = color.rgba;
    
    // Set color (hex) and opacity separately as the store expects
    setColor(colorType, hex);
    setOpacity(colorType, a);
  };

  /**
   * Convert rgba string to HsvaColor object that Sketch component can understand
   * @param rgbaString - The rgba color string from store
   * @returns HsvaColor object or hex string
   */
  const convertRgbaToSketchColor = (rgbaString: string): string => {
    // Extract rgba values from string like "rgba(255, 249, 196, 1)"
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [, r, g, b] = match;
      const red = parseInt(r);
      const green = parseInt(g);
      const blue = parseInt(b);
      
      // Convert to hex string which Sketch component accepts
      const hex = `#${[red, green, blue].map(x => x.toString(16).padStart(2, '0')).join('')}`;
      return hex;
    }
    
    // Fallback for invalid format
    return '#ffffff';
  };

  /**
   * Toggle color picker visibility for a specific color type
   * @param colorType - The color type to toggle
   */
  const toggleColorPicker = (colorType: string) => {
    if (activeColorPicker === colorType) {
      setActiveColorPicker(null);
      return;
    }

    const buttonElement = buttonRefs.current[colorType];
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Color picker dimensions (adjusted for better size)
      const pickerWidth = 240;
      const pickerHeight = 320;
      
      // Calculate initial position to the right of the button
      let left = rect.right + scrollX + 10;
      let top = rect.top + scrollY;
      
      // Check if picker would go off the right edge of viewport
      if (left + pickerWidth > window.innerWidth + scrollX) {
        // Position to the left of the button instead
        left = rect.left + scrollX - pickerWidth - 10;
      }
      
      // Check if picker would go off the left edge of viewport
      if (left < scrollX) {
        // Center it horizontally relative to the button
        left = rect.left + scrollX + (rect.width / 2) - (pickerWidth / 2);
      }
      
      // Check if picker would go off the bottom edge of viewport
      if (top + pickerHeight > window.innerHeight + scrollY) {
        // Position above the button instead
        top = rect.top + scrollY - pickerHeight - 10;
      }
      
      // Check if picker would go off the top edge of viewport
      if (top < scrollY) {
        // Position below the button
        top = rect.bottom + scrollY + 10;
      }
      
      // Final bounds check to ensure it's within viewport
      left = Math.max(scrollX + 10, Math.min(left, window.innerWidth + scrollX - pickerWidth - 10));
      top = Math.max(scrollY + 10, Math.min(top, window.innerHeight + scrollY - pickerHeight - 10));
      
      setPickerPosition({ top, left });
    }
    
    setActiveColorPicker(colorType);
  };

  const colorConfigs = [
    { type: 'textColor' as const, label: 'Text Color', value: textColor },
    { type: 'textShadowColor' as const, label: 'Text Shadow', value: textShadowColor },
    { type: 'primaryColor' as const, label: 'Background Primary', value: primaryColor },
    { type: 'secondaryColor' as const, label: 'Background Secondary', value: secondaryColor }
  ];

  // Get current color config for active picker
  const activeColorConfig = colorConfigs.find(c => c.type === activeColorPicker);
  
  // Create portal for color picker
  const colorPickerPortal = activeColorPicker && activeColorConfig && (
    createPortal(
      <div 
        ref={popoverRef}
        className={get(styles, 'colorPickerPortal', '')}
        style={{
          position: 'fixed',
          top: `${pickerPosition.top}px`,
          left: `${pickerPosition.left}px`,
          zIndex: 10000,
          background: 'rgba(25, 25, 30, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div className={get(styles, 'colorPickerHeader', '')}>
          <span>{activeColorConfig.label}</span>
          <button 
            className={get(styles, 'closeButton', '')}
            onClick={() => setActiveColorPicker(null)}
            type="button"
            aria-label="Close color picker"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ×
          </button>
        </div>
        <Sketch
          color={convertRgbaToSketchColor(activeColorConfig.value)}
          onChange={(color) => handleColorChange(activeColorPicker as 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color)}
          disableAlpha={false}
          presetColors={[
            '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
            '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
          ]}
        />
      </div>,
      document.body
    )
  );

  return (
    <div className={get(styles, 'section', '')}>
      <h3>🎨 Appearance</h3>
      
      <div className={get(styles, 'colorGrid', '')}>
        {colorConfigs.map(({ type, label, value }) => (
          <div key={type} className={get(styles, 'colorCard', '')}>
            <div className={get(styles, 'colorLabel', '')}>{label}</div>
            
            <div className={get(styles, 'colorPickerContainer', '')}>
              <div 
                ref={(el) => { buttonRefs.current[type] = el; }}
                className={get(styles, 'colorPreview', '')}
                style={{ backgroundColor: value }}
                onClick={() => toggleColorPicker(type)}
              >
                <div className={get(styles, 'colorPreviewInner', '')} />
              </div>
            </div>
            
            <div className={get(styles, 'colorValue', '')}>{value}</div>
          </div>
        ))}
      </div>
      
      {colorPickerPortal}
    </div>
  );
};