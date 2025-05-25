import React from 'react';
import { get } from 'lodash';
import { useLyricStore } from '../../stores/lyricStore';
import styles from './DisplayOptionsSettings.module.css';

interface DisplayOptionsSettingsProps {
  onMergeToggleClick: () => void;
}

export const DisplayOptionsSettings: React.FC<DisplayOptionsSettingsProps> = ({
  onMergeToggleClick,
}) => {
  const lyricStore = useLyricStore();
  
  const { mergeSentences } = lyricStore;

  return (
    <div className={get(styles, 'section', '')}>
      <h3>📜 Display Options</h3>
      <div className={get(styles, 'mergeGroup', '')}>
        <div 
          className={get(styles, 'mergeToggle', '')}
          onClick={onMergeToggleClick}
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
  );
};