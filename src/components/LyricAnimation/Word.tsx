import React from 'react';
import { get, toUpper, toLower } from 'lodash';
import type { WordTiming } from '../../utils/lyricParser';
import styles from './Word.module.css';

interface WordProps {
  word: WordTiming;
  index: number;
  isVisible: boolean;
  color: string;
  textCase: 'uppercase' | 'lowercase' | 'normal';
  lyricIndex: number;
  isLastWord: boolean;
}

export const Word: React.FC<WordProps> = React.memo(({ 
  word, 
  index, 
  isVisible, 
  color, 
  textCase, 
  lyricIndex, 
  isLastWord
}) => {
  // Transform text using lodash
  const wordText = get(word, 'text', '');
  let transformedText = wordText;
  if (textCase === 'uppercase') {
    transformedText = toUpper(wordText);
  } else if (textCase === 'lowercase') {
    transformedText = toLower(wordText);
  }

  // Simple CSS classes - only wordAppear effect
  const className = [
    get(styles, 'word', ''),
    isVisible ? get(styles, 'wordVisible', '') : get(styles, 'wordHidden', '')
  ].filter(Boolean).join(' ');

  return (
    <span 
      key={`${lyricIndex}-${index}`}
      className={className}
      style={{ color }}
    >
      {transformedText}
      {!isLastWord && ' '}
    </span>
  );
});

Word.displayName = 'Word';