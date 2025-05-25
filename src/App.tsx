import { useEffect } from 'react'
import { LyricAnimation } from './components/LyricAnimation';
import { AudioPlayer } from './components/AudioPlayer';
import { Settings } from './components/Settings';
import FileUpload from './components/FileUpload';

// Import Zustand stores
import { useAudioStore } from './stores/audioStore';
import { useAppearanceStore } from './stores/appearanceStore';
import { useTypographyStore } from './stores/typographyStore';
import { useLyricStore } from './stores/lyricStore';
import { useUIStore } from './stores/uiStore';
import { initializeAppStorage } from './stores/storageStore';

// Import custom hooks
import { useKeyboardHandlers } from './hooks/useKeyboardHandlers';

import './App.css'

function App() {
  // Only need these stores for conditional rendering
  const audioStore = useAudioStore();
  const uiStore = useUIStore();

  // Initialize storage and load saved data on app startup
  useEffect(() => {
    const initStorage = async () => {
      console.log('Initializing storage system...');
      const initialized = await initializeAppStorage();
      
      if (initialized) {
        // Load saved data into all stores
        useAudioStore.getState().loadFromStorage();
        useAppearanceStore.getState().loadFromStorage();
        useTypographyStore.getState().loadFromStorage();
        useLyricStore.getState().loadFromStorage();
        useUIStore.getState().loadFromStorage();
        
        console.log('✅ All stores loaded from localStorage');
      }
    };
    
    initStorage();
  }, []); // Empty dependency array - only run once on mount
  
  // Initialize keyboard event listeners
  useKeyboardHandlers();

  return (
    <div className="App">
      {/* Audio Player - Now uses stores internally */}
      <AudioPlayer />

      {/* Vintage Lyric Animation - Now uses stores internally */}
      {audioStore.isAudioReady && (
        <LyricAnimation />
      )}

      {/* File Upload Modal - Now uses stores internally */}
      {uiStore.showUpload && (
        <FileUpload />
      )}

      {/* Settings Modal - Now uses stores internally */}
      {uiStore.showSettings && (
        <Settings />
      )}
    </div>
  )
}

export default App
