import { RecordLabel } from './RecordLabel';
import { Tonearm } from './Tonearm';

export type TurntableSceneProps = {
  remixTitle: string;
  /** Tonearm rotation angle: 0 = parked, ~25 = outer groove, ~32 = inner groove */
  tonearmAngle: number;
  /** Whether the record is currently spinning */
  isSpinning: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Unique deck identifier for SVG ID namespacing (avoids collisions with dual instances) */
  deckId?: string;
  /** When true, shows an empty platter with no vinyl record (deck waiting for a song) */
  isEmpty?: boolean;
  /** YouTube thumbnail URL for circular crop as record label */
  thumbnailUrl?: string;
  /** Dominant color hex for vinyl tint (e.g., "#7A3B2E") */
  vinylColor?: string;
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
  deckId = 'default',
  isEmpty = false,
  thumbnailUrl,
  vinylColor,
}: TurntableSceneProps) {
  // Helper to namespace SVG IDs per deck instance
  const id = (base: string) => `${base}-${deckId}`;

  // When empty, force tonearm parked and no spinning
  const effectiveTonearmAngle = isEmpty ? 0 : tonearmAngle;
  const effectiveIsSpinning = isEmpty ? false : isSpinning;

  // Determine vinyl fill color: use vinylColor if provided, else default dark
  const vinylFillColor = vinylColor ?? '#1a1a2e';

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`w-full h-auto ${className}`}
      aria-label="Turntable"
      role="img"
    >
      <defs>
        {/* Wood grain texture filter */}
        <filter id={id('woodGrain')} x="0%" y="0%" width="100%" height="100%">
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
        <linearGradient id={id('plinthGradient')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5230" />
          <stop offset="25%" stopColor="#8B6914" />
          <stop offset="50%" stopColor="#6B4226" />
          <stop offset="75%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5C3D2E" />
        </linearGradient>

        {/* Platter rim gradient */}
        <radialGradient id={id('platterGradient')} cx="45%" cy="42%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="85%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>

        {/* Platter inset shadow */}
        <filter id={id('platterInset')} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx={0} dy={2} stdDeviation={4} floodColor="#000" floodOpacity={0.3} />
        </filter>

        {!isEmpty && (
          <>
            {/* Marbled vinyl — colored gradient based on vinylColor or default marble */}
            {thumbnailUrl ? (
              <radialGradient id={id('vinylGradient')} cx="50%" cy="50%">
                <stop offset="0%" stopColor={vinylFillColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#111" />
              </radialGradient>
            ) : (
              <linearGradient id={id('marbleGradient')} x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="28%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="72%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            )}

            {/* Turbulence displacement for marble/vinyl texture */}
            <filter id={id('marbleFx')} x="-30%" y="-30%" width="160%" height="160%">
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
            <clipPath id={id('recordClip')}>
              <circle cx={PLATTER_CX} cy={PLATTER_CY} r={RECORD_R - 1} />
            </clipPath>

            {/* Groove shimmer */}
            <radialGradient id={id('groove-shimmer')} cx="40%" cy="35%">
              <stop offset="0%" stopColor="#333" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Clip path for circular thumbnail crop in label area */}
            {thumbnailUrl && (
              <clipPath id={id('thumbnailClip')}>
                <circle cx={PLATTER_CX} cy={PLATTER_CY} r={LABEL_R} />
              </clipPath>
            )}
          </>
        )}
      </defs>

      {/* === Plinth (wood base) === */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="16"
        fill={`url(#${id('plinthGradient')})`}
        filter={`url(#${id('woodGrain')})`}
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
        fill={`url(#${id('platterGradient')})`}
        filter={`url(#${id('platterInset')})`}
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

      {/* === Vinyl Record (spinning group) — only when not empty === */}
      {!isEmpty && (
        <g
          className={effectiveIsSpinning ? 'animate-vinyl-spin' : ''}
          style={{
            transformOrigin: `${PLATTER_CX}px ${PLATTER_CY}px`,
            animationPlayState: effectiveIsSpinning ? 'running' : 'paused',
          }}
        >
          {/* Record body */}
          <g clipPath={`url(#${id('recordClip')})`}>
            <circle
              cx={PLATTER_CX}
              cy={PLATTER_CY}
              r={RECORD_R * 1.4}
              fill={`url(#${id(thumbnailUrl ? 'vinylGradient' : 'marbleGradient')})`}
              filter={`url(#${id('marbleFx')})`}
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

          {/* Groove rings — subtle dark lines over the vinyl */}
          {[0.92, 0.87, 0.82, 0.77, 0.72, 0.67, 0.62, 0.57, 0.52, 0.47, 0.42, 0.38].map(
            (pct) => (
              <circle
                key={pct}
                cx={PLATTER_CX}
                cy={PLATTER_CY}
                r={RECORD_R * pct}
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="0.4"
              />
            ),
          )}

          {/* Groove shimmer overlay */}
          <circle
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={RECORD_R}
            fill={`url(#${id('groove-shimmer')})`}
          />

          {/* Record label — thumbnail or text */}
          {thumbnailUrl ? (
            <g clipPath={`url(#${id('thumbnailClip')})`}>
              <image
                href={thumbnailUrl}
                x={PLATTER_CX - LABEL_R}
                y={PLATTER_CY - LABEL_R}
                width={LABEL_R * 2}
                height={LABEL_R * 2}
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Center spindle hole over thumbnail */}
              <circle cx={PLATTER_CX} cy={PLATTER_CY} r={LABEL_R * 0.1} fill="#1a1a1a" />
            </g>
          ) : (
            <RecordLabel
              remixTitle={remixTitle}
              cx={PLATTER_CX}
              cy={PLATTER_CY}
              radius={LABEL_R}
            />
          )}
        </g>
      )}

      {/* === Empty platter hint (guides first-time users) === */}
      {isEmpty && (
        <g opacity="0.2">
          {/* Center spindle dot on bare platter */}
          <circle cx={PLATTER_CX} cy={PLATTER_CY} r={3} fill="#555" />
          {/* Platter mat rings */}
          <circle
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={PLATTER_R * 0.7}
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
          />
          <circle
            cx={PLATTER_CX}
            cy={PLATTER_CY}
            r={PLATTER_R * 0.4}
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
          />
          {/* Music note icon hint */}
          <text
            x={PLATTER_CX}
            y={PLATTER_CY - 8}
            textAnchor="middle"
            fill="#aaa"
            fontSize="28"
            fontFamily="serif"
            aria-hidden="true"
          >
            &#9835;
          </text>
          {/* "Drop a track" hint text */}
          <text
            x={PLATTER_CX}
            y={PLATTER_CY + 20}
            textAnchor="middle"
            fill="#999"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
          >
            Drop a track
          </text>
        </g>
      )}

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
        angle={effectiveTonearmAngle}
        scale={ARM_SCALE}
        deckId={deckId}
      />

      {/* === Power indicator LED === */}
      <circle cx={VB_W - 30} cy={VB_H - 28} r="3" fill="#2a5a2a" />
      <circle cx={VB_W - 30} cy={VB_H - 28} r="2" fill="#4a4" opacity="0.8" />
    </svg>
  );
}

// Export constants for use by RecordPlayerView (positioning FloatingControls)
export { PLATTER_CX, PLATTER_CY, RECORD_R, VB_W, VB_H };
