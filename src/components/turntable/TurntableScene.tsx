import { RecordLabel } from './RecordLabel';
import { Tonearm } from './Tonearm';

type Props = {
  remixTitle: string;
  /** Tonearm rotation angle: 0 = parked, ~25 = outer groove, ~32 = inner groove */
  tonearmAngle: number;
  /** Whether the record is currently spinning */
  isSpinning: boolean;
  /** Additional CSS classes for the container */
  className?: string;
};

// SVG viewBox dimensions
const VB_W = 360;
const VB_H = 320;

// Platter center & sizes
const PLATTER_CX = 160;
const PLATTER_CY = 160;
const PLATTER_R = 130;
const RECORD_R = 120;
const LABEL_R = 35;

// Tonearm pivot position (top-right area)
const PIVOT_X = 310;
const PIVOT_Y = 45;
const ARM_SCALE = 0.8;

export function TurntableScene({
  remixTitle,
  tonearmAngle,
  isSpinning,
  className = '',
}: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`w-full h-auto ${className}`}
      aria-label="Turntable"
      role="img"
    >
      <defs>
        {/* Wood grain pattern for the plinth */}
        <pattern id="wood-grain" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#5c3d1e" />
          <line x1="0" y1="2" x2="8" y2="2.5" stroke="#6b4a28" strokeWidth="0.6" opacity="0.5" />
          <line x1="0" y1="5" x2="8" y2="4.8" stroke="#4e3218" strokeWidth="0.4" opacity="0.4" />
          <line x1="0" y1="7" x2="8" y2="7.3" stroke="#6b4a28" strokeWidth="0.3" opacity="0.3" />
        </pattern>

        {/* Subtle groove shimmer gradient */}
        <radialGradient id="groove-shimmer" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#333" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* === Plinth (wood base) === */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="16"
        fill="url(#wood-grain)"
        stroke="#3a2410"
        strokeWidth="1.5"
      />
      {/* Inner bevel highlight */}
      <rect
        x="14"
        y="14"
        width={VB_W - 28}
        height={VB_H - 28}
        rx="13"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.8"
      />

      {/* === Platter === */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R}
        fill="#1a1a1a"
        stroke="#222"
        strokeWidth="1"
      />
      {/* Platter edge ring */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R - 2}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="0.5"
      />

      {/* === Vinyl Record (spinning group) === */}
      <g
        className={isSpinning ? 'animate-vinyl-spin' : ''}
        style={{
          transformOrigin: `${PLATTER_CX}px ${PLATTER_CY}px`,
          animationPlayState: isSpinning ? 'running' : 'paused',
        }}
      >
        {/* Record body */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R}
          fill="#111"
          stroke="#222"
          strokeWidth="0.5"
        />

        {/* Record edge highlight */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R - 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.3"
        />

        {/* Groove rings */}
        {[0.92, 0.85, 0.78, 0.71, 0.64, 0.57, 0.50, 0.43].map((pct) => (
          <circle
            key={pct}
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={RECORD_R * pct}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.4"
          />
        ))}

        {/* Groove shimmer overlay */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R}
          fill="url(#groove-shimmer)"
        />

        {/* Record label */}
        <RecordLabel
          remixTitle={remixTitle}
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          radius={LABEL_R}
        />
      </g>

      {/* === Tonearm rest cradle === */}
      <rect
        x={PIVOT_X - 12}
        y={PIVOT_Y + 14}
        width="24"
        height="6"
        rx="3"
        fill="#333"
        stroke="#444"
        strokeWidth="0.5"
      />

      {/* === Tonearm === */}
      <Tonearm
        pivotX={PIVOT_X}
        pivotY={PIVOT_Y}
        angle={tonearmAngle}
        scale={ARM_SCALE}
      />

      {/* === Power indicator LED === */}
      <circle cx={VB_W - 30} cy={VB_H - 28} r="3" fill="#2a5a2a" />
      <circle cx={VB_W - 30} cy={VB_H - 28} r="2" fill="#4a4" opacity="0.8" />
    </svg>
  );
}

// Export constants for use by RecordPlayerView (positioning FloatingControls)
export { PLATTER_CX, PLATTER_CY, RECORD_R, VB_W, VB_H };
