import React from 'react';
import { get, map, size } from 'lodash';
import type { LyricLine } from '../../utils/lyricParser';
import { Word } from './Word';
import styles from './LyricText.module.css';

interface LyricTextProps {
  lyric: LyricLine;
  lyricIndex: number;
  visibleWords: Set<number>;
  color: string;
  fontSizeClass: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  useCustomSize?: boolean;
}

export const LyricText: React.FC<LyricTextProps> = React.memo(({ 
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

LyricText.displayName = 'LyricText';