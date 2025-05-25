import React from 'react';
import { get, map, size } from 'lodash';
import type { LyricLine } from '../../utils/lyricParser';
import { Word, type WordEffect } from './Word';
import styles from './LyricText.module.css';

interface LyricTextProps {
  lyric: LyricLine;
  lyricIndex: number;
  visibleWords: Set<number>;
  color: string;
  fontSizeClass: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  useCustomSize?: boolean;
  enableWordStagger?: boolean;
  customEffect?: WordEffect; // Optional override - if not provided, Word uses store settings
}

export const LyricText: React.FC<LyricTextProps> = React.memo(({ 
  lyric, 
  lyricIndex, 
  visibleWords, 
  color, 
  fontSizeClass, 
  textCase,
  useCustomSize = false,
  enableWordStagger = true,
  customEffect // Only pass if explicitly provided
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
        effect={customEffect} // Word component will use store settings if this is undefined
        animationDelay={enableWordStagger ? index * 100 : 0}
      />
    ))}
  </div>
));

LyricText.displayName = 'LyricText';