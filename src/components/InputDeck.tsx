import { useState, useEffect } from 'react';
import { TurntableScene } from './turntable';
import { extractDominantColor } from '../utils/dominantColor';
import type { SongInput } from '../types';

type Props = {
  deckId: 'a' | 'b';
  song: SongInput | null;
};

/** Proxy thumbnail URL through backend for CORS-safe access. */
function proxyThumbnailUrl(url: string): string {
  return `/api/thumbnail-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * InputDeck — a single turntable deck (visual only).
 *
 * Shows an empty platter when no song is loaded, and a spinning record
 * with tonearm dropped when a song is loaded. Song selection is handled
 * by the SongPickerModal, not inline controls.
 */
export function InputDeck({ deckId, song }: Props) {
  const [vinylColor, setVinylColor] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

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

  const songTitle =
    song?.type === 'youtube' && song.title
      ? song.title
      : song?.type === 'file'
        ? song.file.name
        : '';

  // Tonearm: 9° parked (empty), 24° on record (loaded)
  const tonearmAngle = isEmpty ? 7 : -12;

  return (
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
        tonearmAngle={tonearmAngle}
        isSpinning={isSpinning}
        deckId={deckId}
        isEmpty={isEmpty}
        thumbnailUrl={proxiedThumbnailUrl}
        vinylColor={vinylColor}
      />
    </div>
  );
}
