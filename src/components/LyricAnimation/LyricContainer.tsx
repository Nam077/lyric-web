import React from 'react';
import { get } from 'lodash';
import styles from './LyricContainer.module.css';

interface LyricContainerProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const LyricContainer: React.FC<LyricContainerProps> = React.memo(({ children, isVisible }) => (
  <div className={`${get(styles, 'lyricContainer', '')} ${isVisible ? get(styles, 'visible', '') : ''}`}>
    {children}
  </div>
));

LyricContainer.displayName = 'LyricContainer';