import { useState, useEffect, useCallback } from 'react';
import { TurntableScene } from './turntable';
import { SongUpload } from './SongUpload';
import { extractDominantColor } from '../utils/dominantColor';
import type { SongInput, AppAction } from '../types';

type Props = {
  deckId: 'a' | 'b';
  label: string;
  song: SongInput | null;
  dispatch: React.Dispatch<AppAction>;
  disabled?: boolean;
};

/** Proxy thumbnail URL through backend for CORS-safe access (WebGL textures, canvas sampling). */
function proxyThumbnailUrl(url: string): string {
  return `/api/thumbnail-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * InputDeck — a single turntable deck with song input controls.
 *
 * Shows an empty platter when no song is loaded, and animates a record
 * into place when a song is provided (YouTube with thumbnail or file upload).
 */
export function InputDeck({ deckId, label, song, dispatch, disabled }: Props) {
  const [vinylColor, setVinylColor] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  // Determine thumbnail URL from YouTube song input
  const rawThumbnailUrl =
    song?.type === 'youtube' && song.thumbnailUrl ? song.thumbnailUrl : undefined;
  const proxiedThumbnailUrl = rawThumbnailUrl
    ? proxyThumbnailUrl(rawThumbnailUrl)
    : undefined;

  // Extract dominant color when thumbnail becomes available
  useEffect(() => {
    if (!proxiedThumbnailUrl) {
      setVinylColor(undefined);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    extractDominantColor(proxiedThumbnailUrl).then((color) => {
      if (!cancelled) {
        setVinylColor(color);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [proxiedThumbnailUrl]);

  // For file uploads (no thumbnail), mark as loaded immediately
  useEffect(() => {
    if (song?.type === 'file') {
      setLoaded(true);
    }
    if (!song) {
      setLoaded(false);
      setVinylColor(undefined);
    }
  }, [song]);

  const isEmpty = !song;
  const isSpinning = loaded && !isEmpty;

  // Dispatch helpers
  const handleFileChange = useCallback(
    (file: File | null) => {
      if (deckId === 'a') {
        dispatch({ type: 'SET_SONG_A', file });
      } else {
        dispatch({ type: 'SET_SONG_B', file });
      }
    },
    [deckId, dispatch],
  );

  const handleYouTubeUrl = useCallback(
    (url: string, title?: string, thumbnailUrl?: string) => {
      if (deckId === 'a') {
        dispatch({ type: 'SET_YOUTUBE_URL_A', url, title, thumbnailUrl });
      } else {
        dispatch({ type: 'SET_YOUTUBE_URL_B', url, title, thumbnailUrl });
      }
    },
    [deckId, dispatch],
  );

  const handleClear = useCallback(() => {
    if (deckId === 'a') {
      dispatch({ type: 'CLEAR_SONG_A' });
    } else {
      dispatch({ type: 'CLEAR_SONG_B' });
    }
  }, [deckId, dispatch]);

  // Song title for the record label
  const songTitle =
    song?.type === 'youtube' && song.title
      ? song.title
      : song?.type === 'file'
        ? song.file.name
        : '';

  return (
    <div className="flex flex-col gap-3">
      {/* Role label */}
      <p className="text-xs font-medium text-amber-200/60 text-center uppercase tracking-wider">
        {label}
      </p>

      {/* Turntable */}
      <div
        className={`transition-all duration-700 ease-out ${
          loaded && !isEmpty
            ? 'opacity-100 translate-y-0 scale-100'
            : isEmpty
              ? 'opacity-100'
              : 'opacity-0 -translate-y-3 scale-95'
        }`}
      >
        <TurntableScene
          remixTitle={songTitle}
          tonearmAngle={0}
          isSpinning={isSpinning}
          deckId={deckId}
          isEmpty={isEmpty}
          thumbnailUrl={proxiedThumbnailUrl}
          vinylColor={vinylColor}
          className={isSpinning ? 'deck-idle-spin' : ''}
        />
      </div>

      {/* Song input */}
      <SongUpload
        label={label}
        song={song}
        onFileChange={handleFileChange}
        onYouTubeUrl={handleYouTubeUrl}
        onClear={handleClear}
        disabled={disabled}
      />
    </div>
  );
}
