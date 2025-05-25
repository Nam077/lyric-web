import React from 'react';
import { get } from 'lodash';
import { useAppearanceStore } from '../../stores/appearanceStore';
import type { WordEffect } from '../LyricAnimation/Word';
import styles from './EffectSettings.module.css';

const EFFECT_OPTIONS: { value: WordEffect; label: string; description: string }[] = [
  { value: 'bounce', label: 'Bounce', description: 'Words bounce up and down' },
  { value: 'wordAppear', label: 'Word Appear', description: 'Words appear with gentle fade and scale' },
  { value: 'shake', label: 'Shake', description: 'Words shake left and right' },
  { value: 'pulse', label: 'Pulse', description: 'Words scale in and out' },
  { value: 'glow', label: 'Glow', description: 'Words glow with light effect' },
  { value: 'flip', label: 'Flip', description: 'Words flip horizontally' },
  { value: 'zoom', label: 'Zoom', description: 'Words zoom in and out' },
  { value: 'slide', label: 'Slide', description: 'Words slide left and right' },
  { value: 'rainbow', label: 'Rainbow', description: 'Words cycle through rainbow colors' },
  { value: 'wave', label: 'Wave', description: 'Words rotate like a wave' },
  { value: 'float', label: 'Float', description: 'Words float up and down' },
  { value: 'blur', label: 'Blur', description: 'Words blur in and out' },
  { value: 'neon', label: 'Neon', description: 'Words have neon brightness effect' }
];

const FREQUENCY_OPTIONS = [
  { value: 1, label: 'Every Lyric', description: 'Effect changes with each lyric line' },
  { value: 2, label: 'Every 2 Lines', description: 'Effect changes every 2 lyric lines' },
  { value: 3, label: 'Every 3 Lines', description: 'Effect changes every 3 lyric lines' },
  { value: 4, label: 'Every 4 Lines', description: 'Effect changes every 4 lyric lines' },
  { value: 5, label: 'Every 5 Lines', description: 'Effect changes every 5 lyric lines' },
  { value: 10, label: 'Rarely', description: 'Effect changes every 10 lyric lines' }
];

export const EffectSettings: React.FC = () => {
  const {
    effectMode,
    effectChangeFrequency,
    fixedEffect,
    manualEffect,
    setEffectMode,
    setEffectChangeFrequency,
    setFixedEffect,
    setManualEffect,
    resetEffectSettings
  } = useAppearanceStore();

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as 'auto' | 'manual' | 'fixed';
    setEffectMode(mode);
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = parseInt(event.target.value, 10);
    setEffectChangeFrequency(frequency);
  };

  const handleFixedEffectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const effect = event.target.value as WordEffect;
    setFixedEffect(effect);
  };

  const handleManualEffectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const effect = event.target.value as WordEffect;
    setManualEffect(effect);
  };

  return (
    <div className={get(styles, 'effectSettings', '')}>
      <h3 className={get(styles, 'sectionTitle', '')}>Effect Settings</h3>
      
      {/* Effect Mode */}
      <div className={get(styles, 'settingGroup', '')}>
        <label className={get(styles, 'label', '')}>Effect Mode</label>
        <select 
          value={effectMode} 
          onChange={handleModeChange}
          className={get(styles, 'select', '')}
        >
          <option value="auto">Auto (Cycle Through Effects)</option>
          <option value="fixed">Fixed (Single Effect)</option>
          <option value="manual">Manual (Choose Effect)</option>
        </select>
        <div className={get(styles, 'description', '')}>
          {effectMode === 'auto' && 'Automatically cycles through different effects'}
          {effectMode === 'fixed' && 'Uses the same effect for all lyrics'}
          {effectMode === 'manual' && 'Uses your chosen effect for all lyrics'}
        </div>
      </div>

      {/* Effect Change Frequency (only for auto mode) */}
      {effectMode === 'auto' && (
        <div className={get(styles, 'settingGroup', '')}>
          <label className={get(styles, 'label', '')}>Effect Change Frequency</label>
          <select 
            value={effectChangeFrequency} 
            onChange={handleFrequencyChange}
            className={get(styles, 'select', '')}
          >
            {FREQUENCY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={get(styles, 'description', '')}>
            {FREQUENCY_OPTIONS.find(opt => opt.value === effectChangeFrequency)?.description}
          </div>
        </div>
      )}

      {/* Fixed Effect Selector (only for fixed mode) */}
      {effectMode === 'fixed' && (
        <div className={get(styles, 'settingGroup', '')}>
          <label className={get(styles, 'label', '')}>Fixed Effect</label>
          <select 
            value={fixedEffect || 'pulse'} 
            onChange={handleFixedEffectChange}
            className={get(styles, 'select', '')}
          >
            {EFFECT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={get(styles, 'description', '')}>
            {EFFECT_OPTIONS.find(opt => opt.value === (fixedEffect || 'pulse'))?.description}
          </div>
        </div>
      )}

      {/* Manual Effect Selector (only for manual mode) */}
      {effectMode === 'manual' && (
        <div className={get(styles, 'settingGroup', '')}>
          <label className={get(styles, 'label', '')}>Manual Effect</label>
          <select 
            value={manualEffect || 'bounce'} 
            onChange={handleManualEffectChange}
            className={get(styles, 'select', '')}
          >
            {EFFECT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={get(styles, 'description', '')}>
            {EFFECT_OPTIONS.find(opt => opt.value === (manualEffect || 'bounce'))?.description}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className={get(styles, 'settingGroup', '')}>
        <button 
          onClick={resetEffectSettings}
          className={get(styles, 'resetButton', '')}
        >
          Reset Effect Settings
        </button>
      </div>
    </div>
  );
};