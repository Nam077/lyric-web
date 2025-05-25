import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  get, isString, isNumber, isFunction, toString, 
  clamp, max, min, toNumber, isEmpty
} from 'lodash';
import { useAudioStore } from '../../stores/audioStore';
import styles from './AudioPlayer.module.css';

/**
 * Modern Play/Pause Button Component
 */
const PlayPauseButton: React.FC<{ isPlaying: boolean; onClick: () => void; disabled?: boolean }> = React.memo(({ isPlaying, onClick, disabled }) => (
  <button 
    className={`${get(styles, 'playButton', '')} ${isPlaying ? get(styles, 'playing', '') : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={isPlaying ? "Pause" : "Play"}
  >
    <div className={get(styles, 'playIcon', '')}>
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
  <div className={get(styles, 'volumeControl', '')}>
    <button 
      className={get(styles, 'volumeButton', '')}
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
    <div className={get(styles, 'volumeSliderContainer', '')}>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={(e) => {
          const newVolume = clamp(toNumber(get(e, 'target.value', 0)), 0, 1);
          onVolumeChange(newVolume);
        }}
        className={get(styles, 'volumeSlider', '')}
      />
    </div>
  </div>
));

/**
 * Progress Bar Component with lodash safety
 */
const ProgressBar: React.FC<{ 
  currentTime: number; 
  duration: number; 
  onSeek: (time: number) => void;
  buffered?: number;
}> = React.memo(({ currentTime, duration, onSeek, buffered = 0 }) => {
  const formatTime = (seconds: number) => {
    const safeSeconds = max([0, isNumber(seconds) ? seconds : 0]) || 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${toString(secs).padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = get(e, 'currentTarget', { getBoundingClientRect: () => ({ left: 0, width: 0 }) }).getBoundingClientRect();
    const clientX = get(e, 'clientX', 0);
    const rectLeft = get(rect, 'left', 0);
    const rectWidth = get(rect, 'width', 1);
    
    const percent = clamp((clientX - rectLeft) / rectWidth, 0, 1);
    const seekTime = clamp(percent * duration, 0, duration);
    onSeek(seekTime);
  };

  const safeDuration = max([0, isNumber(duration) ? duration : 0]) || 0;
  const safeCurrentTime = clamp(isNumber(currentTime) ? currentTime : 0, 0, safeDuration);
  const safeBuffered = clamp(isNumber(buffered) ? buffered : 0, 0, safeDuration);
  
  const progress = safeDuration > 0 ? (safeCurrentTime / safeDuration) * 100 : 0;
  const bufferedProgress = safeDuration > 0 ? (safeBuffered / safeDuration) * 100 : 0;

  return (
    <div className={get(styles, 'progressContainer', '')}>
      <span className={get(styles, 'timeDisplay', '')}>{formatTime(safeCurrentTime)}</span>
      <div 
        className={get(styles, 'progressBar', '')}
        onClick={handleSeek}
      >
        <div 
          className={get(styles, 'progressBuffered', '')}
          style={{ width: `${clamp(bufferedProgress, 0, 100)}%` }}
        />
        <div 
          className={get(styles, 'progressFilled', '')}
          style={{ width: `${clamp(progress, 0, 100)}%` }}
        />
        <div 
          className={get(styles, 'progressThumb', '')}
          style={{ left: `${clamp(progress, 0, 100)}%` }}
        />
      </div>
      <span className={get(styles, 'timeDisplay', '')}>{formatTime(safeDuration)}</span>
    </div>
  );
});

/**
 * Toggle Button for showing/hiding player popup
 */
const ToggleButton: React.FC<{ isVisible: boolean; onClick: () => void }> = React.memo(({ isVisible, onClick }) => (
  <button 
    className={get(styles, 'toggleButton', '')} 
    onClick={onClick}
    aria-label={isVisible ? "Hide audio player" : "Show audio player"}
    title="Press P to toggle player"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  </button>
));

export const AudioPlayer: React.FC = () => {
  // Use stores directly instead of props
  const audioStore = useAudioStore();
  
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

  // Get values from store
  const {
    currentAudioUrl: url,
    currentSongInfo: { title, artist },
    isPlaying: playing,
    togglePlayback
  } = audioStore;

  // Keyboard event handlers with lodash safety
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = get(event, 'target');
      const key = get(event, 'key', '');
      const code = get(event, 'code', '');
      const ctrlKey = get(event, 'ctrlKey', false);
      const metaKey = get(event, 'metaKey', false);
      const altKey = get(event, 'altKey', false);

      // Ignore if user is typing in input fields
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      if (key.toLowerCase() === 'p' && !ctrlKey && !metaKey && !altKey) {
        event.preventDefault();
        setIsPopupVisible(prev => !prev);
      } else if (code === 'Space' && !ctrlKey && !metaKey && !altKey) {
        event.preventDefault();
        togglePlayback();
      } else if (key === 'ArrowLeft' && !ctrlKey && !metaKey && !altKey) {
        // Seek backward 5 seconds
        event.preventDefault();
        const player = get(playerRef, 'current');
        if (player && isReady) {
          const newTime = max([0, currentTime - 5]) || 0;
          player.seekTo(newTime, 'seconds');
        }
      } else if (key === 'ArrowRight' && !ctrlKey && !metaKey && !altKey) {
        // Seek forward 10 seconds
        event.preventDefault();
        const player = get(playerRef, 'current');
        if (player && isReady) {
          const newTime = min([duration, currentTime + 10]) || currentTime + 10;
          player.seekTo(newTime, 'seconds');
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, isReady, currentTime, duration]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    audioStore.setIsAudioReady(true);
  }, [audioStore]);

  const handleProgress = useCallback((progress: { playedSeconds: number; played: number; loadedSeconds: number }) => {
    const playedSeconds = get(progress, 'playedSeconds', 0);
    const loadedSeconds = get(progress, 'loadedSeconds', 0);
    
    setCurrentTime(clamp(isNumber(playedSeconds) ? playedSeconds : 0, 0, Number.MAX_SAFE_INTEGER));
    setBuffered(clamp(isNumber(loadedSeconds) ? loadedSeconds : 0, 0, Number.MAX_SAFE_INTEGER));
    
    // Update store with current time
    audioStore.setCurrentTime(playedSeconds * 1000); // Convert to milliseconds
  }, [audioStore]);

  const handleDuration = useCallback((duration: number) => {
    const safeDuration = max([0, isNumber(duration) ? duration : 0]) || 0;
    setDuration(safeDuration);
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    const player = get(playerRef, 'current');
    if (player && isReady) {
      const safeSeconds = clamp(isNumber(seconds) ? seconds : 0, 0, duration);
      player.seekTo(safeSeconds, 'seconds');
    }
  }, [isReady, duration]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const safeVolume = clamp(isNumber(newVolume) ? newVolume : 0, 0, 1);
    setVolume(safeVolume);
    if (safeVolume > 0) setMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const handlePlay = useCallback(() => {
    audioStore.setIsPlaying(true);
  }, [audioStore]);

  const handlePause = useCallback(() => {
    audioStore.setIsPlaying(false);
  }, [audioStore]);

  // Safe title and artist with lodash
  const safeTitle = !isEmpty(title) && isString(title) ? title : 'Unknown Title';
  const safeArtist = !isEmpty(artist) && isString(artist) ? artist : 'Unknown Artist';

  return (
    <>
      {/* Hidden React Player */}
      <div className={get(styles, 'hiddenPlayer', '')}>
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
          onPlay={handlePlay}
          onPause={handlePause}
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
        <div className={get(styles, 'popupOverlay', '')} onClick={() => setIsPopupVisible(false)}>
          <div 
            className={get(styles, 'popupContainer', '')}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={get(styles, 'playerHeader', '')}>
              <div className={get(styles, 'songInfo', '')}>
                <h3 className={get(styles, 'songTitle', '')}>{safeTitle}</h3>
                <p className={get(styles, 'artistName', '')}>{safeArtist}</p>
              </div>
              <button 
                className={get(styles, 'closeButton', '')}
                onClick={() => setIsPopupVisible(false)}
                aria-label="Close player"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Album Art Placeholder */}
            <div className={get(styles, 'albumArt', '')}>
              <div className={get(styles, 'albumPlaceholder', '')}>
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
            <div className={get(styles, 'playerControls', '')}>
              <PlayPauseButton 
                isPlaying={playing}
                onClick={togglePlayback}
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
            <div className={get(styles, 'shortcutsInfo', '')}>
              <span>Space: Play/Pause</span>
              <span>P: Toggle Player</span>
              <span>← -5s</span>
              <span>→ +10s</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};