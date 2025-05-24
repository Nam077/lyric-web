import { useState, useCallback, useMemo, useEffect } from 'react'
import { LyricAnimation } from './components/LyricAnimation';
import { AudioPlayer } from './components/AudioPlayer';
import { Settings } from './components/Settings';
import FileUpload from './components/FileUpload';
import { processLyricData, getCurrentLyricIndex, normalizeTiming } from './utils/lyricParser';
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

  // FIX: Memoize processed lyrics với delay support
  const lyricsWithTiming = useMemo(() => {
    try {
      const processed = processLyricData(currentLyricData);
      // Apply delay to normalized timing
      const withDelay = normalizeTiming(processed, lyricDelay);
      console.log('Processed lyrics with delay:', lyricDelay, 'ms');
      return withDelay;
    } catch (error) {
      console.error('Error processing lyrics:', error);
      return [];
    }
  }, [currentLyricData, lyricDelay]);

  // Xử lý khi audio progress update
  const handleAudioProgress = useCallback((progress: { playedSeconds: number; played: number }) => {
    const currentTimeMs = progress.playedSeconds * 1000;
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
    console.log('Lyric animation completed!');
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  /**
   * Handle uploaded files from FileUpload component
   */
  const handleFilesUploaded = useCallback(async (files: UploadedFiles) => {
    if (files.lyric) {
      try {
        const lyricText = await files.lyric.text();
        const newLyricData = JSON.parse(lyricText);
        setCurrentLyricData(newLyricData);
        
        // Extract song info if available in lyric data
        if (newLyricData.title || newLyricData.artist) {
          setCurrentSongInfo({
            title: newLyricData.title || files.lyric.name.replace('.json', ''),
            artist: newLyricData.artist || 'Unknown Artist'
          });
        }
      } catch (error) {
        console.error('Error parsing lyric file:', error);
        alert('File lyric không đúng định dạng JSON');
        return;
      }
    }
    
    if (files.audio) {
      const audioUrl = URL.createObjectURL(files.audio);
      setCurrentAudioUrl(audioUrl);
      setIsAudioReady(false); // Reset audio ready state
      
      // Update song info if not already set from lyric
      if (!files.lyric) {
        setCurrentSongInfo(prev => ({
          ...prev,
          title: files.audio?.name.replace(/\.(mp3|wav|m4a)$/i, '') || prev.title
        }));
      }
    }
    
    setShowUpload(false);
  }, []);

  /**
   * Handle color changes from Settings component
   */
  const handleColorChange = useCallback((colorType: 'primaryColor' | 'secondaryColor' | 'textColor' | 'textShadowColor', color: string) => {
    setColors(prev => ({
      ...prev,
      [colorType]: color
    }));
  }, []);

  /**
   * Handle delay changes from Settings component
   */
  const handleDelayChange = useCallback((delay: number) => {
    setLyricDelay(delay);
  }, []);

  /**
   * Handle font family changes from Settings component
   */
  const handleFontChange = useCallback((newFontFamily: string) => {
    setFontFamily(newFontFamily);
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

  // Add keyboard event listeners for 'U' and 'I' keys
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'u') {
        setShowUpload(true);
      } else if (event.key.toLowerCase() === 'i') {
        setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="App">
      {/* Remove the upload button - now use 'U' key instead */}

      {/* Audio Player - Now as popup */}
      <AudioPlayer 
        url={currentAudioUrl}
        title={currentSongInfo.title}
        artist={currentSongInfo.artist}
        playing={isPlaying}
        volume={0.7}
        onProgress={handleAudioProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onReady={handleAudioReady}
        onTogglePlay={togglePlayback}
        className="audio-player"
      />

      {/* Vintage Lyric Animation */}
      {isAudioReady && (
        <LyricAnimation 
          lyrics={lyricsWithTiming}
          currentTime={currentTime}
          isPlaying={isPlaying}
          fontSize="large"
          uppercase={true}
          primaryColor={colors.primaryColor}      // Light yellow for background stripe
          secondaryColor={colors.secondaryColor}    // Lighter orange-yellow for background stripe
          textColor={colors.textColor}        // Medium blue text color (less dark)
          textShadowColor={colors.textShadowColor}  // Medium blue shadow color
          fontFamily={fontFamily}
          onComplete={handleAnimationComplete}
        />
      )}

      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload 
          onFilesUploaded={handleFilesUploaded}
          onClose={closeUpload}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
          isOpen={showSettings}
          primaryColor={colors.primaryColor}
          secondaryColor={colors.secondaryColor}
          textColor={colors.textColor}
          textShadowColor={colors.textShadowColor}
          lyricDelay={lyricDelay}
          fontFamily={fontFamily}
          onColorChange={handleColorChange}
          onDelayChange={handleDelayChange}
          onFontChange={handleFontChange}
          onClose={closeSettings}
        />
      )}
    </div>
  )
}

export default App
