import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  get, map, size, forEach, isNumber, isString, 
  toUpper, toLower, max, set
} from 'lodash';
import { getCurrentLyricIndex } from '../../utils/lyricParser';
import styles from './LyricAnimation.module.css';

export interface WordTiming {
  text: string;
  startTime: number;
  endTime: number;
}

export interface LyricLine {
  text: string;
  words: WordTiming[];
  startTime: number;
  endTime: number;
}

export interface LyricAnimationProps {
  lyrics: LyricLine[];
  currentTime?: number;
  isPlaying?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  textShadowColor?: string;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge' | number; // Support custom number
  textCase?: 'uppercase' | 'lowercase' | 'normal'; // New text case prop
  fontFamily?: string;
  customFontSize?: number; // Custom font size in em
  letterSpacing?: number; // Letter spacing in em
  lineHeight?: number; // Line height ratio
  onComplete?: () => void;
}

/**
 * Individual word component - memoized to prevent unnecessary re-renders
 */
interface WordProps {
  word: WordTiming;
  index: number;
  isVisible: boolean;
  color: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  lyricIndex: number;
  isLastWord: boolean;
}

const Word: React.FC<WordProps> = React.memo(({ 
  word, 
  index, 
  isVisible, 
  color, 
  textCase, 
  lyricIndex, 
  isLastWord 
}) => {
  const [waveActive, setWaveActive] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setWaveActive(true);
      }, 800);
      
      return () => clearTimeout(timer);
    } else {
      setWaveActive(false);
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

  return (
    <span 
      key={`${lyricIndex}-${index}`}
      className={`${get(styles, 'word', '')} ${isVisible ? get(styles, 'wordVisible', '') : get(styles, 'wordHidden', '')} ${waveActive ? get(styles, 'waveActive', '') : ''}`}
      style={{ color }}
    >
      {transformedText}
      {!isLastWord && ' '}
    </span>
  );
});

/**
 * Lyric text container - memoized to prevent re-renders when only word visibility changes
 */
interface LyricTextProps {
  lyric: LyricLine;
  lyricIndex: number;
  visibleWords: Set<number>;
  color: string;
  fontSizeClass: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  useCustomSize?: boolean;
}

const LyricText: React.FC<LyricTextProps> = React.memo(({ 
  lyric, 
  lyricIndex, 
  visibleWords, 
  color, 
  fontSizeClass, 
  textCase,
  useCustomSize = false
}) => (
  <div 
    className={`${get(styles, 'lyricText', '')} ${!useCustomSize ? fontSizeClass : ''}`}
    style={{ color }}
  >
    {map(get(lyric, 'words', []), (word, index) => (
      <Word
        key={`${lyricIndex}-${index}`}
        word={word}
        index={index}
        isVisible={visibleWords.has(index)}
        color={color}
        textCase={textCase}
        lyricIndex={lyricIndex}
        isLastWord={index === size(get(lyric, 'words', [])) - 1}
      />
    ))}
  </div>
));

/**
 * Container that holds everything but doesn't re-render - memoized
 */
interface LyricContainerProps {
  children: React.ReactNode;
  isVisible: boolean;
}

const LyricContainer: React.FC<LyricContainerProps> = React.memo(({ children, isVisible }) => (
  <div className={`${get(styles, 'lyricContainer', '')} ${isVisible ? get(styles, 'visible', '') : ''}`}>
    {children}
  </div>
));

export const LyricAnimation: React.FC<LyricAnimationProps> = React.memo(({
  lyrics,
  currentTime = 0,
  isPlaying = false,
  primaryColor = '#26C6DA',
  secondaryColor = '#00BCD4',
  textColor = '#1976D2',
  textShadowColor = '#1976D2',
  fontSize = 'large',
  textCase = 'normal',
  fontFamily = 'system-ui, -apple-system, sans-serif',
  customFontSize,
  letterSpacing = 0.2,
  lineHeight = 1.2,
  onComplete
}) => {
  const [displayState, setDisplayState] = useState({
    currentLyricIndex: -1,
    visibleWords: new Set<number>(),
    showLyrics: false
  });

  // Normalize timing using lodash for safe data processing
  const normalizedLyrics = useMemo(() => {
    return map(lyrics, lyric => ({
      ...lyric,
      words: map(get(lyric, 'words', []), (word) => {
        const minDuration = 100;
        const startTime = get(word, 'startTime', 0);
        const endTime = get(word, 'endTime', 0);
        const normalizedEndTime = max([endTime, startTime + minDuration]) || startTime + minDuration;
        
        return {
          ...word,
          endTime: normalizedEndTime
        };
      })
    }));
  }, [lyrics]);

  // Fixed color configuration using lodash for safe property access
  const colorConfig = useMemo(() => ({
    textColor: isString(textColor) ? textColor : '#1976D2',
    textShadowColor: isString(textShadowColor) ? textShadowColor : '#1976D2',
    backgroundColor: isString(secondaryColor) ? secondaryColor : '#00BCD4',
    gradientColor: isString(secondaryColor) ? secondaryColor : '#00BCD4',
    shadowColor: isString(secondaryColor) ? secondaryColor : '#00BCD4',
  }), [textColor, textShadowColor, secondaryColor]);

  // Font size class using lodash for safe string operations
  const fontSizeClass = useMemo(() => {
    const sizeMap = {
      'small': get(styles, 'fontSmall', ''),
      'medium': get(styles, 'fontMedium', ''),
      'large': get(styles, 'fontLarge', ''),
      'xlarge': get(styles, 'fontXLarge', '')
    };
    
    return get(sizeMap, fontSize as string, get(styles, 'fontLarge', ''));
  }, [fontSize]);

  // Helper function for set comparison using lodash
  const areSetsEqual = useCallback((set1: Set<number>, set2: Set<number>): boolean => {
    if (size(set1) !== size(set2)) return false;
    
    let isEqual = true;
    forEach(Array.from(set1), (item) => {
      if (!set2.has(item)) {
        isEqual = false;
        return false; // Break forEach
      }
    });
    
    return isEqual;
  }, []);

  // Optimized update function
  const updateDisplayState = useCallback((newState: Partial<typeof displayState>) => {
    setDisplayState(prev => ({ ...prev, ...newState }));
  }, []);

  // Use refs to store current state without causing re-renders
  const displayStateRef = useRef(displayState);
  displayStateRef.current = displayState;

  // Main effect with lodash safety checks - KEEP ORIGINAL LOGIC
  useEffect(() => {
    if (!size(normalizedLyrics) || !isPlaying) {
      if (!isPlaying) {
        updateDisplayState({
          currentLyricIndex: -1,
          visibleWords: new Set(),
          showLyrics: false
        });
      }
      return;
    }

    const audioLyricIndex = getCurrentLyricIndex(normalizedLyrics, currentTime);
    
    if (audioLyricIndex === -1) {
      updateDisplayState({
        currentLyricIndex: -1,
        visibleWords: new Set(),
        showLyrics: false
      });
      return;
    }

    const currentLyric = get(normalizedLyrics, audioLyricIndex);
    if (!currentLyric) return;

    const newVisibleWords = new Set<number>();
    const words = get(currentLyric, 'words', []);

    forEach(words, (word, index) => {
      const wordStartTime = get(word, 'startTime', 0);
      if (currentTime >= wordStartTime) {
        newVisibleWords.add(index);
      }
    });

    // Use ref to check current state without dependency using lodash
    const currentState = displayStateRef.current;
    
    // Only update if something actually changed using lodash comparisons
    const hasLyricChanged = get(currentState, 'currentLyricIndex') !== audioLyricIndex;
    const hasWordChanged = !areSetsEqual(get(currentState, 'visibleWords', new Set()), newVisibleWords);

    if (hasLyricChanged || hasWordChanged || !get(currentState, 'showLyrics')) {
      updateDisplayState({
        currentLyricIndex: audioLyricIndex,
        visibleWords: newVisibleWords,
        showLyrics: true
      });
    }

    // Check completion using lodash for safe access
    const lyricsLength = size(normalizedLyrics);
    const lastLyric = get(normalizedLyrics, lyricsLength - 1);
    const lastLyricEndTime = get(lastLyric, 'endTime', 0);
    
    if (audioLyricIndex >= lyricsLength - 1 && currentTime > lastLyricEndTime + 1000) {
      if (onComplete) onComplete();
    }

  }, [normalizedLyrics, currentTime, isPlaying, onComplete, updateDisplayState, areSetsEqual]);

  // Memoized current lyric using lodash for safe access
  const showLyrics = get(displayState, 'showLyrics', false);
  const currentIndex = get(displayState, 'currentLyricIndex', -1);
  
  const currentLyric = useMemo(() => {
    const lyricsLength = size(normalizedLyrics);
    
    return showLyrics && currentIndex !== -1 && currentIndex < lyricsLength 
      ? get(normalizedLyrics, currentIndex, null)
      : null;
  }, [showLyrics, currentIndex, normalizedLyrics]);

  // Container style using lodash for safe property handling
  const textColorValue = get(colorConfig, 'textColor', '#1976D2');
  const textShadowColorValue = get(colorConfig, 'textShadowColor', '#1976D2');
  
  const containerStyle = useMemo(() => {
    const baseStyle = {
      '--bg-color-1': isString(primaryColor) ? primaryColor : '#26C6DA',
      '--bg-color-2': isString(secondaryColor) ? secondaryColor : '#00BCD4',
      '--text-color': textColorValue,
      '--text-shadow-color': textShadowColorValue,
      '--font-family': isString(fontFamily) ? fontFamily : 'system-ui, -apple-system, sans-serif',
      '--letter-spacing': `${isNumber(letterSpacing) ? letterSpacing : 0.2}em`,
      '--line-height': isNumber(lineHeight) ? lineHeight.toString() : '1.2',
    } as React.CSSProperties;

    // Add custom font size if provided using lodash safety check
    if (isNumber(customFontSize) && customFontSize > 0) {
      set(baseStyle, '--font-size', `${customFontSize}em`);
    }

    return baseStyle;
  }, [primaryColor, secondaryColor, textColorValue, textShadowColorValue, fontFamily, customFontSize, letterSpacing, lineHeight]);

  // Determine if we should use custom font size using lodash
  const shouldUseCustomSize = Boolean(isNumber(customFontSize) && customFontSize > 0);

  return (
    <div 
      className={get(styles, 'container', '')} 
      style={containerStyle}
    >
      {currentLyric && (
        <LyricContainer isVisible={get(displayState, 'showLyrics', false)}>
          <LyricText
            lyric={currentLyric}
            lyricIndex={get(displayState, 'currentLyricIndex', 0)}
            visibleWords={get(displayState, 'visibleWords', new Set())}
            color={get(colorConfig, 'textColor', '#1976D2')}
            fontSizeClass={shouldUseCustomSize ? '' : fontSizeClass}
            textCase={textCase}
            useCustomSize={shouldUseCustomSize}
          />
        </LyricContainer>
      )}
    </div>
  );
});
