import React from 'react';
import { get } from 'lodash';
import { useLyricStore } from '../../stores/lyricStore';
import styles from './TimingSettings.module.css';

interface TimingSettingsProps {
  onDelayChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TimingSettings: React.FC<TimingSettingsProps> = ({
  onDelayChange,
}) => {
  const lyricStore = useLyricStore();
  
  const { lyricDelay } = lyricStore;

  return (
    <div className={get(styles, 'section', '')}>
      <h3>⏱️ Timing</h3>
      <div className={get(styles, 'delayGroup', '')}>
        <label className={get(styles, 'delayLabel', '')}>
          Lyric Delay
          <div className={get(styles, 'delayInputWrapper', '')}>
            <input
              type="number"
              value={lyricDelay}
              onChange={onDelayChange}
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
  );
};