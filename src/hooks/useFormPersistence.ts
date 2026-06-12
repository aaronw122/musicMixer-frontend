import { useEffect, useRef } from 'react';
import type { AppState, AppAction, SongInput } from '../types';

export type PersistedSelections = {
  songA: SongInput | null;
  songB: SongInput | null;
};

const DB_NAME = 'musicSpinner';
const DB_VERSION = 1;
const STORE_NAME = 'formData';
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

export async function clearFiles(): Promise<void> {
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

export function clearYouTubeUrls(): void {
  sessionStorage.removeItem(SONG_A_YT_KEY);
  sessionStorage.removeItem(SONG_B_YT_KEY);
}

// Route state cannot carry uploaded File objects, so persisted selections are
// cleared only after the creator observes a successful remix.
export async function clearPersistedSelections(): Promise<void> {
  clearYouTubeUrls();
  await clearFiles().catch(() => {});
}

export async function loadPersistedSelections(): Promise<PersistedSelections> {
  let songA: SongInput | null = null;
  let songB: SongInput | null = null;
  try {
    const [fileA, fileB] = await Promise.all([loadFile('songA'), loadFile('songB')]);
    const ytA = loadYouTubeUrl(SONG_A_YT_KEY);
    const ytB = loadYouTubeUrl(SONG_B_YT_KEY);

    if (fileA) songA = { type: 'file', file: fileA };
    else if (ytA) songA = { type: 'youtube', url: ytA.url, title: ytA.title, thumbnailUrl: ytA.thumbnailUrl };

    if (fileB) songB = { type: 'file', file: fileB };
    else if (ytB) songB = { type: 'youtube', url: ytB.url, title: ytB.title, thumbnailUrl: ytB.thumbnailUrl };
  } catch {
    // Storage unavailable — degrade to no selections (retry will navigate home).
  }
  return { songA, songB };
}

function dispatchRestoredSong(
  slot: 'A' | 'B',
  song: SongInput | null,
  dispatch: React.Dispatch<AppAction>,
): void {
  if (!song) return;

  if (song.type === 'file') {
    dispatch({ type: slot === 'A' ? 'SET_SONG_A' : 'SET_SONG_B', file: song.file });
    return;
  }

  dispatch({
    type: slot === 'A' ? 'SET_YOUTUBE_URL_A' : 'SET_YOUTUBE_URL_B',
    url: song.url,
    title: song.title,
    thumbnailUrl: song.thumbnailUrl,
  });
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
  const songA = 'songA' in state ? state.songA : null;
  const songB = 'songB' in state ? state.songB : null;

  // Restore saved data on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    async function restore() {
      const selections = await loadPersistedSelections();
      dispatchRestoredSong('A', selections.songA, dispatch);
      dispatchRestoredSong('B', selections.songB, dispatch);
    }
    restore();
  }, [dispatch]);

  // Persist song input changes (save or delete)
  useEffect(() => {
    if (state.phase !== 'idle') return;
    persistSongInput('A', songA);
    persistSongInput('B', songB);
  }, [state.phase, songA, songB]);

  // RemixPage clears creator selections after success; this hook only restores
  // and persists the editable form.
}
