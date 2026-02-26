import { useRef } from 'react';
import { VinylRecord } from './VinylRecord';

type Props = {
  progress: number;
};

const RECORD_SIZE = 100;
const MAX_OFFSET = 70; // px from center to starting position

export function VinylMergeAnimation({ progress }: Props) {
  const p = Math.max(0, Math.min(1, progress));

  const maxProgressRef = useRef(0);
  maxProgressRef.current = Math.max(maxProgressRef.current, p);

  const mp = maxProgressRef.current;

  // Offset: records reach center at ~65% progress
  const offset = MAX_OFFSET * (1 - Math.min(1, mp / 0.65));

  // Red/blue opacity: full until 60%, fade to 0 by 95%
  const recordOpacity =
    mp <= 0.6 ? 1 : Math.max(0, 1 - (mp - 0.6) / 0.35);

  // Merged purple opacity: 0 until 40%, fade to 1 by 95%
  const mergedOpacity =
    mp <= 0.4 ? 0 : Math.min(1, (mp - 0.4) / 0.55);

  // Completion glow
  const showGlow = mp > 0.95;

  const transitionStyle = 'left 0.5s ease-out, opacity 0.5s ease-out';

  return (
    <div
      className="relative mx-auto"
      style={{
        width: RECORD_SIZE + MAX_OFFSET * 2,
        height: RECORD_SIZE,
      }}
    >
      {/* Merged purple record (behind) */}
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET,
          top: 0,
          opacity: mergedOpacity,
          transition: transitionStyle,
          filter: showGlow
            ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))'
            : 'none',
        }}
      >
        <div className="animate-vinyl-spin">
          <VinylRecord labelColor="#a855f7" size={RECORD_SIZE} />
        </div>
      </div>

      {/* Red record (Song A, left) */}
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET - offset,
          top: 0,
          opacity: recordOpacity,
          transition: transitionStyle,
        }}
      >
        <div className="animate-vinyl-spin">
          <VinylRecord labelColor="#ef4444" size={RECORD_SIZE} />
        </div>
      </div>

      {/* Blue record (Song B, right) */}
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET + offset,
          top: 0,
          opacity: recordOpacity,
          transition: transitionStyle,
        }}
      >
        <div className="animate-vinyl-spin">
          <VinylRecord labelColor="#3b82f6" size={RECORD_SIZE} />
        </div>
      </div>
    </div>
  );
}
