import { useState, useRef, useEffect, useCallback } from 'react';

// === Public interfaces ===

export interface UseAudioPlayerOptions {
  audioUrl: string;
  autoPlay?: boolean; // default: false
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  currentTime: number; // seconds
  duration: number; // seconds (0 until loaded)
  progress: number; // 0-1 (currentTime / duration)
  error: string | null;
}

export interface AudioPlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void; // seek to absolute time in seconds
  rewind: (seconds?: number) => void; // rewind by N seconds (default: 10)
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export type UseAudioPlayerReturn = AudioPlayerState & AudioPlayerControls;

// === Hook implementation ===

const initialState: AudioPlayerState = {
  isPlaying: false,
  isPaused: false,
  isLoaded: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  error: null,
};

export function useAudioPlayer(options: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const { audioUrl, autoPlay = false } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>(initialState);

  // Reset state and update src when audioUrl changes
  useEffect(() => {
    setState(initialState);

    const el = audioRef.current;
    if (el) {
      el.src = audioUrl;
      el.load();
    }
  }, [audioUrl]);

  // Wire up audio element event listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: el.duration,
        isLoaded: true,
      }));
    };

    const onTimeUpdate = () => {
      const currentTime = el.currentTime;
      const duration = el.duration;
      setState((prev) => ({
        ...prev,
        currentTime,
        progress: duration > 0 ? currentTime / duration : 0,
      }));
    };

    const onPlay = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        error: null,
      }));
    };

    const onPause = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
    };

    const onWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
    };

    const onPlaying = () => {
      setState((prev) => ({ ...prev, isBuffering: false }));
    };

    const onEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
      }));
    };

    const onError = () => {
      const mediaError = el.error;
      let message = 'An unknown playback error occurred';
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Playback was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'A network error occurred while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = 'The audio file could not be decoded';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'The audio format is not supported';
            break;
        }
      }
      setState((prev) => ({
        ...prev,
        error: message,
        isPlaying: false,
        isBuffering: false,
      }));
    };

    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [audioUrl]); // Re-bind when URL changes (element may have been reset)

  // Auto-play once loaded if requested
  useEffect(() => {
    if (autoPlay && state.isLoaded && !state.isPlaying && !state.isPaused) {
      audioRef.current?.play().catch(() => {
        // Browser may block autoplay — silently ignore
      });
    }
    // Only trigger on isLoaded changing to true, not on every state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, state.isLoaded]);

  // === Controls ===

  const play = useCallback(async (): Promise<void> => {
    const el = audioRef.current;
    if (!el) return;
    await el.play();
  }, []);

  const pause = useCallback((): void => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
  }, []);

  const seek = useCallback((time: number): void => {
    const el = audioRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(time, el.duration || 0));
    el.currentTime = clamped;
  }, []);

  const rewind = useCallback(
    (seconds = 10): void => {
      const el = audioRef.current;
      if (!el) return;
      const target = Math.max(0, el.currentTime - seconds);
      el.currentTime = target;
    },
    [],
  );

  return {
    ...state,
    play,
    pause,
    seek,
    rewind,
    audioRef,
  };
}
