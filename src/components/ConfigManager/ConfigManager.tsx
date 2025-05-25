import React, { useState, useCallback, useRef } from 'react';
import { 
  get, isObject, isFunction, isString, isNumber 
} from 'lodash';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useTypographyStore } from '../../stores/typographyStore';
import { useLyricStore } from '../../stores/lyricStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './ConfigManager.module.css';

/**
 * Configuration Management Component
 * Handles export, import, and reset of application settings
 */
interface ConfigManagerProps {
  onClose?: () => void;
}

/**
 * Custom font data structure matching typographyStore
 */
interface CustomFontData {
  base64: string;
  fontFamily: string;
  fileName: string;
  size: number;
}

/**
 * Settings data structure for export/import
 */
interface SettingsData {
  version: string;
  timestamp: string;
  settings: {
    appearance: {
      primaryColor: string;
      secondaryColor: string;
      textColor: string;
      textShadowColor: string;
    };
    typography: {
      fontFamily: string;
      fontSize: number;
      letterSpacing: number;
      lineHeight: number;
      textCase: 'normal' | 'uppercase' | 'lowercase';
      customFontData?: CustomFontData | null;
    };
    lyric: {
      lyricDelay: number;
      mergeSentences: boolean;
    };
  };
}

export const ConfigManager: React.FC<ConfigManagerProps> = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all stores for export/import/reset operations
  const appearanceStore = useAppearanceStore();
  const typographyStore = useTypographyStore();
  const lyricStore = useLyricStore();
  const uiStore = useUIStore();

  /**
   * Clear message after timeout
   */
  const clearMessage = useCallback(() => {
    setTimeout(() => setMessage(null), 3000);
  }, []);

  /**
   * Export current settings to JSON file
   */
  const handleExportSettings = useCallback(async () => {
    try {
      setIsExporting(true);
      setMessage(null);
      
      // Collect all store data
      const settingsData: SettingsData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: {
          appearance: {
            primaryColor: appearanceStore.primaryColor,
            secondaryColor: appearanceStore.secondaryColor,
            textColor: appearanceStore.textColor,
            textShadowColor: appearanceStore.textShadowColor,
          },
          typography: {
            fontFamily: typographyStore.fontFamily,
            fontSize: typographyStore.fontSize,
            letterSpacing: typographyStore.letterSpacing,
            lineHeight: typographyStore.lineHeight,
            textCase: typographyStore.textCase,
            customFontData: typographyStore.customFontData || null,
          },
          lyric: {
            lyricDelay: lyricStore.lyricDelay,
            mergeSentences: lyricStore.mergeSentences,
          }
        }
      };
      
      const settingsJson = JSON.stringify(settingsData, null, 2);
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `lyric-web-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Settings exported successfully!' });
      clearMessage();
      console.log('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      setMessage({ type: 'error', text: 'Failed to export settings. Please try again.' });
      clearMessage();
    } finally {
      setIsExporting(false);
    }
  }, [appearanceStore, typographyStore, lyricStore, clearMessage]);

  /**
   * Import settings from JSON file
   */
  const handleImportSettings = useCallback(async (file: File) => {
    try {
      setIsImporting(true);
      setMessage(null);
      
      const text = await file.text();
      const data = JSON.parse(text) as SettingsData;
      
      // Validate data structure
      if (!data.settings || !isObject(data.settings)) {
        throw new Error('Invalid settings file format');
      }
      
      const { settings } = data;
      
      // Import appearance settings
      if (settings.appearance) {
        const { appearance } = settings;
        if (isString(appearance.primaryColor)) {
          appearanceStore.setColor('primaryColor', appearance.primaryColor);
        }
        if (isString(appearance.secondaryColor)) {
          appearanceStore.setColor('secondaryColor', appearance.secondaryColor);
        }
        if (isString(appearance.textColor)) {
          appearanceStore.setColor('textColor', appearance.textColor);
        }
        if (isString(appearance.textShadowColor)) {
          appearanceStore.setColor('textShadowColor', appearance.textShadowColor);
        }
      }
      
      // Import typography settings
      if (settings.typography) {
        const { typography } = settings;
        if (isString(typography.fontFamily)) {
          typographyStore.setFontFamily(typography.fontFamily);
        }
        if (isNumber(typography.fontSize)) {
          typographyStore.setFontSize(typography.fontSize);
        }
        if (isNumber(typography.letterSpacing)) {
          typographyStore.setLetterSpacing(typography.letterSpacing);
        }
        if (isNumber(typography.lineHeight)) {
          typographyStore.setLineHeight(typography.lineHeight);
        }
        if (['normal', 'uppercase', 'lowercase'].includes(typography.textCase)) {
          typographyStore.setTextCase(typography.textCase);
        }
        if (typography.customFontData && isObject(typography.customFontData)) {
          // Validate the custom font data has required properties
          const fontData = typography.customFontData;
          if (isString(fontData.base64) && isString(fontData.fontFamily) && 
              isString(fontData.fileName) && isNumber(fontData.size)) {
            // Update the store state directly
            typographyStore.customFontData = fontData;
            
            // Recreate the font-face CSS
            try {
              const fontFormat = fontData.fileName.toLowerCase().includes('.woff2') ? 'woff2' :
                                fontData.fileName.toLowerCase().includes('.woff') ? 'woff' :
                                fontData.fileName.toLowerCase().includes('.otf') ? 'opentype' : 'truetype';

              const fontFaceCSS = `
                @font-face {
                  font-family: '${fontData.fontFamily}';
                  src: url('${fontData.base64}') format('${fontFormat}');
                  font-display: swap;
                }
              `;

              // Remove existing custom font style if any
              const existingStyle = document.getElementById('custom-font-style');
              if (existingStyle) {
                existingStyle.remove();
              }

              // Inject new font style
              const styleElement = document.createElement('style');
              styleElement.id = 'custom-font-style';
              styleElement.textContent = fontFaceCSS;
              document.head.appendChild(styleElement);
            } catch (fontError) {
              console.warn('Failed to restore custom font:', fontError);
            }
          }
        }
      }
      
      // Import lyric settings
      if (settings.lyric) {
        const { lyric } = settings;
        if (isNumber(lyric.lyricDelay)) {
          lyricStore.setLyricDelay(lyric.lyricDelay);
        }
        if (typeof lyric.mergeSentences === 'boolean') {
          lyricStore.setMergeSentences(lyric.mergeSentences);
        }
      }
      
      setMessage({ type: 'success', text: 'Settings imported successfully!' });
      clearMessage();
      console.log('Settings imported from file:', file.name);
      
    } catch (error) {
      console.error('Failed to import settings:', error);
      setMessage({ type: 'error', text: 'Failed to import settings. Please check the file format.' });
      clearMessage();
    } finally {
      setIsImporting(false);
    }
  }, [appearanceStore, typographyStore, lyricStore, clearMessage]);

  /**
   * Reset all settings to default values
   */
  const handleResetSettings = useCallback(() => {
    try {
      setIsResetting(true);
      setMessage(null);
      
      // Use store reset methods instead of manually setting values
      appearanceStore.resetAll();
      typographyStore.resetAll();
      lyricStore.resetAll();
      uiStore.resetAll();
      
      setMessage({ type: 'success', text: 'Settings reset to defaults successfully!' });
      clearMessage();
      console.log('All settings reset to defaults');
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings. Please try again.' });
      clearMessage();
    } finally {
      setIsResetting(false);
      setShowConfirmReset(false);
    }
  }, [appearanceStore, typographyStore, lyricStore, uiStore, clearMessage]);

  /**
   * Handle file input change for import
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = get(e, 'target.files[0]');
    if (isObject(file)) {
      handleImportSettings(file as File);
    }
    
    // Reset file input
    const input = get(fileInputRef, 'current');
    if (isObject(input) && 'value' in input) {
      input.value = '';
    }
  }, [handleImportSettings]);

  /**
   * Trigger file input click
   */
  const handleImportClick = useCallback(() => {
    const input = get(fileInputRef, 'current');
    if (isObject(input) && isFunction(get(input, 'click'))) {
      input.click();
    }
  }, []);

  /**
   * Get storage info for display
   */
  const getStorageInfo = useCallback(() => {
    try {
      const used = JSON.stringify(localStorage).length;
      const max = 5 * 1024 * 1024; // 5MB typical limit
      const usedKB = (used / 1024).toFixed(1);
      const maxMB = (max / 1024 / 1024).toFixed(0);
      const percentage = ((used / max) * 100).toFixed(1);
      
      return { used, max, usedKB, maxMB, percentage };
    } catch {
      return { used: 0, max: 5242880, usedKB: '0.0', maxMB: '5', percentage: '0.0' };
    }
  }, []);

  const storageInfo = getStorageInfo();

  return (
    <div className={styles.configManager}>
      {/* Storage Usage */}
      <div className={styles.storageInfo}>
        <h4>💾 Storage Usage</h4>
        <div className={styles.storageBar}>
          <div 
            className={styles.storageUsed}
            style={{ width: `${Math.min(parseFloat(storageInfo.percentage), 100)}%` }}
          />
        </div>
        <span className={styles.storageText}>
          {storageInfo.usedKB}KB / {storageInfo.maxMB}MB ({storageInfo.percentage}%)
        </span>
      </div>

      {/* Export Settings */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Export Settings</label>
        <button
          onClick={handleExportSettings}
          disabled={isExporting}
          className={styles.exportButton}
        >
          {isExporting ? '📤 Exporting...' : '📤 Export Settings'}
        </button>
        <small className={styles.configHint}>
          Download current settings as JSON file for backup
        </small>
      </div>

      {/* Import Settings */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Import Settings</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className={styles.importButton}
        >
          {isImporting ? '📥 Importing...' : '📥 Import Settings'}
        </button>
        <small className={styles.configHint}>
          Load settings from previously exported JSON file
        </small>
      </div>

      {/* Reset Settings */}
      <div className={styles.configGroup}>
        <label className={styles.configLabel}>Reset to Defaults</label>
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className={styles.resetButton}
          >
            🔄 Reset All Settings
          </button>
        ) : (
          <div className={styles.confirmReset}>
            <p>Are you sure? This will reset ALL settings to defaults.</p>
            <div className={styles.confirmButtons}>
              <button
                onClick={handleResetSettings}
                disabled={isResetting}
                className={styles.confirmResetButton}
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className={styles.cancelResetButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <small className={styles.configHint}>
          Reset all settings to factory defaults (cannot be undone)
        </small>
      </div>

      {/* Message Display */}
      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}
    </div>
  );
};