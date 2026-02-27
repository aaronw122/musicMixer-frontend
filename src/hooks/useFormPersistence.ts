import { useEffect, useRef } from 'react';
import type { AppState, AppAction, SongInput } from '../types';

const DB_NAME = 'musicMixer';
const DB_VERSION = 1;
const STORE_NAME = 'formData';
const PROMPT_KEY = 'remix_prompt';
const SONG_A_YT_KEY = 'remix_song_a_youtube';
const SONG_B_YT_KEY = 'remix_song_b_youtube';

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

// --- YouTube URL session storage helpers ---

type StoredYouTube = { url: string; title?: string; thumbnailUrl?: string };

function saveYouTubeUrl(key: string, data: StoredYouTube): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded — ignore
  }
}

function loadYouTubeUrl(key: string): StoredYouTube | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearYouTubeUrls(): void {
  sessionStorage.removeItem(SONG_A_YT_KEY);
  sessionStorage.removeItem(SONG_B_YT_KEY);
}

// --- Persistence helpers for SongInput ---

function persistSongInput(slot: 'A' | 'B', song: SongInput | null): void {
  const fileKey = slot === 'A' ? 'songA' : 'songB';
  const ytKey = slot === 'A' ? SONG_A_YT_KEY : SONG_B_YT_KEY;

  if (!song) {
    deleteFile(fileKey).catch(() => {});
    sessionStorage.removeItem(ytKey);
    return;
  }

  if (song.type === 'file') {
    saveFile(fileKey, song.file).catch(() => {});
    sessionStorage.removeItem(ytKey);
  } else {
    deleteFile(fileKey).catch(() => {});
    saveYouTubeUrl(ytKey, {
      url: song.url,
      title: song.title,
      thumbnailUrl: song.thumbnailUrl,
    });
  }
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

        // Try loading files from IndexedDB
        const [fileA, fileB] = await Promise.all([loadFile('songA'), loadFile('songB')]);

        // Try loading YouTube URLs from sessionStorage
        const ytA = loadYouTubeUrl(SONG_A_YT_KEY);
        const ytB = loadYouTubeUrl(SONG_B_YT_KEY);

        // Restore Song A (file takes precedence if both exist)
        if (fileA) {
          dispatch({ type: 'SET_SONG_A', file: fileA });
        } else if (ytA) {
          dispatch({
            type: 'SET_YOUTUBE_URL_A',
            url: ytA.url,
            title: ytA.title,
            thumbnailUrl: ytA.thumbnailUrl,
          });
        }

        // Restore Song B
        if (fileB) {
          dispatch({ type: 'SET_SONG_B', file: fileB });
        } else if (ytB) {
          dispatch({
            type: 'SET_YOUTUBE_URL_B',
            url: ytB.url,
            title: ytB.title,
            thumbnailUrl: ytB.thumbnailUrl,
          });
        }

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

  // Persist song input changes (save or delete)
  useEffect(() => {
    if (state.phase !== 'idle') return;
    persistSongInput('A', songA);
    persistSongInput('B', songB);
  }, [state.phase, songA, songB]);

  // Clear storage when remix is complete
  useEffect(() => {
    if (state.phase === 'ready') {
      sessionStorage.removeItem(PROMPT_KEY);
      clearYouTubeUrls();
      clearFiles().catch(() => {});
    }
  }, [state.phase]);
}
