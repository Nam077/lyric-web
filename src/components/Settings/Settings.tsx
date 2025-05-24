import React, { useCallback, useState, useRef } from 'react';
import { 
  get, isObject, isFunction, isString, isNumber, 
  clamp, toNumber, toString, isEmpty
} from 'lodash';
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
   * Handle font file upload with lodash safety
   */
  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const filesArray = isObject(target) ? get(target, 'files') : null;
    const file = filesArray && get(filesArray, '[0]');
    
    if (!isObject(file)) return;

    // Enhanced file validation with lodash safety
    const fileName = get(file, 'name', '');
    const validTypes = ['.ttf', '.woff', '.woff2', '.otf'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please upload a valid font file (.ttf, .woff, .woff2, .otf)');
      return;
    }

    try {
      setIsLoadingFont(true);
      
      // Create object URL for the font file with safe URL handling
      const fontUrl = URL.createObjectURL(file);
      const fontName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
      
      // Enhanced FontFace creation with error handling
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      
      // Safe document fonts access
      const documentFonts = get(document, 'fonts');
      if (isObject(documentFonts) && isFunction(get(documentFonts, 'add'))) {
        documentFonts.add(fontFace);
      }
      
      // Add to custom fonts list and select it
      const fontFamily = `"${fontName}", sans-serif`;
      setCustomFonts(prev => [...prev, fontFamily]);
      
      if (isFunction(onFontChange)) {
        onFontChange(fontFamily);
      }
      
      console.log(`Successfully loaded font: ${fontName}`);
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Failed to load font file. Please try a different file.');
    } finally {
      setIsLoadingFont(false);
      const fontInput = get(fontFileRef, 'current');
      if (isObject(fontInput) && 'value' in fontInput) {
        fontInput.value = '';
      }
    }
  }, [onFontChange]);

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
        setCustomFonts(prev => [...prev, fullFontFamily]);
        
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
            onClick={handleFontUploadClick}
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
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textCase: 'normal' | 'uppercase' | 'lowercase';
  mergeSentences: boolean;
  onColorChange: (colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => void;
  onDelayChange: (delay: number) => void;
  onFontChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onLetterSpacingChange: (letterSpacing: number) => void;
  onLineHeightChange: (lineHeight: number) => void;
  onTextCaseChange: (textCase: 'normal' | 'uppercase' | 'lowercase') => void;
  onMergeSentencesChange: (mergeSentences: boolean) => void;
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
  fontSize,
  letterSpacing,
  lineHeight,
  textCase,
  mergeSentences,
  onColorChange,
  onDelayChange,
  onFontChange,
  onFontSizeChange,
  onLetterSpacingChange,
  onLineHeightChange,
  onTextCaseChange,
  onMergeSentencesChange
}) => {
  /**
   * Enhanced color change handler with lodash safety
   */
  const handleColorChange = useCallback((colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => {
    if (isFunction(onColorChange) && isString(color)) {
      onColorChange(colorType, color);
    }
  }, [onColorChange]);

  /**
   * Enhanced delay change handler with lodash safety
   */
  const handleDelayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    
    // Allow empty string for clearing the input
    if (value === '') {
      if (isFunction(onDelayChange)) {
        onDelayChange(0);
      }
      return;
    }
    
    // Enhanced number parsing with lodash
    const numericValue = toNumber(value);
    if (isNumber(numericValue) && !isNaN(numericValue) && isFunction(onDelayChange)) {
      onDelayChange(clamp(numericValue, -5000, 5000));
    }
  }, [onDelayChange]);

  /**
   * Enhanced font size change handler
   */
  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue) && numericValue > 0 && isFunction(onFontSizeChange)) {
      onFontSizeChange(clamp(numericValue, 0.5, 20));
    }
  }, [onFontSizeChange]);

  /**
   * Enhanced letter spacing change handler
   */
  const handleLetterSpacingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue) && isFunction(onLetterSpacingChange)) {
      onLetterSpacingChange(clamp(numericValue, -2, 5));
    }
  }, [onLetterSpacingChange]);

  /**
   * Enhanced line height change handler
   */
  const handleLineHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    const numericValue = toNumber(value);
    
    if (isNumber(numericValue) && !isNaN(numericValue) && numericValue > 0 && isFunction(onLineHeightChange)) {
      onLineHeightChange(clamp(numericValue, 0.5, 5));
    }
  }, [onLineHeightChange]);

  /**
   * Enhanced text case change handler
   */
  const handleTextCaseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const value = get(target, 'value', '');
    
    if (isString(value) && ['normal', 'uppercase', 'lowercase'].includes(value) && isFunction(onTextCaseChange)) {
      onTextCaseChange(value as 'normal' | 'uppercase' | 'lowercase');
    }
  }, [onTextCaseChange]);

  /**
   * Handle merge toggle div click
   */
  const handleMergeToggleClick = useCallback(() => {
    if (isFunction(onMergeSentencesChange)) {
      onMergeSentencesChange(!mergeSentences);
    }
  }, [onMergeSentencesChange, mergeSentences]);

  // Safe close handler
  const handleClose = useCallback(() => {
    if (isFunction(onClose)) {
      onClose();
    }
  }, [onClose]);

  // Enhanced color input handlers
  const createColorChangeHandler = useCallback((colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor') => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isObject(e)) return;
      
      const target = get(e, 'target');
      const value = get(target, 'value', '');
      
      if (isString(value) && !isEmpty(value)) {
        handleColorChange(colorType, value);
      }
    };
  }, [handleColorChange]);

  if (!isOpen) return null;

  return (
    <div className={get(styles, 'overlay', '')} onClick={handleClose}>
      <div 
        className={get(styles, 'container', '')} 
        onClick={(e) => {
          if (isObject(e) && isFunction(get(e, 'stopPropagation'))) {
            e.stopPropagation();
          }
        }}
      >
        <div className={get(styles, 'header', '')}>
          <h2>Lyric Animation Settings</h2>
          <button 
            className={get(styles, 'closeButton', '')} 
            onClick={handleClose} 
            title="Close Settings"
          >
            ✕
          </button>
        </div>

        <div className={get(styles, 'content', '')}>
          {/* Font & Typography Section */}
          <div className={get(styles, 'section', '')}>
            <h3>🔤 Font & Typography</h3>
            
            {/* Font Management */}
            <FontManager
              currentFont={fontFamily}
              onFontChange={onFontChange}
            />

            {/* Typography Controls Grid */}
            <div className={get(styles, 'typographyGrid', '')}>
              {/* Font Size */}
              <div className={get(styles, 'typographyGroup', '')}>
                <label className={get(styles, 'typographyLabel', '')}>
                  Font Size
                  <input
                    type="number"
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className={get(styles, 'typographyInput', '')}
                    min="0.5"
                    max="20"
                    step="0.1"
                    placeholder="4.0"
                  />
                  <span className={get(styles, 'inputUnit', '')}>em</span>
                </label>
              </div>

              {/* Letter Spacing */}
              <div className={get(styles, 'typographyGroup', '')}>
                <label className={get(styles, 'typographyLabel', '')}>
                  Letter Spacing
                  <input
                    type="number"
                    value={letterSpacing}
                    onChange={handleLetterSpacingChange}
                    className={get(styles, 'typographyInput', '')}
                    min="-2"
                    max="5"
                    step="0.1"
                    placeholder="0.2"
                  />
                  <span className={get(styles, 'inputUnit', '')}>em</span>
                </label>
              </div>

              {/* Line Height */}
              <div className={get(styles, 'typographyGroup', '')}>
                <label className={get(styles, 'typographyLabel', '')}>
                  Line Height
                  <input
                    type="number"
                    value={lineHeight}
                    onChange={handleLineHeightChange}
                    className={get(styles, 'typographyInput', '')}
                    min="0.5"
                    max="5"
                    step="0.1"
                    placeholder="1.2"
                  />
                </label>
              </div>

              {/* Text Case */}
              <div className={get(styles, 'typographyGroup', '')}>
                <label className={get(styles, 'typographyLabel', '')}>
                  Text Case
                  <select
                    value={textCase}
                    onChange={handleTextCaseChange}
                    className={get(styles, 'textCaseSelect', '')}
                  >
                    <option value="normal">Normal</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className={get(styles, 'section', '')}>
            <h3>🎨 Appearance</h3>
            
            <div className={get(styles, 'colorGrid', '')}>
              {/* Text Color */}
              <div className={get(styles, 'colorGroup', '')}>
                <label className={get(styles, 'colorLabel', '')}>
                  Text Color
                  <div className={get(styles, 'colorInputWrapper', '')}>
                    <div 
                      className={get(styles, 'colorPreview', '')}
                      style={{ backgroundColor: textColor }}
                    />
                    <input
                      type="color"
                      value={textColor}
                      onChange={createColorChangeHandler('textColor')}
                      className={get(styles, 'colorInput', '')}
                    />
                    <span className={get(styles, 'colorValue', '')}>{textColor}</span>
                  </div>
                </label>
              </div>

              {/* Text Shadow Color */}
              <div className={get(styles, 'colorGroup', '')}>
                <label className={get(styles, 'colorLabel', '')}>
                  Text Shadow
                  <div className={get(styles, 'colorInputWrapper', '')}>
                    <div 
                      className={get(styles, 'colorPreview', '')}
                      style={{ backgroundColor: textShadowColor }}
                    />
                    <input
                      type="color"
                      value={textShadowColor}
                      onChange={createColorChangeHandler('textShadowColor')}
                      className={get(styles, 'colorInput', '')}
                    />
                    <span className={get(styles, 'colorValue', '')}>{textShadowColor}</span>
                  </div>
                </label>
              </div>

              {/* Primary Background Color */}
              <div className={get(styles, 'colorGroup', '')}>
                <label className={get(styles, 'colorLabel', '')}>
                  Background Primary
                  <div className={get(styles, 'colorInputWrapper', '')}>
                    <div 
                      className={get(styles, 'colorPreview', '')}
                      style={{ backgroundColor: primaryColor }}
                    />
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={createColorChangeHandler('primaryColor')}
                      className={get(styles, 'colorInput', '')}
                    />
                    <span className={get(styles, 'colorValue', '')}>{primaryColor}</span>
                  </div>
                </label>
              </div>

              {/* Secondary Background Color */}
              <div className={get(styles, 'colorGroup', '')}>
                <label className={get(styles, 'colorLabel', '')}>
                  Background Secondary
                  <div className={get(styles, 'colorInputWrapper', '')}>
                    <div 
                      className={get(styles, 'colorPreview', '')}
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={createColorChangeHandler('secondaryColor')}
                      className={get(styles, 'colorInput', '')}
                    />
                    <span className={get(styles, 'colorValue', '')}>{secondaryColor}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Timing Section */}
          <div className={get(styles, 'section', '')}>
            <h3>⏱️ Timing</h3>
            <div className={get(styles, 'delayGroup', '')}>
              <label className={get(styles, 'delayLabel', '')}>
                Lyric Delay
                <div className={get(styles, 'delayInputWrapper', '')}>
                  <input
                    type="number"
                    value={lyricDelay}
                    onChange={handleDelayChange}
                    className={get(styles, 'delayInput', '')}
                    min="-5000"
                    max="5000"
                    step="100"
                    placeholder="0"
                  />
                  <span className={get(styles, 'delayUnit', '')}>ms</span>
                </div>
              </label>
              <small className={get(styles, 'delayHint', '')}>
                Positive values delay lyrics, negative values make them appear earlier
              </small>
            </div>
          </div>

          {/* Display Options Section */}
          <div className={get(styles, 'section', '')}>
            <h3>📜 Display Options</h3>
            <div className={get(styles, 'mergeGroup', '')}>
              <div 
                className={get(styles, 'mergeToggle', '')}
                onClick={handleMergeToggleClick}
              >
                <div className={`${get(styles, 'mergeCheckbox', '')} ${mergeSentences ? get(styles, 'checked', '') : ''}`}>
                  {/* Checkmark will be added via CSS */}
                </div>
                <div>
                  <div className={get(styles, 'mergeLabel', '')}>Merge sentences into single lines</div>
                  <div className={get(styles, 'mergeDescription', '')}>
                    When enabled, all words in a sentence will display together as one line with timing from first to last word
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={get(styles, 'footer', '')}>
          <div className={get(styles, 'shortcuts', '')}>
            <span><kbd>I</kbd> Toggle Settings</span>
            <span><kbd>U</kbd> Upload Files</span>
            <span><kbd>P</kbd> Audio Player</span>
          </div>
        </div>
      </div>
    </div>
  );
};