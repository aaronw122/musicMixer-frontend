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
        {/* Wood grain texture filter */}
        <filter id="woodGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.15"
            numOctaves={5}
            seed={7}
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0.3 0.15 0.05 0 0.32
                    0.2 0.12 0.03 0 0.2
                    0.1 0.05 0.02 0 0.1
                    0   0    0    1 0"
            result="woodColor"
          />
          <feBlend in="SourceGraphic" in2="woodColor" mode="multiply" result="grained" />
          <feComposite in="grained" in2="SourceGraphic" operator="in" />
        </filter>

        {/* Plinth gradient — warm walnut tones */}
        <linearGradient id="plinthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5230" />
          <stop offset="25%" stopColor="#8B6914" />
          <stop offset="50%" stopColor="#6B4226" />
          <stop offset="75%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5C3D2E" />
        </linearGradient>

        {/* Platter rim gradient */}
        <radialGradient id="platterGradient" cx="45%" cy="42%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="85%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>

        {/* Marbled vinyl — red/purple/blue paint-meld gradient */}
        <linearGradient id="marbleGradient" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="28%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="72%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Turbulence displacement for marble texture */}
        <filter id="marbleFx" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.025}
            numOctaves={3}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={30}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Clip path for the record disc */}
        <clipPath id="recordClip">
          <circle cx={PLATTER_CX} cy={PLATTER_CY} r={RECORD_R - 1} />
        </clipPath>

        {/* Platter inset shadow */}
        <filter id="platterInset" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx={0} dy={2} stdDeviation={4} floodColor="#000" floodOpacity={0.3} />
        </filter>

        {/* Groove shimmer */}
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
        fill="url(#plinthGradient)"
        filter="url(#woodGrain)"
      />
      {/* Plinth border highlight */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="16"
        fill="none"
        stroke="#9B7940"
        strokeWidth={1.5}
        opacity={0.4}
      />
      {/* Inner edge shadow */}
      <rect
        x="14"
        y="14"
        width={VB_W - 28}
        height={VB_H - 28}
        rx="13"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.8"
      />

      {/* === Platter === */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R}
        fill="url(#platterGradient)"
        filter="url(#platterInset)"
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
        {/* Record body — marbled paint-meld disc */}
        <g clipPath="url(#recordClip)">
          <circle
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={RECORD_R * 1.4}
            fill="url(#marbleGradient)"
            filter="url(#marbleFx)"
          />
        </g>

        {/* Record edge ring */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R - 1}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />

        {/* Groove rings — subtle dark lines over the marble */}
        {[0.92, 0.87, 0.82, 0.77, 0.72, 0.67, 0.62, 0.57, 0.52, 0.47, 0.42, 0.38].map((pct) => (
          <circle
            key={pct}
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={RECORD_R * pct}
            fill="none"
            stroke="rgba(0,0,0,0.15)"
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
