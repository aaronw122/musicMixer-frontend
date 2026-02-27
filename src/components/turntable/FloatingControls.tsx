import { useState, useEffect, useRef, useCallback } from 'react';

type Props = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
};

/**
 * Overlay controls that float above the record area.
 *
 * Desktop (hover capable):
 * - Idle/Paused: large play button centered, always visible.
 * - Playing (not hovered): controls hidden.
 * - Playing (hovered): semi-transparent overlay with pause + rewind.
 *
 * Touch devices (no hover):
 * - Idle/Paused: large play button centered, always visible.
 * - Playing: tapping the turntable area pauses and reveals controls.
 */
export function FloatingControls({ isPlaying, onPlay, onPause, onRewind }: Props) {
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect touch device on first touch interaction
  useEffect(() => {
    const handleTouchStart = () => {
      setIsTouchDevice(true);
    };

    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // On touch devices: tapping the overlay while playing triggers pause
  const handleTouchTap = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDevice) return;
      if (!isPlaying) return;

      // Prevent ghost click events
      e.preventDefault();
      onPause();
    },
    [isTouchDevice, isPlaying, onPause],
  );

  const showPlayButton = !isPlaying;
  // On touch devices, never use hover — controls are shown via tap (which pauses)
  // On desktop, use hover to show controls while playing
  const showHoverControls = isPlaying && !isTouchDevice && hovered;

  // On touch devices while playing, the entire overlay is a tap target
  const overlayInteractive = isTouchDevice && isPlaying;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center"
      onMouseEnter={!isTouchDevice ? () => setHovered(true) : undefined}
      onMouseLeave={!isTouchDevice ? () => setHovered(false) : undefined}
      onTouchEnd={handleTouchTap}
      style={{
        pointerEvents: overlayInteractive ? 'auto' : 'none',
        cursor: overlayInteractive ? 'pointer' : undefined,
      }}
    >
      {/* Play button — shown when idle/paused */}
      <div
        className="transition-opacity duration-300 ease-in-out absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          opacity: showPlayButton ? 1 : 0,
          pointerEvents: showPlayButton ? 'auto' : 'none',
        }}
      >
        <button
          onClick={onPlay}
          aria-label="Play"
          className="group flex items-center justify-center rounded-full
                     bg-black/40 backdrop-blur-sm
                     w-16 h-16 sm:w-20 sm:h-20
                     hover:bg-black/55 active:scale-95
                     transition-all duration-200 cursor-pointer"
        >
          {/* Play triangle */}
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md
                       group-hover:scale-110 transition-transform duration-200"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* Hover controls — shown when playing and hovered (desktop only) */}
      <div
        className="transition-opacity duration-250 ease-in-out absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          opacity: showHoverControls ? 1 : 0,
          pointerEvents: showHoverControls ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-4 sm:gap-6 rounded-full bg-black/40 backdrop-blur-sm px-5 py-3">
          {/* Rewind button */}
          <button
            onClick={onRewind}
            aria-label="Rewind"
            className="group flex items-center justify-center
                       w-10 h-10 sm:w-12 sm:h-12 rounded-full
                       hover:bg-white/10 active:scale-95
                       transition-all duration-200 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Skip-back icon: two left-pointing triangles */}
              <polygon points="11,19 2,12 11,5" fill="currentColor" />
              <polygon points="22,19 13,12 22,5" fill="currentColor" />
            </svg>
          </button>

          {/* Pause button */}
          <button
            onClick={onPause}
            aria-label="Pause"
            className="group flex items-center justify-center
                       w-12 h-12 sm:w-14 sm:h-14 rounded-full
                       hover:bg-white/10 active:scale-95
                       transition-all duration-200 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md"
              fill="currentColor"
            >
              {/* Pause bars */}
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
