import { useCallback } from 'react';
import { isObject, get, toNumber, clamp } from 'lodash';
import { useAudioStore } from '../stores/audioStore';
import { getCurrentLyricIndex } from '../utils/lyricParser';
import type { LyricLine } from '../utils/lyricParser';

/**
 * Custom hook for handling audio-related events
 * Manages audio progress, play/pause states, and audio readiness
 */
export const useAudioHandlers = (lyricsWithTiming: LyricLine[]) => {
  const audioStore = useAudioStore();

  /**
   * Handle audio progress update with lodash safety
   * Updates current time and tracks lyric synchronization
   */
  const handleAudioProgress = useCallback((progress: { playedSeconds: number; played: number }) => {
    if (!isObject(progress)) return;
    
    const playedSeconds = get(progress, 'playedSeconds', 0);
    const currentTimeMs = clamp(toNumber(playedSeconds) * 1000, 0, Number.MAX_SAFE_INTEGER);
    audioStore.setCurrentTime(currentTimeMs);
    
    // Track current lyric for debugging
    const currentLyricIndex = getCurrentLyricIndex(lyricsWithTiming, currentTimeMs);
    if (currentLyricIndex >= 0 && currentLyricIndex < lyricsWithTiming.length) {
      // Optional: Add debug logging when needed
      // console.log(`Time: ${currentTimeMs.toFixed(0)}ms, Lyric ${currentLyricIndex}: "${lyricsWithTiming[currentLyricIndex].text}"`);
    }
  }, [lyricsWithTiming, audioStore]);

  /**
   * Handle audio play event
   */
  const handlePlay = useCallback(() => {
    audioStore.setIsPlaying(true);
    console.log('Audio started playing');
  }, [audioStore]);

  /**
   * Handle audio pause event
   */
  const handlePause = useCallback(() => {
    audioStore.setIsPlaying(false);
    console.log('Audio paused');
  }, [audioStore]);

  /**
   * Handle audio ready event
   */
  const handleAudioReady = useCallback(() => {
    audioStore.setIsAudioReady(true);
    console.log('Audio is ready to play');
  }, [audioStore]);

  /**
   * Handle animation completion
   * Lyrics end but audio continues playing
   */
  const handleAnimationComplete = useCallback(() => {
    console.log('Lyric animation completed, but audio continues playing!');
    // Audio continues playing after lyrics end
  }, []);

  return {
    handleAudioProgress,
    handlePlay,
    handlePause,
    handleAudioReady,
    handleAnimationComplete,
  };
};