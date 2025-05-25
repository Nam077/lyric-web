import React, { useState, useCallback, useRef } from 'react';
import { 
  get, isObject, isFunction, 
  toNumber, clamp
} from 'lodash';
import { useUIStore } from '../../stores/uiStore';
import { useFileHandlers } from '../../hooks/useFileHandlers';
import styles from './FileUpload.module.css';

interface UploadedFiles {
  lyric: File | null;
  audio: File | null;
  font: File | null;
}

const FileUpload: React.FC = () => {
  const uiStore = useUIStore();
  const { handleFilesUploaded } = useFileHandlers();
  
  const [files, setFiles] = useState<UploadedFiles>({ lyric: null, audio: null, font: null });
  const [isDragOver, setIsDragOver] = useState<'lyric' | 'audio' | null>(null);
  const lyricInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    uiStore.setShowUpload(false);
  }, [uiStore]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'lyric' | 'audio') => {
    // Enhanced event safety
    if (!isObject(e)) return;
    
    if (isFunction(get(e, 'preventDefault'))) {
      e.preventDefault();
    }
    
    setIsDragOver(null);
    
    const dataTransfer = get(e, 'dataTransfer');
    const filesArray = isObject(dataTransfer) ? get(dataTransfer, 'files') : null;
    
    if (!filesArray) return;
    
    const droppedFiles = Array.from(filesArray);
    const file = get(droppedFiles, '[0]');
    
    if (!isObject(file)) return;
    
    // Enhanced file validation with lodash safety
    const fileName = get(file, 'name', '');
    const fileType = get(file, 'type', '');
    
    if (type === 'lyric' && !fileName.endsWith('.json')) {
      alert('Please select a JSON file for lyrics');
      return;
    }
    
    if (type === 'audio' && !fileType.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, M4A)');
      return;
    }
    
    setFiles(prev => ({ ...prev, [type]: file }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'lyric' | 'audio') => {
    // Enhanced event and target safety
    if (!isObject(e)) return;
    
    const target = get(e, 'target');
    const filesArray = isObject(target) ? get(target, 'files') : null;
    const file = filesArray && get(filesArray, '[0]');
    
    if (isObject(file)) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'lyric' | 'audio') => {
    if (!isObject(e)) return;
    
    if (isFunction(get(e, 'preventDefault'))) {
      e.preventDefault();
    }
    
    setIsDragOver(type);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const lyricFile = get(files, 'lyric');
    const audioFile = get(files, 'audio');
    
    if (!lyricFile && !audioFile) {
      alert('Please select at least one file');
      return;
    }
    
    handleFilesUploaded(files);
    handleClose();
  }, [files, handleFilesUploaded, handleClose]);

  const clearFile = useCallback((type: 'lyric' | 'audio') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    
    // Enhanced ref safety
    if (type === 'lyric') {
      const lyricInput = get(lyricInputRef, 'current');
      if (isObject(lyricInput) && 'value' in lyricInput) {
        lyricInput.value = '';
      }
    }
    
    if (type === 'audio') {
      const audioInput = get(audioInputRef, 'current');
      if (isObject(audioInput) && 'value' in audioInput) {
        audioInput.value = '';
      }
    }
  }, []);

  // Enhanced safe click handlers
  const handleLyricInputClick = useCallback(() => {
    const lyricInput = get(lyricInputRef, 'current');
    if (isObject(lyricInput) && isFunction(get(lyricInput, 'click'))) {
      lyricInput.click();
    }
  }, []);

  const handleAudioInputClick = useCallback(() => {
    const audioInput = get(audioInputRef, 'current');
    if (isObject(audioInput) && isFunction(get(audioInput, 'click'))) {
      audioInput.click();
    }
  }, []);

  // Safe file info extraction
  const getLyricFileInfo = useCallback(() => {
    const lyricFile = get(files, 'lyric');
    if (!isObject(lyricFile)) return null;
    
    const name = get(lyricFile, 'name', 'Unknown file');
    const size = get(lyricFile, 'size', 0);
    const sizeKB = clamp(toNumber(size) / 1024, 0, Number.MAX_SAFE_INTEGER);
    
    return { name, sizeKB: sizeKB.toFixed(1) };
  }, [files]);

  const getAudioFileInfo = useCallback(() => {
    const audioFile = get(files, 'audio');
    if (!isObject(audioFile)) return null;
    
    const name = get(audioFile, 'name', 'Unknown file');
    const size = get(audioFile, 'size', 0);
    const sizeMB = clamp(toNumber(size) / 1024 / 1024, 0, Number.MAX_SAFE_INTEGER);
    
    return { name, sizeMB: sizeMB.toFixed(1) };
  }, [files]);

  // Safe state checks - fixed
  const hasLyricFile = !!get(files, 'lyric');
  const hasAudioFile = !!get(files, 'audio');
  const isDragOverLyric = isDragOver === 'lyric';
  const isDragOverAudio = isDragOver === 'audio';
  const lyricFileInfo = getLyricFileInfo();
  const audioFileInfo = getAudioFileInfo();

  return (
    <div className={get(styles, 'overlay', '')}>
      <div 
        className={get(styles, 'container', '')} 
        onClick={(e) => {
          if (isFunction(get(e, 'stopPropagation'))) {
            e.stopPropagation();
          }
        }}
      >
        <div className={get(styles, 'header', '')}>
          <h2>Upload Files</h2>
          <button 
            className={get(styles, 'closeButton', '')} 
            onClick={handleClose} 
            title="Close Upload"
          >
            ✕
          </button>
        </div>

        <div className={get(styles, 'content', '')}>
          {/* Lyric File Section */}
          <div className={get(styles, 'section', '')}>
            <h3>Lyric File</h3>
            <div className={get(styles, 'fileGroup', '')}>
              <div 
                className={`${get(styles, 'fileInputWrapper', '')} ${isDragOverLyric ? get(styles, 'dragOver', '') : ''} ${hasLyricFile ? get(styles, 'hasFile', '') : ''}`}
                onDrop={(e) => handleDrop(e, 'lyric')}
                onDragOver={(e) => handleDragOver(e, 'lyric')}
                onDragLeave={handleDragLeave}
                onClick={handleLyricInputClick}
              >
                {hasLyricFile && lyricFileInfo ? (
                  <div className={get(styles, 'fileInfo', '')}>
                    <div className={get(styles, 'fileIcon', '')}>📄</div>
                    <div className={get(styles, 'fileDetails', '')}>
                      <span className={get(styles, 'fileName', '')}>{lyricFileInfo.name}</span>
                      <span className={get(styles, 'fileSize', '')}>{lyricFileInfo.sizeKB} KB</span>
                    </div>
                    <button 
                      className={get(styles, 'removeButton', '')}
                      onClick={(e) => {
                        if (isFunction(get(e, 'stopPropagation'))) {
                          e.stopPropagation();
                        }
                        clearFile('lyric');
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={get(styles, 'dropZone', '')}>
                    <div className={get(styles, 'dropIcon', '')}>📁</div>
                    <div className={get(styles, 'dropText', '')}>
                      <span>Drop JSON file or click to select</span>
                      <small className={get(styles, 'dropHint', '')}>Lyric timing data (.json)</small>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={lyricInputRef}
                type="file"
                accept=".json"
                className={get(styles, 'hiddenInput', '')}
                onChange={(e) => handleFileChange(e, 'lyric')}
              />
            </div>
          </div>

          {/* Audio File Section */}
          <div className={get(styles, 'section', '')}>
            <h3>Audio File</h3>
            <div className={get(styles, 'fileGroup', '')}>
              <div 
                className={`${get(styles, 'fileInputWrapper', '')} ${isDragOverAudio ? get(styles, 'dragOver', '') : ''} ${hasAudioFile ? get(styles, 'hasFile', '') : ''}`}
                onDrop={(e) => handleDrop(e, 'audio')}
                onDragOver={(e) => handleDragOver(e, 'audio')}
                onDragLeave={handleDragLeave}
                onClick={handleAudioInputClick}
              >
                {hasAudioFile && audioFileInfo ? (
                  <div className={get(styles, 'fileInfo', '')}>
                    <div className={get(styles, 'fileIcon', '')}>🎵</div>
                    <div className={get(styles, 'fileDetails', '')}>
                      <span className={get(styles, 'fileName', '')}>{audioFileInfo.name}</span>
                      <span className={get(styles, 'fileSize', '')}>{audioFileInfo.sizeMB} MB</span>
                    </div>
                    <button 
                      className={get(styles, 'removeButton', '')}
                      onClick={(e) => {
                        if (isFunction(get(e, 'stopPropagation'))) {
                          e.stopPropagation();
                        }
                        clearFile('audio');
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={get(styles, 'dropZone', '')}>
                    <div className={get(styles, 'dropIcon', '')}>🎵</div>
                    <div className={get(styles, 'dropText', '')}>
                      <span>Drop audio file or click to select</span>
                      <small className={get(styles, 'dropHint', '')}>MP3, WAV, M4A formats</small>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className={get(styles, 'hiddenInput', '')}
                onChange={(e) => handleFileChange(e, 'audio')}
              />
            </div>
          </div>
        </div>

        <div className={get(styles, 'footer', '')}>
          <div className={get(styles, 'actions', '')}>
            <button className={get(styles, 'cancelButton', '')} onClick={handleClose}>
              Cancel
            </button>
            <button 
              className={get(styles, 'uploadButton', '')} 
              onClick={handleSubmit}
              disabled={!hasLyricFile && !hasAudioFile}
            >
              Upload Files
            </button>
          </div>
          <div className={get(styles, 'shortcuts', '')}>
            <span><kbd>U</kbd> Upload Files</span>
            <span><kbd>I</kbd> Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;