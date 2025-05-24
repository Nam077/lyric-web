import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  uppercase?: boolean;
  fontFamily?: string;
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
  uppercase: boolean;
  lyricIndex: number;
  isLastWord: boolean;
}

const Word: React.FC<WordProps> = React.memo(({ 
  word, 
  index, 
  isVisible, 
  color, 
  uppercase, 
  lyricIndex, 
  isLastWord 
}) => {
  const [waveActive, setWaveActive] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      // Add wave animation after word appear animation completes (800ms)
      const timer = setTimeout(() => {
        setWaveActive(true);
      }, 800);
      
      return () => clearTimeout(timer);
    } else {
      setWaveActive(false);
    }
  }, [isVisible]);

  return (
    <span 
      key={`${lyricIndex}-${index}`}
      className={`${styles.word} ${isVisible ? styles.wordVisible : styles.wordHidden} ${waveActive ? styles.waveActive : ''}`}
      style={{ color }}
    >
      {uppercase ? word.text.toUpperCase() : word.text}
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
  uppercase: boolean;
}

const LyricText: React.FC<LyricTextProps> = React.memo(({ 
  lyric, 
  lyricIndex, 
  visibleWords, 
  color, 
  fontSizeClass, 
  uppercase 
}) => (
  <div 
    className={`${styles.lyricText} ${fontSizeClass} ${uppercase ? styles.uppercase : ''}`}
    style={{ color }}
  >
    {lyric.words.map((word, index) => (
      <Word
        key={`${lyricIndex}-${index}`}
        word={word}
        index={index}
        isVisible={visibleWords.has(index)}
        color={color}
        uppercase={uppercase}
        lyricIndex={lyricIndex}
        isLastWord={index === lyric.words.length - 1}
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
  <div className={`${styles.lyricContainer} ${isVisible ? styles.visible : ''}`}>
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
  uppercase = true,
  fontFamily = 'system-ui, -apple-system, sans-serif',
  onComplete
}) => {
  const [displayState, setDisplayState] = useState({
    currentLyricIndex: -1,
    visibleWords: new Set<number>(),
    showLyrics: false
  });

  // Normalize timing - memoized với deep comparison
  const normalizedLyrics = useMemo(() => {
    return lyrics.map(lyric => ({
      ...lyric,
      words: lyric.words.map((word) => {
        const minDuration = 100;
        const normalizedEndTime = Math.max(
          word.endTime, 
          word.startTime + minDuration
        );
        
        return {
          ...word,
          endTime: normalizedEndTime
        };
      })
    }));
  }, [lyrics]);

  // Fixed color configuration using props
  const colorConfig = useMemo(() => ({
    textColor: textColor,
    textShadowColor: textShadowColor,
    backgroundColor: secondaryColor,
    gradientColor: secondaryColor,
    shadowColor: secondaryColor,
  }), [textColor, textShadowColor, secondaryColor]);

  // Font size class - memoized
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return styles.fontSmall;
      case 'medium': return styles.fontMedium;
      case 'large': return styles.fontLarge;
      case 'xlarge': return styles.fontXLarge;
      default: return styles.fontLarge;
    }
  }, [fontSize]);

  // Helper function - memoized
  const areSetsEqual = useCallback((set1: Set<number>, set2: Set<number>): boolean => {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }, []);

  // Optimized update function
  const updateDisplayState = useCallback((newState: Partial<typeof displayState>) => {
    setDisplayState(prev => ({ ...prev, ...newState }));
  }, []);

  // Use refs to store current state without causing re-renders
  const displayStateRef = useRef(displayState);
  displayStateRef.current = displayState;

  // Main effect
  useEffect(() => {
    if (!normalizedLyrics.length || !isPlaying) {
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

    const currentLyric = normalizedLyrics[audioLyricIndex];
    if (!currentLyric) return;

    const newVisibleWords = new Set<number>();

    currentLyric.words.forEach((word, index) => {
      if (currentTime >= word.startTime) {
        newVisibleWords.add(index);
      }
    });

    // Use ref to check current state without dependency
    const currentState = displayStateRef.current;
    
    // Only update if something actually changed
    const hasLyricChanged = currentState.currentLyricIndex !== audioLyricIndex;
    const hasWordChanged = !areSetsEqual(currentState.visibleWords, newVisibleWords);

    if (hasLyricChanged || hasWordChanged || !currentState.showLyrics) {
      updateDisplayState({
        currentLyricIndex: audioLyricIndex,
        visibleWords: newVisibleWords,
        showLyrics: true
      });
    }

    if (audioLyricIndex >= normalizedLyrics.length - 1 && 
        currentTime > normalizedLyrics[normalizedLyrics.length - 1]?.endTime + 1000) {
      onComplete?.();
    }

  }, [normalizedLyrics, currentTime, isPlaying, onComplete, updateDisplayState, areSetsEqual]);

  // Memoized current lyric
  const currentLyric = useMemo(() => 
    displayState.showLyrics && displayState.currentLyricIndex !== -1 && displayState.currentLyricIndex < normalizedLyrics.length 
      ? normalizedLyrics[displayState.currentLyricIndex] 
      : null
  , [displayState.showLyrics, displayState.currentLyricIndex, normalizedLyrics]);

  // Container style - make sure CSS variables are set
  const containerStyle = useMemo(() => {
    return {
      '--bg-color-1': primaryColor,
      '--bg-color-2': secondaryColor,
      '--text-color': textColor,
      '--text-shadow-color': textShadowColor,
      '--font-family': fontFamily,
    } as React.CSSProperties;
  }, [primaryColor, secondaryColor, textColor, textShadowColor, fontFamily]);

  return (
    <div 
      className={styles.container} 
      style={containerStyle}
    >
      {currentLyric && (
        <LyricContainer isVisible={displayState.showLyrics}>
          <LyricText
            lyric={currentLyric}
            lyricIndex={displayState.currentLyricIndex}
            visibleWords={displayState.visibleWords}
            color={colorConfig.textColor}
            fontSizeClass={fontSizeClass}
            uppercase={uppercase}
          />
        </LyricContainer>
      )}
    </div>
  );
});
