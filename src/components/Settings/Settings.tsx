import React from 'react';
import { get, isObject, isFunction } from 'lodash';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsHandlers } from '../../hooks/useSettingsHandlers';
import { TypographySettings } from './TypographySettings';
import { AppearanceSettings } from './AppearanceSettings';
import { TimingSettings } from './TimingSettings';
import { DisplayOptionsSettings } from './DisplayOptionsSettings';
import { ConfigManager } from '../ConfigManager';
import styles from './Settings.module.css';

export const Settings: React.FC = () => {
  const uiStore = useUIStore();
  const {
    handleClose,
    handleDelayChange,
    handleFontSizeChange,
    handleLetterSpacingChange,
    handleLineHeightChange,
    handleTextCaseChange,
    handleMergeToggleClick,
    createColorChangeHandler,
  } = useSettingsHandlers();

  const { showSettings: isOpen } = uiStore;

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
          <TypographySettings
            onFontSizeChange={handleFontSizeChange}
            onLetterSpacingChange={handleLetterSpacingChange}
            onLineHeightChange={handleLineHeightChange}
            onTextCaseChange={handleTextCaseChange}
          />

          {/* Appearance Section */}
          <AppearanceSettings
            createColorChangeHandler={createColorChangeHandler}
          />

          {/* Timing Section */}
          <TimingSettings
            onDelayChange={handleDelayChange}
          />

          {/* Display Options Section */}
          <DisplayOptionsSettings
            onMergeToggleClick={handleMergeToggleClick}
          />

          {/* Configuration Management Section */}
          <div className={get(styles, 'section', '')}>
            <h3>⚙️ Configuration Management</h3>
            <ConfigManager onClose={handleClose} />
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