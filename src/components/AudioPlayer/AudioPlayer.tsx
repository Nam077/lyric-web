import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import styles from './AudioPlayer.module.css';

export interface AudioPlayerProps {
  url: string;
  title?: string;
  artist?: string;
  onProgress?: (progress: { playedSeconds: number; played: number }) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  volume?: number;
  playing?: boolean;
  onTogglePlay?: () => void;
  className?: string;
}

/**
 * Modern Play/Pause Button Component
 */
const PlayPauseButton: React.FC<{ isPlaying: boolean; onClick: () => void; disabled?: boolean }> = React.memo(({ isPlaying, onClick, disabled }) => (
  <button 
    className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={isPlaying ? "Pause" : "Play"}
  >
    <div className={styles.playIcon}>
      {isPlaying ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      )}
    </div>
  </button>
));

/**
 * Volume Control Component
 */
const VolumeControl: React.FC<{ volume: number; onVolumeChange: (volume: number) => void; muted: boolean; onToggleMute: () => void }> = React.memo(({ volume, onVolumeChange, muted, onToggleMute }) => (
  <div className={styles.volumeControl}>
    <button 
      className={styles.volumeButton}
      onClick={onToggleMute}
      aria-label={muted ? "Unmute" : "Mute"}
    >
      {muted || volume === 0 ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      ) : volume < 0.5 ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      )}
    </button>
    <div className={styles.volumeSliderContainer}>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className={styles.volumeSlider}
      />
    </div>
  </div>
));

/**
 * Progress Bar Component
 */
const ProgressBar: React.FC<{ 
  currentTime: number; 
  duration: number; 
  onSeek: (time: number) => void;
  buffered?: number;
}> = React.memo(({ currentTime, duration, onSeek, buffered = 0 }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
      <div 
        className={styles.progressBar}
        onClick={handleSeek}
      >
        <div 
          className={styles.progressBuffered}
          style={{ width: `${bufferedProgress}%` }}
        />
        <div 
          className={styles.progressFilled}
          style={{ width: `${progress}%` }}
        />
        <div 
          className={styles.progressThumb}
          style={{ left: `${progress}%` }}
        />
      </div>
      <span className={styles.timeDisplay}>{formatTime(duration)}</span>
    </div>
  );
});

/**
 * Toggle Button for showing/hiding player popup
 */
const ToggleButton: React.FC<{ isVisible: boolean; onClick: () => void }> = React.memo(({ isVisible, onClick }) => (
  <button 
    className={styles.toggleButton} 
    onClick={onClick}
    aria-label={isVisible ? "Hide audio player" : "Show audio player"}
    title="Press P to toggle player"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  </button>
));

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  url,
  title,
  artist,
  onProgress,
  onReady,
  onPlay,
  onPause,
  onEnded,
  volume: externalVolume = 0.8,
  playing = false,
  onTogglePlay
}) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(externalVolume);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setIsPopupVisible(prev => !prev);
      } else if (event.code === 'Space' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onTogglePlay?.();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onTogglePlay]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  const handleProgress = useCallback((progress: { playedSeconds: number; played: number; loadedSeconds: number }) => {
    setCurrentTime(progress.playedSeconds);
    setBuffered(progress.loadedSeconds);
    onProgress?.(progress);
  }, [onProgress]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(seconds, 'seconds');
    }
  }, [isReady]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) setMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  return (
    <>
      {/* Hidden React Player */}
      <div className={styles.hiddenPlayer}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={muted ? 0 : volume}
          controls={false}
          width="0"
          height="0"
          onReady={handleReady}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          config={{
            file: {
              attributes: {
                preload: 'auto',
                controlsList: 'nodownload'
              }
            }
          }}
          progressInterval={100}
        />
      </div>

      {/* Toggle Button - Always visible */}
      <ToggleButton 
        isVisible={isPopupVisible} 
        onClick={() => setIsPopupVisible(prev => !prev)} 
      />

      {/* Modern Popup Player */}
      {isPopupVisible && (
        <div className={styles.popupOverlay} onClick={() => setIsPopupVisible(false)}>
          <div 
            className={styles.popupContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.playerHeader}>
              <div className={styles.songInfo}>
                <h3 className={styles.songTitle}>{title || 'Unknown Title'}</h3>
                <p className={styles.artistName}>{artist || 'Unknown Artist'}</p>
              </div>
              <button 
                className={styles.closeButton}
                onClick={() => setIsPopupVisible(false)}
                aria-label="Close player"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Album Art Placeholder */}
            <div className={styles.albumArt}>
              <div className={styles.albumPlaceholder}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar 
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              buffered={buffered}
            />

            {/* Controls */}
            <div className={styles.playerControls}>
              <PlayPauseButton 
                isPlaying={playing}
                onClick={() => onTogglePlay?.()}
                disabled={!isReady}
              />
              
              <VolumeControl 
                volume={volume}
                onVolumeChange={handleVolumeChange}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className={styles.shortcutsInfo}>
              <span>Space: Play/Pause</span>
              <span>P: Toggle Player</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};