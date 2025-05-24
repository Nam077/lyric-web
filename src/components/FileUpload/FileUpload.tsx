import React, { useState, useCallback, useRef } from 'react';
import styles from './FileUpload.module.css';

interface UploadedFiles {
  lyric: File | null;
  audio: File | null;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFiles) => void;
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, onClose }) => {
  const [files, setFiles] = useState<UploadedFiles>({ lyric: null, audio: null });
  const [isDragOver, setIsDragOver] = useState<'lyric' | 'audio' | null>(null);
  const lyricInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent, type: 'lyric' | 'audio') => {
    e.preventDefault();
    setIsDragOver(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const file = droppedFiles[0];
    
    if (!file) return;
    
    // Validate file type
    if (type === 'lyric' && !file.name.endsWith('.json')) {
      alert('Please select a JSON file for lyrics');
      return;
    }
    
    if (type === 'audio' && !file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, M4A)');
      return;
    }
    
    setFiles(prev => ({ ...prev, [type]: file }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'lyric' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'lyric' | 'audio') => {
    e.preventDefault();
    setIsDragOver(type);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!files.lyric && !files.audio) {
      alert('Please select at least one file');
      return;
    }
    
    onFilesUploaded(files);
  }, [files, onFilesUploaded]);

  const clearFile = useCallback((type: 'lyric' | 'audio') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    if (type === 'lyric' && lyricInputRef.current) {
      lyricInputRef.current.value = '';
    }
    if (type === 'audio' && audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Upload Files</h2>
          <button className={styles.closeButton} onClick={onClose} title="Close Upload">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Lyric File Section */}
          <div className={styles.section}>
            <h3>Lyric File</h3>
            <div className={styles.fileGroup}>
              <div 
                className={`${styles.fileInputWrapper} ${isDragOver === 'lyric' ? styles.dragOver : ''} ${files.lyric ? styles.hasFile : ''}`}
                onDrop={(e) => handleDrop(e, 'lyric')}
                onDragOver={(e) => handleDragOver(e, 'lyric')}
                onDragLeave={handleDragLeave}
                onClick={() => lyricInputRef.current?.click()}
              >
                {files.lyric ? (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>📄</div>
                    <div className={styles.fileDetails}>
                      <span className={styles.fileName}>{files.lyric.name}</span>
                      <span className={styles.fileSize}>{(files.lyric.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile('lyric');
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropZone}>
                    <div className={styles.dropIcon}>📁</div>
                    <div className={styles.dropText}>
                      <span>Drop JSON file or click to select</span>
                      <small className={styles.dropHint}>Lyric timing data (.json)</small>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={lyricInputRef}
                type="file"
                accept=".json"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'lyric')}
              />
            </div>
          </div>

          {/* Audio File Section */}
          <div className={styles.section}>
            <h3>Audio File</h3>
            <div className={styles.fileGroup}>
              <div 
                className={`${styles.fileInputWrapper} ${isDragOver === 'audio' ? styles.dragOver : ''} ${files.audio ? styles.hasFile : ''}`}
                onDrop={(e) => handleDrop(e, 'audio')}
                onDragOver={(e) => handleDragOver(e, 'audio')}
                onDragLeave={handleDragLeave}
                onClick={() => audioInputRef.current?.click()}
              >
                {files.audio ? (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>🎵</div>
                    <div className={styles.fileDetails}>
                      <span className={styles.fileName}>{files.audio.name}</span>
                      <span className={styles.fileSize}>{(files.audio.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile('audio');
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropZone}>
                    <div className={styles.dropIcon}>🎵</div>
                    <div className={styles.dropText}>
                      <span>Drop audio file or click to select</span>
                      <small className={styles.dropHint}>MP3, WAV, M4A formats</small>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'audio')}
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              className={styles.uploadButton} 
              onClick={handleSubmit}
              disabled={!files.lyric && !files.audio}
            >
              Upload Files
            </button>
          </div>
          <div className={styles.shortcuts}>
            <span><kbd>U</kbd> Upload Files</span>
            <span><kbd>I</kbd> Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;