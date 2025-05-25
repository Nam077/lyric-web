import { useCallback } from 'react';
import { useAudioStore } from '../stores/audioStore';
import { useLyricStore } from '../stores/lyricStore';
import type { LyricData } from '../utils/lyricParser';

interface UploadedFiles {
  lyric: File | null;
  audio: File | null;
  font: File | null;
}

/**
 * Custom hook for handling file upload operations
 * Manages lyric and audio file processing with proper error handling
 */
export const useFileHandlers = () => {
  const audioStore = useAudioStore();
  const lyricStore = useLyricStore();

  /**
   * Parse JSON lyric file using existing utility functions
   */
  const parseJsonLyricFile = useCallback(async (file: File): Promise<LyricData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lyricData = JSON.parse(content) as LyricData;
          resolve(lyricData);
        } catch {
          reject(new Error('Invalid JSON format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  /**
   * Handle uploaded files from FileUpload component with lodash safety
   * Processes both lyric JSON files and audio files
   */
  const handleFilesUploaded = useCallback(async (files: UploadedFiles) => {
    console.log('Processing uploaded files:', files);
    
    try {
      // Process lyric file if provided
      if (files.lyric) {
        console.log('Processing lyric file:', files.lyric.name);
        
        try {
          const lyricData = await parseJsonLyricFile(files.lyric);
          if (lyricData) {
            // Store lyric data using the store's method
            lyricStore.loadLyricFromData(lyricData, files.lyric.name);
            console.log('✅ Lyric file processed and saved to storage');
          }
        } catch (error) {
          console.error('Failed to parse lyric file:', error);
          alert('Failed to parse lyric file. Please check the file format.');
        }
      }

      // Process audio file if provided - NOW WITH STORAGE INTEGRATION
      if (files.audio) {
        console.log('Processing audio file:', files.audio.name, `(${(files.audio.size / 1024 / 1024).toFixed(2)}MB)`);
        
        try {
          // Use the audio store's upload method which handles base64 conversion and storage
          const success = await audioStore.loadAudioFromFile(files.audio);
          
          if (success) {
            console.log('✅ Audio file processed and saved to storage');
          } else {
            alert('Failed to upload audio file. File might be too large or incompatible format.');
          }
        } catch (error) {
          console.error('Failed to process audio file:', error);
          alert('Failed to process audio file. Please try a different file.');
        }
      }

      // Font files are handled separately in Settings component
      if (files.font) {
        console.log('Font file provided but should be handled via Settings component');
        alert('Font files should be uploaded through Settings > Font & Typography section');
      }

    } catch (error) {
      console.error('Error processing uploaded files:', error);
      alert('An error occurred while processing files. Please try again.');
    }
  }, [audioStore, lyricStore, parseJsonLyricFile]);

  return {
    handleFilesUploaded,
  };
};