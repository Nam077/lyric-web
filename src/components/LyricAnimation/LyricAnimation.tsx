import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  get, size, forEach, isNumber, isString, set
} from 'lodash';
import { getCurrentLyricIndex } from '../../utils/lyricParser';
import { useAudioStore } from '../../stores/audioStore';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useTypographyStore } from '../../stores/typographyStore';
import { useProcessedLyrics } from '../../hooks/useLyricProcessor';
import { LyricContainer } from './LyricContainer';
import { LyricText } from './LyricText';
import styles from './LyricAnimation.module.css';

export const LyricAnimation: React.FC = React.memo(() => {
  // Use stores directly instead of props
  const audioStore = useAudioStore();
  const appearanceStore = useAppearanceStore();
  const typographyStore = useTypographyStore();
  
  // Get processed lyrics from hook
  const { lyrics: normalizedLyrics } = useProcessedLyrics();
  
  // Get values from stores
  const {
    currentTime,
    isPlaying
  } = audioStore;
  
  const {
    primaryColor,
    secondaryColor,
    textColor,
    textShadowColor
  } = appearanceStore;
  
  const {
    fontFamily,
    fontSize: customFontSize,
    letterSpacing,
    lineHeight,
    textCase
  } = typographyStore;

  const [displayState, setDisplayState] = useState({
    currentLyricIndex: -1,
    visibleWords: new Set<number>(),
    showLyrics: false
  });

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
    
    return get(sizeMap, 'large', get(styles, 'fontLarge', ''));
  }, []);

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

    // Check completion - no onComplete callback needed since it's handled in hooks
    const lyricsLength = size(normalizedLyrics);
    const lastLyric = get(normalizedLyrics, lyricsLength - 1);
    const lastLyricEndTime = get(lastLyric, 'endTime', 0);
    
    if (audioLyricIndex >= lyricsLength - 1 && currentTime > lastLyricEndTime + 1000) {
      console.log('Lyric animation completed, but audio continues playing!');
    }

  }, [normalizedLyrics, currentTime, isPlaying, updateDisplayState, areSetsEqual]);

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
            enableWordStagger={true}
          />
        </LyricContainer>
      )}
    </div>
  );
});
