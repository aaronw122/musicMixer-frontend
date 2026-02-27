import { useEffect, useRef } from 'react';
import type { AppState, AppAction } from '../types';

const DB_NAME = 'musicMixer';
const DB_VERSION = 1;
const STORE_NAME = 'formData';
const PROMPT_KEY = 'remix_prompt';

// --- IndexedDB helpers ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFile(key: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ blob: file, name: file.name, type: file.type }, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function deleteFile(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function loadFile(key: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      db.close();
      if (!req.result) return resolve(null);
      const { blob, name, type } = req.result;
      resolve(new File([blob], name, { type }));
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function clearFiles(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// --- Hook ---

export function useFormPersistence(
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
) {
  const restored = useRef(false);

  // Extract form fields safely across all phases (for use in deps)
  const prompt = 'prompt' in state ? state.prompt : '';
  const songA = 'songA' in state ? state.songA : null;
  const songB = 'songB' in state ? state.songB : null;

  // Restore saved data on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    async function restore() {
      try {
        const prompt = sessionStorage.getItem(PROMPT_KEY);
        const [songA, songB] = await Promise.all([loadFile('songA'), loadFile('songB')]);

        if (songA) dispatch({ type: 'SET_SONG_A', file: songA });
        if (songB) dispatch({ type: 'SET_SONG_B', file: songB });
        if (prompt) dispatch({ type: 'SET_PROMPT', prompt });
      } catch {
        // Storage unavailable — silently degrade
      }
    }
    restore();
  }, [dispatch]);

  // Persist prompt changes
  useEffect(() => {
    if (state.phase !== 'idle' && state.phase !== 'error') return;
    try {
      sessionStorage.setItem(PROMPT_KEY, prompt);
    } catch {
      // quota exceeded — ignore
    }
  }, [state.phase, prompt]);

  // Persist file changes (save or delete)
  useEffect(() => {
    if (state.phase !== 'idle') return;
    if (songA) saveFile('songA', songA).catch(() => {});
    else deleteFile('songA').catch(() => {});
    if (songB) saveFile('songB', songB).catch(() => {});
    else deleteFile('songB').catch(() => {});
  }, [state.phase, songA, songB]);

  // Clear storage when remix is complete
  useEffect(() => {
    if (state.phase === 'ready') {
      sessionStorage.removeItem(PROMPT_KEY);
      clearFiles().catch(() => {});
    }
  }, [state.phase]);
}
