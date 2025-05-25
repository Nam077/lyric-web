import React from 'react';
import { get } from 'lodash';
import { useTypographyStore } from '../../stores/typographyStore';
import styles from './TypographySettings.module.css';
import { FontManager } from './FontManager';

interface TypographySettingsProps {
  onFontSizeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLetterSpacingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLineHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextCaseChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const TypographySettings: React.FC<TypographySettingsProps> = ({
  onFontSizeChange,
  onLetterSpacingChange,
  onLineHeightChange,
  onTextCaseChange,
}) => {
  const typographyStore = useTypographyStore();
  
  const {
    fontFamily,
    fontSize,
    letterSpacing,
    lineHeight,
    textCase
  } = typographyStore;

  return (
    <div className={get(styles, 'section', '')}>
      <h3>🔤 Font & Typography</h3>
      
      {/* Font Management */}
      <FontManager
        currentFont={fontFamily}
        onFontChange={typographyStore.setFontFamily}
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
              onChange={onFontSizeChange}
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
              onChange={onLetterSpacingChange}
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
              onChange={onLineHeightChange}
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
              onChange={onTextCaseChange}
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
  );
};