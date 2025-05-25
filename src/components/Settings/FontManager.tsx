import React, { useCallback, useState, useRef } from 'react';
import { 
  get, isObject, isFunction, isEmpty, toString
} from 'lodash';
import { useTypographyStore } from '../../stores/typographyStore';
import styles from './FontManager.module.css';

/**
 * Font Management Component
 */
interface FontManagerProps {
  currentFont: string;
  onFontChange: (fontFamily: string) => void;
}

export const FontManager: React.FC<FontManagerProps> = ({ currentFont, onFontChange }) => {
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const typographyStore = useTypographyStore();

  // Predefined fonts (including project fonts)
  const predefinedFonts = [
    { name: 'NVN Proxima Nova Vintage', value: '"NVN Proxima Nova Vintage", sans-serif' },
    { name: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
    { name: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
    { name: 'Serif', value: 'Georgia, Times, serif' },
    { name: 'Monospace', value: 'Monaco, Consolas, monospace' },
    { name: 'NVN Manufaktur Vintage', value: '"NVN Manufaktur Vintage", serif' },
    { name: 'NVN Neutra Vintage', value: '"NVN Neutra Vintage", sans-serif' },
    { name: 'NVN Bebas Kai', value: '"NVN Bebas Kai", sans-serif' },
    { name: 'NVN January', value: '"NVN January", serif' },
  ];

  /**
   * Handle font file upload using storage system
   */
  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const filesArray = isObject(target) ? get(target, 'files') : null;
    const file = filesArray && get(filesArray, '[0]');
    
    if (!isObject(file)) return;

    try {
      setIsLoadingFont(true);
      
      // Use the typography store's upload method
      const success = await typographyStore.loadFontFromFile(file as File);
      
      if (success) {
        console.log(`Successfully uploaded font: ${get(file, 'name', '')}`);
        // Font family is automatically updated by the store
      } else {
        alert('Failed to upload font file. Please try a different file or check file size.');
      }
    } catch (error) {
      console.error('Error uploading font:', error);
      alert('Failed to upload font file. Please try again.');
    } finally {
      setIsLoadingFont(false);
      const fontInput = get(fontFileRef, 'current');
      if (isObject(fontInput) && 'value' in fontInput) {
        fontInput.value = '';
      }
    }
  }, [typographyStore]);

  /**
   * Handle Google Fonts import with enhanced safety
   */
  const handleGoogleFontImport = useCallback(() => {
    const trimmedUrl = toString(googleFontUrl).trim();
    if (isEmpty(trimmedUrl)) return;

    try {
      setIsLoadingFont(true);
      
      let fontFamily = '';
      let linkElement: HTMLLinkElement;

      // Check if it's a Google Fonts URL
      if (trimmedUrl.includes('fonts.googleapis.com') || trimmedUrl.includes('fonts.google.com')) {
        // Extract font family from Google Fonts URL
        const urlMatch = trimmedUrl.match(/family=([^&:]+)/);
        if (urlMatch) {
          fontFamily = get(urlMatch, '[1]', '').replace(/\+/g, ' ');
          
          // Enhanced document head access
          const documentHead = get(document, 'head');
          if (isObject(documentHead)) {
            linkElement = document.createElement('link');
            linkElement.href = trimmedUrl;
            linkElement.rel = 'stylesheet';
            documentHead.appendChild(linkElement);
          }
        }
      } else {
        // Treat as direct CSS import URL
        const cssRule = `@import url('${trimmedUrl}');`;
        const styleElement = document.createElement('style');
        styleElement.textContent = cssRule;
        
        const documentHead = get(document, 'head');
        if (isObject(documentHead)) {
          documentHead.appendChild(styleElement);
        }
        
        // Try to extract font name from URL
        const nameMatch = trimmedUrl.match(/([^/]+)\.css/);
        fontFamily = nameMatch ? get(nameMatch, '[1]', 'Imported Font').replace(/[-_]/g, ' ') : 'Imported Font';
      }

      if (!isEmpty(fontFamily)) {
        const fullFontFamily = `"${fontFamily}", sans-serif`;
        
        if (isFunction(onFontChange)) {
          onFontChange(fullFontFamily);
        }
        
        setGoogleFontUrl('');
        console.log(`Successfully imported Google Font: ${fontFamily}`);
      }
    } catch (error) {
      console.error('Error importing Google Font:', error);
      alert('Failed to import Google Font. Please check the URL.');
    } finally {
      setIsLoadingFont(false);
    }
  }, [googleFontUrl, onFontChange]);

  /**
   * Handle font selection change with safety
   */
  const handleFontSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    
    if (isFunction(onFontChange) && !isEmpty(value)) {
      onFontChange(value);
    }
  }, [onFontChange]);

  // Safe click handler for font upload
  const handleFontUploadClick = useCallback(() => {
    const fontInput = get(fontFileRef, 'current');
    if (isObject(fontInput) && isFunction(get(fontInput, 'click'))) {
      fontInput.click();
    }
  }, []);

  return (
    <div className={styles.fontManager}>
      {/* Font Selection */}
      <div className={styles.fontGroup}>
        <label className={styles.fontLabel}>Current Font</label>
        <select
          value={currentFont}
          onChange={handleFontSelect}
          className={styles.fontSelect}
        >
          <optgroup label="System Fonts">
            {predefinedFonts.map(font => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </optgroup>
          {typographyStore.customFontData && (
            <optgroup label="Custom Font">
              <option value={typographyStore.fontFamily}>
                {typographyStore.customFontData.fontFamily} (Uploaded)
              </option>
            </optgroup>
          )}
        </select>
      </div>

      {/* Font Preview */}
      <div className={styles.fontPreview}>
        <span style={{ fontFamily: currentFont }}>
          This is how your lyrics will look with this font
        </span>
      </div>

      {/* Font Upload */}
      <div className={styles.fontUploadGroup}>
        <label className={styles.fontLabel}>Upload Custom Font</label>
        <div className={styles.fontUploadWrapper}>
          <input
            ref={fontFileRef}
            type="file"
            accept=".ttf,.woff,.woff2,.otf"
            onChange={handleFontUpload}
            className={styles.hiddenInput}
          />
          <button
            onClick={handleFontUploadClick}
            disabled={isLoadingFont}
            className={styles.uploadButton}
          >
            {isLoadingFont ? 'Uploading...' : '📁 Upload Font File'}
          </button>
          <span className={styles.uploadHint}>
            Supports .ttf, .woff, .woff2, .otf files (saved to localStorage)
          </span>
          {typographyStore.customFontData && (
            <div className={styles.uploadedInfo}>
              ✅ Custom font loaded: {typographyStore.customFontData.fontFamily}
            </div>
          )}
        </div>
      </div>

      {/* Google Fonts Import */}
      <div className={styles.googleFontGroup}>
        <label className={styles.fontLabel}>Import Google Font</label>
        <div className={styles.googleFontWrapper}>
          <input
            type="text"
            value={googleFontUrl}
            onChange={(e) => setGoogleFontUrl(e.target.value)}
            placeholder="Paste Google Fonts URL here..."
            className={styles.googleFontInput}
          />
          <button
            onClick={handleGoogleFontImport}
            disabled={!googleFontUrl.trim() || isLoadingFont}
            className={styles.importButton}
          >
            {isLoadingFont ? 'Loading...' : '🔗 Import'}
          </button>
        </div>
        <div className={styles.googleFontHint}>
          <p>Get fonts from <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">Google Fonts</a></p>
          <small>Example: https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap</small>
        </div>
      </div>
    </div>
  );
};