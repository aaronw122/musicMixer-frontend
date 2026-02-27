import { RecordLabel } from './RecordLabel.tsx';
import { Tonearm } from './Tonearm.tsx';

interface TurntableSceneProps {
  remixTitle?: string;
  tonearmAngle?: number;
  recordRotation?: number;
  isSpinning?: boolean;
  className?: string;
}

// ViewBox dimensions — all coordinates are in this space
const VB_W = 500;
const VB_H = 420;

// Plinth (wooden base)
const PLINTH_X = 20;
const PLINTH_Y = 20;
const PLINTH_W = 460;
const PLINTH_H = 380;
const PLINTH_RX = 18;

// Platter (dark circle the record sits on)
const PLATTER_CX = 220;
const PLATTER_CY = 210;
const PLATTER_R = 155;

// Vinyl record
const RECORD_R = 145;

// Record label
const LABEL_R = RECORD_R * 0.33;

// Tonearm pivot position (top-right area of the plinth)
const TONEARM_PIVOT_X = 420;
const TONEARM_PIVOT_Y = 55;

// Groove configuration — concentric rings on the vinyl
const GROOVES = [
  { rFrac: 0.92, opacity: 0.18 },
  { rFrac: 0.87, opacity: 0.12 },
  { rFrac: 0.82, opacity: 0.2 },
  { rFrac: 0.77, opacity: 0.1 },
  { rFrac: 0.72, opacity: 0.16 },
  { rFrac: 0.67, opacity: 0.11 },
  { rFrac: 0.62, opacity: 0.18 },
  { rFrac: 0.57, opacity: 0.09 },
  { rFrac: 0.52, opacity: 0.14 },
  { rFrac: 0.47, opacity: 0.12 },
  { rFrac: 0.42, opacity: 0.16 },
  { rFrac: 0.38, opacity: 0.1 },
];

export function TurntableScene({
  remixTitle,
  tonearmAngle = 0,
  recordRotation = 0,
  isSpinning = false,
  className,
}: TurntableSceneProps) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      aria-label="Turntable"
      role="img"
    >
      <defs>
        {/* Wood grain texture filter */}
        <filter id="woodGrain" x="0%" y="0%" width="100%" height="100%">
          {/* Base noise for grain texture */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.15"
            numOctaves={5}
            seed={7}
            result="grain"
          />
          {/* Map to warm wood tones */}
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0.3 0.15 0.05 0 0.32
                    0.2 0.12 0.03 0 0.2
                    0.1 0.05 0.02 0 0.1
                    0   0    0    1 0"
            result="woodColor"
          />
          {/* Blend noise with the plinth fill for subtle grain */}
          <feBlend in="SourceGraphic" in2="woodColor" mode="multiply" result="grained" />
          {/* Slight sharpening to make grain visible */}
          <feComposite in="grained" in2="SourceGraphic" operator="in" />
        </filter>

        {/* Plinth base gradient — warm walnut tones */}
        <linearGradient id="plinthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5230" />
          <stop offset="25%" stopColor="#8B6914" />
          <stop offset="50%" stopColor="#6B4226" />
          <stop offset="75%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5C3D2E" />
        </linearGradient>

        {/* Platter rim highlight gradient */}
        <radialGradient id="platterGradient" cx="45%" cy="42%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="85%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>

        {/* Vinyl record gradient — matte black with subtle sheen */}
        <radialGradient id="vinylGradient" cx="48%" cy="46%">
          <stop offset="0%" stopColor="#1e1e1e" />
          <stop offset="70%" stopColor="#111" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>

        {/* Vinyl edge highlight */}
        <radialGradient id="vinylEdge" cx="50%" cy="50%">
          <stop offset="92%" stopColor="transparent" />
          <stop offset="96%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </radialGradient>

        {/* Platter inset shadow */}
        <filter id="platterInset" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx={0} dy={2} stdDeviation={4} floodColor="#000" floodOpacity={0.3} />
        </filter>
      </defs>

      {/* === PLINTH (wooden base) === */}
      <rect
        x={PLINTH_X}
        y={PLINTH_Y}
        width={PLINTH_W}
        height={PLINTH_H}
        rx={PLINTH_RX}
        ry={PLINTH_RX}
        fill="url(#plinthGradient)"
        filter="url(#woodGrain)"
      />
      {/* Plinth border/edge highlight */}
      <rect
        x={PLINTH_X}
        y={PLINTH_Y}
        width={PLINTH_W}
        height={PLINTH_H}
        rx={PLINTH_RX}
        ry={PLINTH_RX}
        fill="none"
        stroke="#9B7940"
        strokeWidth={1.5}
        opacity={0.4}
      />
      {/* Inner edge shadow line */}
      <rect
        x={PLINTH_X + 4}
        y={PLINTH_Y + 4}
        width={PLINTH_W - 8}
        height={PLINTH_H - 8}
        rx={PLINTH_RX - 2}
        ry={PLINTH_RX - 2}
        fill="none"
        stroke="#3a2610"
        strokeWidth={0.8}
        opacity={0.3}
      />

      {/* === PLATTER (dark circle) === */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R}
        fill="url(#platterGradient)"
        filter="url(#platterInset)"
      />
      {/* Platter rim highlight */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R}
        fill="none"
        stroke="#444"
        strokeWidth={1.5}
        opacity={0.4}
      />

      {/* === VINYL RECORD === */}
      <g
        style={{
          transformOrigin: `${PLATTER_CX}px ${PLATTER_CY}px`,
          transform: `rotate(${recordRotation}deg)`,
        }}
        className={isSpinning ? 'animate-vinyl-spin' : undefined}
      >
        {/* Record body */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R}
          fill="url(#vinylGradient)"
        />

        {/* Edge highlight ring for depth */}
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R}
          fill="url(#vinylEdge)"
        />
        <circle
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          r={RECORD_R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {/* Groove rings — concentric circles with varying opacity */}
        {GROOVES.map((groove) => (
          <circle
            key={groove.rFrac}
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={RECORD_R * groove.rFrac}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={0.5}
            opacity={groove.opacity}
          />
        ))}

        {/* Record label */}
        <RecordLabel
          title={remixTitle}
          cx={PLATTER_CX}
          cy={PLATTER_CY}
          radius={LABEL_R}
        />
      </g>

      {/* === TONEARM === */}
      <Tonearm
        pivotX={TONEARM_PIVOT_X}
        pivotY={TONEARM_PIVOT_Y}
        angle={tonearmAngle}
      />
    </svg>
  );
}
