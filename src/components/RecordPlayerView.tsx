import { useState, useEffect, useCallback, useRef } from 'react';
import { TurntableScene } from './turntable';
import { FloatingControls } from './turntable';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

type AnimationPhase = 'placing' | 'idle' | 'playing' | 'paused';

type Props = {
  audioUrl: string;
  remixTitle?: string;
  autoPlayAfterPlacement?: boolean;
  /** Skip the placement animation (record already visible from mix process) */
  skipPlacement?: boolean;
  mixedRecord?: {
    leftThumbnailUrl?: string;
    rightThumbnailUrl?: string;
  };
};

// Tonearm angles (negative = over the record, positive = toward rest cradle)
const PARKED_ANGLE = 7;
const OUTER_GROOVE_ANGLE = -12;
const INNER_GROOVE_ANGLE = -19;
const ANGLE_RANGE = INNER_GROOVE_ANGLE - OUTER_GROOVE_ANGLE;

// Timing
const PLACEMENT_DURATION_MS = 1500;
const TONEARM_SWING_DELAY_MS = 400; // delay before starting audio (let tonearm begin swinging)

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RecordPlayerView({
  audioUrl,
  remixTitle = 'Your Remix',
  autoPlayAfterPlacement = false,
  skipPlacement = false,
  mixedRecord,
}: Props) {
  const [phase, setPhase] = useState<AnimationPhase>(skipPlacement ? 'idle' : 'placing');

  // Track whether we're in the middle of a play/pause transition
  const transitionRef = useRef(false);

  const {
    isPlaying: audioIsPlaying,
    currentTime,
    duration,
    progress,
    play,
    pause,
    seek,
    audioRef,
    error,
  } = useAudioPlayer({ audioUrl });

  // === Tonearm angle calculation ===
  const tonearmAngle = (() => {
    switch (phase) {
      case 'placing':
      case 'idle':
      case 'paused':
        return PARKED_ANGLE;
      case 'playing':
        return OUTER_GROOVE_ANGLE + progress * ANGLE_RANGE;
    }
  })();

  // === Spinning state ===
  const isSpinning = phase === 'playing';

  // === Play handler ===
  const handlePlay = useCallback(async () => {
    if (transitionRef.current) return;
    if (phase !== 'idle' && phase !== 'paused') return;

    const previousPhase = phase;
    transitionRef.current = true;
    setPhase('playing');

    // Small delay so tonearm starts swinging before audio begins
    setTimeout(async () => {
      try {
        await play();
      } catch {
        // Browser blocked autoplay — revert to previous phase
        setPhase(previousPhase);
      }
      transitionRef.current = false;
    }, TONEARM_SWING_DELAY_MS);
  }, [phase, play]);

  // === Phase 1: Record placement animation ===
  useEffect(() => {
    if (skipPlacement) {
      if (autoPlayAfterPlacement) {
        transitionRef.current = true;
        setPhase('playing');
        setTimeout(async () => {
          try {
            await play();
          } catch {
            setPhase('idle');
          }
          transitionRef.current = false;
        }, TONEARM_SWING_DELAY_MS);
      }
      return;
    }
    const timer = setTimeout(() => {
      if (autoPlayAfterPlacement) {
        transitionRef.current = true;
        setPhase('playing');
        setTimeout(async () => {
          try {
            await play();
          } catch {
            setPhase('idle');
          }
          transitionRef.current = false;
        }, TONEARM_SWING_DELAY_MS);
        return;
      }
      setPhase('idle');
    }, PLACEMENT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [autoPlayAfterPlacement, skipPlacement, play]);

  // === Pause handler ===
  const handlePause = useCallback(() => {
    if (transitionRef.current) return;
    if (phase !== 'playing') return;

    transitionRef.current = true;
    pause();
    setPhase('paused');

    // Allow tonearm to return before clearing transition lock
    setTimeout(() => {
      transitionRef.current = false;
    }, 800);
  }, [phase, pause]);

  // === Rewind handler ===
  const handleRewind = useCallback(() => {
    seek(0);
  }, [seek]);

  // === Sync phase when audio ends naturally ===
  useEffect(() => {
    if (phase === 'playing' && !audioIsPlaying && !transitionRef.current && duration > 0 && currentTime >= duration - 0.1) {
      const timer = setTimeout(() => setPhase('idle'), 0);
      return () => clearTimeout(timer);
    }
  }, [audioIsPlaying, phase, duration, currentTime]);

  // === CSS classes for record placement animation ===
  const placementClasses =
    phase === 'placing'
      ? 'opacity-0 -translate-y-5 scale-95'
      : 'opacity-100 translate-y-0 scale-100';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Turntable container */}
      <div className="relative w-full max-w-lg">
        <div
          className={`transition-all duration-[1500ms] ease-out ${placementClasses}`}
        >
          <TurntableScene
            remixTitle={remixTitle}
            tonearmAngle={tonearmAngle}
            isSpinning={isSpinning}
            deckId="main"
            mixedRecord={mixedRecord}
          />
        </div>

        {/* Floating controls overlay */}
        {phase !== 'placing' && (
          <FloatingControls
            isPlaying={phase === 'playing'}
            onPlay={handlePlay}
            onPause={handlePause}
            onRewind={handleRewind}
          />
        )}

        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" preload="auto" />
      </div>

      {/* Time display */}
      {duration > 0 && (
        <div className="flex items-center gap-2 text-sm font-mono text-amber-200/50">
          <span>{formatTime(currentTime)}</span>
          <span className="text-amber-200/25">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-amber-400 text-center">{error}</p>
      )}
    </div>
  );
}
