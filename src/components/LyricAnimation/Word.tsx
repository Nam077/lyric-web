import React from 'react';
import { get, toUpper, toLower } from 'lodash';
import type { WordTiming } from '../../utils/lyricParser';
import { useAppearanceStore } from '../../stores/appearanceStore';
import styles from './Word.module.css';

export type WordEffect = 
  | 'bounce' 
  | 'shake' 
  | 'pulse' 
  | 'glow' 
  | 'flip' 
  | 'zoom' 
  | 'slide' 
  | 'rainbow' 
  | 'wave' 
  | 'float'
  | 'blur'
  | 'neon';

interface WordProps {
  word: WordTiming;
  index: number;
  isVisible: boolean;
  color: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  lyricIndex: number;
  isLastWord: boolean;
  effect?: WordEffect;
  animationDelay?: number;
}

/**
 * Get word effect based on lyric index and effect settings
 */
const getEffectBySettings = (
  lyricIndex: number, 
  effectMode: 'auto' | 'manual' | 'fixed',
  effectChangeFrequency: number,
  fixedEffect: WordEffect | null,
  manualEffect: WordEffect | null
): WordEffect => {
  const effects: WordEffect[] = [
    'bounce', 'shake', 'pulse', 'glow', 'flip', 
    'zoom', 'slide', 'rainbow', 'wave', 'float',
    'blur', 'neon'
  ];

  switch (effectMode) {
    case 'fixed':
      return fixedEffect || 'pulse';
    
    case 'manual':
      return manualEffect || 'bounce';
    
    case 'auto':
    default: {
      // Use frequency to reduce how often effects change
      const effectIndex = Math.floor(lyricIndex / effectChangeFrequency);
      return effects[effectIndex % effects.length];
    }
  }
};

export const Word: React.FC<WordProps> = React.memo(({ 
  word, 
  index, 
  isVisible, 
  color, 
  textCase, 
  lyricIndex, 
  isLastWord,
  effect,
  animationDelay = 0
}) => {
  const [effectActive, setEffectActive] = React.useState(false);
  
  // Get effect settings from appearance store
  const { 
    effectMode, 
    effectChangeFrequency, 
    fixedEffect, 
    manualEffect 
  } = useAppearanceStore();

  // Determine which effect to use
  const appliedEffect = effect || getEffectBySettings(
    lyricIndex, 
    effectMode, 
    effectChangeFrequency, 
    fixedEffect, 
    manualEffect
  );

  // Calculate word duration for dynamic animation timing
  const wordDuration = React.useMemo(() => {
    const startTime = get(word, 'startTime', 0);
    const endTime = get(word, 'endTime', 0);
    const duration = endTime - startTime;
    // Minimum 2s, maximum 6s for comfortable viewing
    return Math.min(Math.max(duration / 1000, 2), 6);
  }, [word]);

  React.useEffect(() => {
    if (isVisible) {
      // Apply effect immediately when visible, no delays
      setEffectActive(true);
    } else {
      setEffectActive(false);
    }
  }, [isVisible]);

  // Use lodash for safe text transformation
  const wordText = get(word, 'text', '');
  let transformedText = wordText;
  if (textCase === 'uppercase') {
    transformedText = toUpper(wordText);
  } else if (textCase === 'lowercase') {
    transformedText = toLower(wordText);
  }

  // Build CSS classes
  const baseClasses = [
    get(styles, 'word', ''),
    isVisible ? get(styles, 'wordVisible', '') : get(styles, 'wordHidden', ''),
    effectActive ? get(styles, `effect${appliedEffect.charAt(0).toUpperCase() + appliedEffect.slice(1)}`, '') : ''
  ].filter(Boolean).join(' ');

  // Dynamic styles with word timing-based animation
  const dynamicStyle = React.useMemo(() => {
    const baseStyle: React.CSSProperties = { 
      color,
      animationDelay: `${animationDelay}ms`,
      // Use word duration for animation timing
      animationDuration: `${wordDuration}s`
    };

    // Add effect-specific styles
    switch (appliedEffect) {
      case 'rainbow':
        baseStyle.background = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
        baseStyle.backgroundSize = '400% 400%';
        baseStyle.backgroundClip = 'text';
        baseStyle.WebkitBackgroundClip = 'text';
        baseStyle.color = 'transparent';
        break;
    }

    return baseStyle;
  }, [color, appliedEffect, animationDelay, wordDuration]);

  return (
    <span 
      key={`${lyricIndex}-${index}`}
      className={baseClasses}
      style={dynamicStyle}
      data-effect={appliedEffect}
      data-word-duration={wordDuration}
    >
      {transformedText}
      {!isLastWord && ' '}
    </span>
  );
});

Word.displayName = 'Word';