import React, { useCallback, useState, useRef } from 'react';
import styles from './Settings.module.css';

/**
 * Font Management Component
 */
interface FontManagerProps {
  currentFont: string;
  onFontChange: (fontFamily: string) => void;
}

const FontManager: React.FC<FontManagerProps> = ({ currentFont, onFontChange }) => {
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const fontFileRef = useRef<HTMLInputElement>(null);

  // Predefined fonts (including project fonts)
  const predefinedFonts = [
    { name: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
    { name: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
    { name: 'Serif', value: 'Georgia, Times, serif' },
    { name: 'Monospace', value: 'Monaco, Consolas, monospace' },
    { name: 'NVN Manufaktur Vintage', value: '"NVN Manufaktur Vintage", serif' },
    { name: 'NVN Neutra Vintage', value: '"NVN Neutra Vintage", sans-serif' },
    { name: 'NVN Proxima Nova Vintage', value: '"NVN Proxima Nova Vintage", sans-serif' },
    { name: 'NVN Bebas Kai', value: '"NVN Bebas Kai", sans-serif' },
    { name: 'NVN January', value: '"NVN January", serif' },
  ];

  /**
   * Handle font file upload
   */
  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.ttf', '.woff', '.woff2', '.otf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please upload a valid font file (.ttf, .woff, .woff2, .otf)');
      return;
    }

    try {
      setIsLoadingFont(true);
      
      // Create object URL for the font file
      const fontUrl = URL.createObjectURL(file);
      const fontName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      
      // Create CSS font-face rule
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      
      // Add font to document
      document.fonts.add(fontFace);
      
      // Add to custom fonts list and select it
      const fontFamily = `"${fontName}", sans-serif`;
      setCustomFonts(prev => [...prev, fontFamily]);
      onFontChange(fontFamily);
      
      console.log(`Successfully loaded font: ${fontName}`);
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Failed to load font file. Please try a different file.');
    } finally {
      setIsLoadingFont(false);
      if (fontFileRef.current) {
        fontFileRef.current.value = '';
      }
    }
  }, [onFontChange]);

  /**
   * Handle Google Fonts import
   */
  const handleGoogleFontImport = useCallback(() => {
    if (!googleFontUrl.trim()) return;

    try {
      setIsLoadingFont(true);
      
      let fontFamily = '';
      let linkElement: HTMLLinkElement;

      // Check if it's a Google Fonts URL
      if (googleFontUrl.includes('fonts.googleapis.com') || googleFontUrl.includes('fonts.google.com')) {
        // Extract font family from Google Fonts URL
        const urlMatch = googleFontUrl.match(/family=([^&:]+)/);
        if (urlMatch) {
          fontFamily = urlMatch[1].replace(/\+/g, ' ');
          
          // Create link element for Google Fonts
          linkElement = document.createElement('link');
          linkElement.href = googleFontUrl;
          linkElement.rel = 'stylesheet';
          document.head.appendChild(linkElement);
        }
      } else {
        // Treat as direct CSS import URL
        const cssRule = `@import url('${googleFontUrl}');`;
        const styleElement = document.createElement('style');
        styleElement.textContent = cssRule;
        document.head.appendChild(styleElement);
        
        // Try to extract font name from URL
        const nameMatch = googleFontUrl.match(/([^/]+)\.css/);
        fontFamily = nameMatch ? nameMatch[1].replace(/[-_]/g, ' ') : 'Imported Font';
      }

      if (fontFamily) {
        const fullFontFamily = `"${fontFamily}", sans-serif`;
        setCustomFonts(prev => [...prev, fullFontFamily]);
        onFontChange(fullFontFamily);
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
   * Handle font selection change
   */
  const handleFontSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFontChange(e.target.value);
  }, [onFontChange]);

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
          {customFonts.length > 0 && (
            <optgroup label="Custom Fonts">
              {customFonts.map(font => (
                <option key={font} value={font}>
                  {font.replace(/['"]/g, '').split(',')[0]}
                </option>
              ))}
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
            onClick={() => fontFileRef.current?.click()}
            disabled={isLoadingFont}
            className={styles.uploadButton}
          >
            {isLoadingFont ? 'Loading...' : '📁 Upload Font File'}
          </button>
          <span className={styles.uploadHint}>
            Supports .ttf, .woff, .woff2, .otf files
          </span>
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

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  textShadowColor: string;
  lyricDelay: number;
  fontFamily: string;
  onColorChange: (colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => void;
  onDelayChange: (delay: number) => void;
  onFontChange: (fontFamily: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  primaryColor,
  secondaryColor,
  textColor,
  textShadowColor,
  lyricDelay,
  fontFamily,
  onColorChange,
  onDelayChange,
  onFontChange
}) => {
  const handleColorChange = useCallback((colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => {
    onColorChange(colorType, color);
  }, [onColorChange]);

  const handleDelayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for clearing the input
    if (value === '') {
      onDelayChange(0);
      return;
    }
    
    // Parse the number and allow negative values
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      onDelayChange(numericValue);
    }
  }, [onDelayChange]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Lyric Animation Settings</h2>
          <button className={styles.closeButton} onClick={onClose} title="Close Settings">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Colors Section */}
          <div className={styles.section}>
            <h3>Colors</h3>
            
            {/* Primary Color */}
            <div className={styles.colorGroup}>
              <label className={styles.colorLabel}>
                Primary Color (Background Stripe)
                <div className={styles.colorInputWrapper}>
                  <div 
                    className={styles.colorPreview}
                    style={{ backgroundColor: primaryColor }}
                  />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{primaryColor}</span>
                </div>
              </label>
            </div>

            {/* Secondary Color */}
            <div className={styles.colorGroup}>
              <label className={styles.colorLabel}>
                Secondary Color (Background Stripe)
                <div className={styles.colorInputWrapper}>
                  <div 
                    className={styles.colorPreview}
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{secondaryColor}</span>
                </div>
              </label>
            </div>

            {/* Text Color */}
            <div className={styles.colorGroup}>
              <label className={styles.colorLabel}>
                Text Color
                <div className={styles.colorInputWrapper}>
                  <div 
                    className={styles.colorPreview}
                    style={{ backgroundColor: textColor }}
                  />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{textColor}</span>
                </div>
              </label>
            </div>

            {/* Text Shadow Color */}
            <div className={styles.colorGroup}>
              <label className={styles.colorLabel}>
                Text Shadow Color
                <div className={styles.colorInputWrapper}>
                  <div 
                    className={styles.colorPreview}
                    style={{ backgroundColor: textShadowColor }}
                  />
                  <input
                    type="color"
                    value={textShadowColor}
                    onChange={(e) => handleColorChange('textShadowColor', e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{textShadowColor}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Lyric Delay Section */}
          <div className={styles.section}>
            <h3>Lyric Delay</h3>
            <div className={styles.delayGroup}>
              <input
                type="number"
                value={lyricDelay}
                onChange={handleDelayChange}
                className={styles.delayInput}
                min="-5000"
                max="5000"
                step="100"
                placeholder="0"
              />
              <span className={styles.delayUnit}>ms</span>
            </div>
          </div>

          {/* Font Management Section */}
          <div className={styles.section}>
            <h3>Font Settings</h3>
            <FontManager
              currentFont={fontFamily}
              onFontChange={onFontChange}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.shortcuts}>
            <span><kbd>I</kbd> Toggle Settings</span>
            <span><kbd>U</kbd> Upload Files</span>
            <span><kbd>P</kbd> Audio Player</span>
          </div>
        </div>
      </div>
    </div>
  );
};