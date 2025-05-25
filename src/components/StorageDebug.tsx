import React, { useEffect, useState } from 'react';
import { useStorageStore } from '../stores/storageStore';
import { useAppearanceStore } from '../stores/appearanceStore';
import { useTypographyStore } from '../stores/typographyStore';

/**
 * Debug component to test storage functionality with binary data support
 */
export const StorageDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const storageStore = useStorageStore();
  const appearanceStore = useAppearanceStore();
  const typographyStore = useTypographyStore();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Storage initialized: ${storageStore.isInitialized}`);
    addLog(`Storage status: ${storageStore.syncStatus}`);
  }, [storageStore.isInitialized, storageStore.syncStatus]);

  const testColorChange = () => {
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    addLog(`Testing color change to: ${randomColor}`);
    appearanceStore.setColor('primaryColor', randomColor);
  };

  const testFontSizeChange = () => {
    const newSize = Math.random() * 5 + 1; // 1-6
    addLog(`Testing font size change to: ${newSize.toFixed(1)}`);
    typographyStore.setFontSize(newSize);
  };

  const checkLocalStorage = () => {
    const appearance = localStorage.getItem('lyric-web-appearance');
    const typography = localStorage.getItem('lyric-web-typography');
    const audio = localStorage.getItem('lyric-web-audio');
    const lyric = localStorage.getItem('lyric-web-lyric');
    
    addLog(`LS appearance: ${appearance ? 'exists' : 'not found'}`);
    addLog(`LS typography: ${typography ? 'exists' : 'not found'}`);
    addLog(`LS audio: ${audio ? 'exists' : 'not found'}`);
    addLog(`LS lyric: ${lyric ? 'exists' : 'not found'}`);
  };

  const checkStorageSize = () => {
    const totalSize = storageStore.getStorageSize();
    const availableSpace = 5 * 1024 * 1024 - totalSize; // 5MB limit
    addLog(`Storage used: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    addLog(`Available: ${(availableSpace / 1024 / 1024).toFixed(2)}MB`);
  };

  const clearStorage = () => {
    storageStore.clearStorage();
    addLog('Cleared all storage');
  };

  const testAudioUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        addLog(`Testing audio upload: ${file.name}`);
        const audioStore = (await import('../stores/audioStore')).useAudioStore.getState();
        const success = await audioStore.loadAudioFromFile(file);
        addLog(`Audio upload ${success ? 'success' : 'failed'}`);
      }
    };
    input.click();
  };

  const testFontUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        addLog(`Testing font upload: ${file.name}`);
        const success = await typographyStore.loadFontFromFile(file);
        addLog(`Font upload ${success ? 'success' : 'failed'}`);
      }
    };
    input.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '320px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      zIndex: 9999,
      maxHeight: '500px',
      overflow: 'auto',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Storage Debug</h3>
      
      <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <button onClick={testColorChange} style={{ padding: '4px', fontSize: '10px' }}>Test Color</button>
        <button onClick={testFontSizeChange} style={{ padding: '4px', fontSize: '10px' }}>Test Font Size</button>
        <button onClick={testAudioUpload} style={{ padding: '4px', fontSize: '10px' }}>Test Audio</button>
        <button onClick={testFontUpload} style={{ padding: '4px', fontSize: '10px' }}>Test Font</button>
        <button onClick={checkLocalStorage} style={{ padding: '4px', fontSize: '10px' }}>Check LS</button>
        <button onClick={checkStorageSize} style={{ padding: '4px', fontSize: '10px' }}>Check Size</button>
        <button onClick={clearStorage} style={{ padding: '4px', fontSize: '10px', gridColumn: 'span 2' }}>Clear All</button>
      </div>

      <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
        <strong>Current Values:</strong><br/>
        Primary Color: {appearanceStore.primaryColor}<br/>
        Font Size: {typographyStore.fontSize}em<br/>
        Font Family: {typographyStore.fontFamily}<br/>
        Storage Status: {storageStore.syncStatus}<br/>
        Custom Font: {typographyStore.customFontData ? 'loaded' : 'none'}<br/>
      </div>

      <div>
        <strong>Logs:</strong>
        <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '4px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ fontSize: '9px', opacity: 0.8, padding: '1px 0' }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};