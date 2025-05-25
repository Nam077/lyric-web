import React from 'react';
import { get } from 'lodash';
import { useAppearanceStore } from '../../stores/appearanceStore';
import styles from './AppearanceSettings.module.css';

interface AppearanceSettingsProps {
  createColorChangeHandler: (colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor') => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  createColorChangeHandler,
}) => {
  const appearanceStore = useAppearanceStore();
  
  const {
    primaryColor,
    secondaryColor,
    textColor,
    textShadowColor
  } = appearanceStore;

  return (
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
  );
};