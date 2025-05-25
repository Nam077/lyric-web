import React from 'react';
import { get } from 'lodash';
import type { WordEffect } from '../LyricAnimation/Word';
import styles from './EffectSelector.module.css';

interface EffectSelectorProps {
  selectedEffect?: WordEffect;
  onEffectChange: (effect: WordEffect | undefined) => void;
  lyricIndex?: number;
}

const EFFECT_OPTIONS: { value: WordEffect | 'auto'; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto (Based on Index)', description: 'Automatically select effect based on lyric index' },
  { value: 'wordAppear', label: 'Word Appear', description: 'Words appear with bouncy entrance animation' },
  { value: 'bounce', label: 'Bounce', description: 'Words bounce up and down' },
  { value: 'shake', label: 'Shake', description: 'Words shake left and right' },
  { value: 'pulse', label: 'Pulse', description: 'Words scale in and out' },
  { value: 'glow', label: 'Glow', description: 'Words glow with light effect' },
  { value: 'flip', label: 'Flip', description: 'Words flip horizontally' },
  { value: 'zoom', label: 'Zoom', description: 'Words zoom in and out' },
  { value: 'slide', label: 'Slide', description: 'Words slide left and right' },
  { value: 'rainbow', label: 'Rainbow', description: 'Words show rainbow colors' },
  { value: 'wave', label: 'Wave', description: 'Words wave like ocean' },
  { value: 'float', label: 'Float', description: 'Words float up and down gently' },
  { value: 'blur', label: 'Blur', description: 'Words blur in and out' },
  { value: 'neon', label: 'Neon', description: 'Words glow with neon effect' }
  // Removed rotate and typewriter - they don't work well with individual word rendering
];

/**
 * Component for selecting word effects
 */
export const EffectSelector: React.FC<EffectSelectorProps> = ({
  selectedEffect,
  onEffectChange,
  lyricIndex
}) => {
  const handleEffectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as WordEffect | 'auto';
    onEffectChange(value === 'auto' ? undefined : value);
  };

  const currentValue = selectedEffect || 'auto';

  return (
    <div className={get(styles, 'effectSelector', '')}>
      <label className={get(styles, 'label', '')}>
        Word Effect {lyricIndex !== undefined && `(Lyric ${lyricIndex + 1})`}
      </label>
      <select
        value={currentValue}
        onChange={handleEffectChange}
        className={get(styles, 'select', '')}
      >
        {EFFECT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className={get(styles, 'description', '')}>
        {EFFECT_OPTIONS.find(opt => opt.value === currentValue)?.description}
      </p>
    </div>
  );
};

export default EffectSelector;