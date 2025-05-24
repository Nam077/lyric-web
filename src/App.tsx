import { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  get, isObject, isFunction, isString, 
  toNumber, clamp 
} from 'lodash';
import { LyricAnimation } from './components/LyricAnimation';
import { AudioPlayer } from './components/AudioPlayer';
import { Settings } from './components/Settings';
import FileUpload from './components/FileUpload';
import { processLyricData, getCurrentLyricIndex, normalizeTiming, mergeSentenceWords } from './utils/lyricParser';
import lyricData from './lyrics/lyric.json';
import './App.css'

interface UploadedFiles {
  lyric: File | null;
  audio: File | null;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLyricData, setCurrentLyricData] = useState(lyricData);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("/SOOBIN - DANCING IN THE DARK.mp3");
  const [currentSongInfo, setCurrentSongInfo] = useState({
    title: "DANCING IN THE DARK",
    artist: "SOOBIN"
  });

  // Color settings state
  const [colors, setColors] = useState({
    primaryColor: "#FFF9C4",      // Light yellow for background stripe
    secondaryColor: "#FFCC80",    // Lighter orange-yellow for background stripe
    textColor: "#1E6D9A",        // Medium blue text color
    textShadowColor: "#1565C0"   // Medium blue shadow color
  });

  // Lyric delay state (in milliseconds)
  const [lyricDelay, setLyricDelay] = useState(0);

  // Font family state
  const [fontFamily, setFontFamily] = useState('system-ui, -apple-system, sans-serif');

  // Typography settings state
  const [fontSize, setFontSize] = useState(4); // em units
  const [letterSpacing, setLetterSpacing] = useState(0.2); // em units
  const [lineHeight, setLineHeight] = useState(1.2); // ratio
  const [textCase, setTextCase] = useState<'uppercase' | 'lowercase' | 'normal'>('normal');

  // Merge sentences state
  const [mergeSentences, setMergeSentences] = useState(false);

  // FIX: Memoize processed lyrics với delay support và merge sentences
  const lyricsWithTiming = useMemo(() => {
    try {
      let processed = processLyricData(currentLyricData);
      
      // Apply merge sentences if enabled
      if (mergeSentences) {
        processed = mergeSentenceWords(processed);
      }
      
      // Apply delay to normalized timing with safe numeric conversion
      const safeDelay = clamp(toNumber(lyricDelay), -10000, 10000);
      const withDelay = normalizeTiming(processed, safeDelay);
      console.log('Processed lyrics with delay:', safeDelay, 'ms', mergeSentences ? '(sentences merged)' : '(words separate)');
      return withDelay;
    } catch (error) {
      console.error('Error processing lyrics:', error);
      return [];
    }
  }, [currentLyricData, lyricDelay, mergeSentences]);

  // Xử lý khi audio progress update với lodash safety
  const handleAudioProgress = useCallback((progress: { playedSeconds: number; played: number }) => {
    if (!isObject(progress)) return;
    
    const playedSeconds = get(progress, 'playedSeconds', 0);
    const currentTimeMs = clamp(toNumber(playedSeconds) * 1000, 0, Number.MAX_SAFE_INTEGER);
    setCurrentTime(currentTimeMs);
    
    // Reduced debug logging to prevent console spam
    const currentLyricIndex = getCurrentLyricIndex(lyricsWithTiming, currentTimeMs);
    if (currentLyricIndex >= 0 && currentLyricIndex < lyricsWithTiming.length) {
      // Only log when lyric changes, not every progress update
      // console.log(`Time: ${currentTimeMs.toFixed(0)}ms, Should show lyric ${currentLyricIndex}: "${lyricsWithTiming[currentLyricIndex].text}" (starts at ${lyricsWithTiming[currentLyricIndex].startTime}ms)`);
    }
  }, [lyricsWithTiming]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    console.log('Audio started playing');
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    console.log('Audio paused');
  }, []);

  const handleAudioReady = useCallback(() => {
    setIsAudioReady(true);
    console.log('Audio is ready to play');
  }, []);

  const handleAnimationComplete = useCallback(() => {
    console.log('Lyric animation completed, but audio continues playing!');
    // Remove setIsPlaying(false) to allow audio to continue playing after lyrics end
  }, []);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  /**
   * Handle uploaded files from FileUpload component với lodash safety
   */
  const handleFilesUploaded = useCallback(async (files: UploadedFiles) => {
    if (!isObject(files)) return;
    
    const lyricFile = get(files, 'lyric');
    const audioFile = get(files, 'audio');
    
    if (isObject(lyricFile) && isFunction(get(lyricFile, 'text'))) {
      try {
        const lyricText = await lyricFile.text();
        const newLyricData = JSON.parse(lyricText);
        setCurrentLyricData(newLyricData);
        
        // Extract song info if available in lyric data với lodash safety
        const title = get(newLyricData, 'title');
        const artist = get(newLyricData, 'artist');
        
        if (title || artist) {
          const lyricFileName = get(lyricFile, 'name', '');
          setCurrentSongInfo({
            title: isString(title) ? title : lyricFileName.replace('.json', ''),
            artist: isString(artist) ? artist : 'Unknown Artist'
          });
        }
      } catch (error) {
        console.error('Error parsing lyric file:', error);
        alert('File lyric không đúng định dạng JSON');
        return;
      }
    }
    
    if (isObject(audioFile)) {
      const audioUrl = URL.createObjectURL(audioFile);
      setCurrentAudioUrl(audioUrl);
      setIsAudioReady(false); // Reset audio ready state
      
      // Update song info if not already set from lyric với lodash safety
      if (!lyricFile) {
        const audioFileName = get(audioFile, 'name', '');
        setCurrentSongInfo(prev => ({
          ...prev,
          title: isString(audioFileName) ? audioFileName.replace(/\.(mp3|wav|m4a)$/i, '') : get(prev, 'title', '')
        }));
      }
    }
    
    setShowUpload(false);
  }, []);

  /**
   * Handle color changes from Settings component với lodash safety
   */
  const handleColorChange = useCallback((colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => {
    if (!isString(colorType) || !isString(color)) return;
    
    setColors(prev => ({
      ...prev,
      [colorType]: color
    }));
  }, []);

  /**
   * Handle delay changes from Settings component với lodash safety
   */
  const handleDelayChange = useCallback((delay: number) => {
    const safeDelay = clamp(toNumber(delay), -10000, 10000);
    setLyricDelay(safeDelay);
  }, []);

  /**
   * Handle font family changes from Settings component với lodash safety
   */
  const handleFontChange = useCallback((newFontFamily: string) => {
    if (isString(newFontFamily)) {
      setFontFamily(newFontFamily);
    }
  }, []);

  /**
   * Handle font size changes from Settings component với lodash safety
   */
  const handleFontSizeChange = useCallback((newSize: number) => {
    const safeSize = clamp(toNumber(newSize), 0.5, 10);
    setFontSize(safeSize);
  }, []);

  /**
   * Handle letter spacing changes from Settings component với lodash safety
   */
  const handleLetterSpacingChange = useCallback((newSpacing: number) => {
    const safeSpacing = clamp(toNumber(newSpacing), -0.5, 2);
    setLetterSpacing(safeSpacing);
  }, []);

  /**
   * Handle line height changes from Settings component với lodash safety
   */
  const handleLineHeightChange = useCallback((newHeight: number) => {
    const safeHeight = clamp(toNumber(newHeight), 0.5, 3);
    setLineHeight(safeHeight);
  }, []);

  /**
   * Handle text case changes from Settings component với lodash safety
   */
  const handleTextCaseChange = useCallback((newTextCase: 'normal' | 'uppercase' | 'lowercase') => {
    const validCases = ['normal', 'uppercase', 'lowercase'];
    if (validCases.includes(newTextCase)) {
      setTextCase(newTextCase);
    }
  }, []);

  /**
   * Handle merge sentences toggle from Settings component
   */
  const handleMergeSentencesChange = useCallback((enabled: boolean) => {
    setMergeSentences(enabled);
  }, []);

  /**
   * Close settings modal
   */
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  /**
   * Close upload modal
   */
  const closeUpload = useCallback(() => {
    setShowUpload(false);
  }, []);

  // Add keyboard event listeners for 'U' and 'I' keys với lodash safety
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isObject(event)) return;
      
      const key = get(event, 'key', '');
      const lowerKey = isString(key) ? key.toLowerCase() : '';
      
      if (lowerKey === 'u') {
        setShowUpload(prev => !prev); // Toggle upload instead of always opening
      } else if (lowerKey === 'i') {
        setShowSettings(prev => !prev); // Toggle settings instead of always opening
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Safe data extraction for components
  const audioPlayerProps = useMemo(() => ({
    url: currentAudioUrl,
    title: get(currentSongInfo, 'title', 'Unknown Title'),
    artist: get(currentSongInfo, 'artist', 'Unknown Artist'),
    playing: isPlaying,
    volume: 0.7,
    onProgress: handleAudioProgress,
    onPlay: handlePlay,
    onPause: handlePause,
    onReady: handleAudioReady,
    onTogglePlay: togglePlayback,
    className: "audio-player"
  }), [currentAudioUrl, currentSongInfo, isPlaying, handleAudioProgress, handlePlay, handlePause, handleAudioReady, togglePlayback]);

  const lyricAnimationProps = useMemo(() => ({
    lyrics: lyricsWithTiming,
    currentTime: currentTime,
    isPlaying: isPlaying,
    textCase: textCase,
    primaryColor: get(colors, 'primaryColor', '#FFF9C4'),
    secondaryColor: get(colors, 'secondaryColor', '#FFCC80'),
    textColor: get(colors, 'textColor', '#1E6D9A'),
    textShadowColor: get(colors, 'textShadowColor', '#1565C0'),
    fontFamily: fontFamily,
    customFontSize: fontSize,
    letterSpacing: letterSpacing,
    lineHeight: lineHeight,
    onComplete: handleAnimationComplete
  }), [lyricsWithTiming, currentTime, isPlaying, textCase, colors, fontFamily, fontSize, letterSpacing, lineHeight, handleAnimationComplete]);

  const settingsProps = useMemo(() => ({
    isOpen: showSettings,
    primaryColor: get(colors, 'primaryColor', '#FFF9C4'),
    secondaryColor: get(colors, 'secondaryColor', '#FFCC80'),
    textColor: get(colors, 'textColor', '#1E6D9A'),
    textShadowColor: get(colors, 'textShadowColor', '#1565C0'),
    lyricDelay: lyricDelay,
    fontFamily: fontFamily,
    fontSize: fontSize,
    letterSpacing: letterSpacing,
    lineHeight: lineHeight,
    textCase: textCase,
    mergeSentences: mergeSentences,
    onColorChange: handleColorChange,
    onDelayChange: handleDelayChange,
    onFontChange: handleFontChange,
    onFontSizeChange: handleFontSizeChange,
    onLetterSpacingChange: handleLetterSpacingChange,
    onLineHeightChange: handleLineHeightChange,
    onTextCaseChange: handleTextCaseChange,
    onMergeSentencesChange: handleMergeSentencesChange,
    onClose: closeSettings
  }), [showSettings, colors, lyricDelay, fontFamily, fontSize, letterSpacing, lineHeight, textCase, mergeSentences, handleColorChange, handleDelayChange, handleFontChange, handleFontSizeChange, handleLetterSpacingChange, handleLineHeightChange, handleTextCaseChange, handleMergeSentencesChange, closeSettings]);

  return (
    <div className="App">
      {/* Remove the upload button - now use 'U' key instead */}

      {/* Audio Player - Now as popup với lodash safety */}
      <AudioPlayer {...audioPlayerProps} />

      {/* Vintage Lyric Animation với lodash safety */}
      {isAudioReady && (
        <LyricAnimation {...lyricAnimationProps} />
      )}

      {/* File Upload Modal với lodash safety */}
      {showUpload && (
        <FileUpload 
          onFilesUploaded={handleFilesUploaded}
          onClose={closeUpload}
        />
      )}

      {/* Settings Modal với lodash safety */}
      {showSettings && (
        <Settings {...settingsProps} />
      )}
    </div>
  )
}

export default App
