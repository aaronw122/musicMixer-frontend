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
const FELT_R = PLATTER_R - 10.5;

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
        {/* Plinth gradient — near-black DJ chassis */}
        <linearGradient id={id('plinthGradient')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        {/* Plinth top highlight */}
        <linearGradient id={id('plinthHighlight')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.06" />
          <stop offset="30%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.15" />
        </linearGradient>

        {/* Platter — dark rubber mat with subtle gradient */}
        <radialGradient id={id('platterGradient')} cx="45%" cy="42%">
          <stop offset="0%" stopColor="#303230" />
          <stop offset="72%" stopColor="#202220" />
          <stop offset="100%" stopColor="#181918" />
        </radialGradient>

        {/* Platter elevation shadow — lifts off the plinth */}
        <filter id={id('platterLift')} x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx={0} dy={3} stdDeviation={5} floodColor="#000" floodOpacity={0.5} />
          <feDropShadow dx={0} dy={1} stdDeviation={1.5} floodColor="#000" floodOpacity={0.35} />
        </filter>

        {/* Felt-like platter mat grain */}
        <filter id={id('feltTexture')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.4"
            numOctaves={2}
            seed={11}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.20
                    0 0 0 0 0.20
                    0 0 0 0 0.19
                    0 0 0 0.13 0"
            result="grain"
          />
          <feComposite in="grain" in2="SourceAlpha" operator="in" result="clippedGrain" />
          <feBlend in="SourceGraphic" in2="clippedGrain" mode="screen" />
        </filter>

        {/* Dark strobe rim band */}
        <linearGradient id={id('chromeRim')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#252525" />
          <stop offset="25%" stopColor="#111" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="75%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>

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

            {/* Pattern fill for circular thumbnail on vinyl */}
            {thumbnailUrl && (
              <pattern
                id={id('thumbPat')}
                patternUnits="objectBoundingBox"
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image
                  href={thumbnailUrl}
                  x="-0.25"
                  y="-0.25"
                  width="1.5"
                  height="1.5"
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            )}
          </>
        )}
      </defs>

      {/* === Plinth (metal chassis) === */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="4"
        fill={`url(#${id('plinthGradient')})`}
      />
      {/* Top highlight overlay */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="4"
        fill={`url(#${id('plinthHighlight')})`}
      />
      {/* Plinth border — subtle edge */}
      <rect
        x="10"
        y="10"
        width={VB_W - 20}
        height={VB_H - 20}
        rx="4"
        fill="none"
        stroke="#444"
        strokeWidth={0.8}
        opacity={0.6}
      />
      {/* Inner edge bevel */}
      <rect
        x="12"
        y="12"
        width={VB_W - 24}
        height={VB_H - 24}
        rx="5"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.6"
      />

      {/* === Platter === */}
      {/* Elevation shadow — lifts platter off the plinth */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R}
        fill={`url(#${id('platterGradient')})`}
        filter={`url(#${id('platterLift')})`}
        stroke="#333"
        strokeWidth="1"
      />
      {/* Chrome outer rim ring — wide Pioneer-style strobe band */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R - 7}
        fill="none"
        stroke={`url(#${id('chromeRim')})`}
        strokeWidth="14"
      />
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={PLATTER_R - 0.5}
        fill="none"
        stroke="rgba(220,220,220,0.7)"
        strokeWidth="1.35"
      />
      {/* Punched strobe-dot rows in the chrome rim */}
      {[
        { count: 72, radius: PLATTER_R - 3.2, dotRadius: 1.45, key: 'outer' },
        { count: 108, radius: PLATTER_R - 7, dotRadius: 0.95, key: 'middle' },
      ].map((row) =>
        Array.from({ length: row.count }).map((_, i) => {
          const angle = (i * 360) / row.count;
          const rad = (angle * Math.PI) / 180;
          const highlight = Math.sin(rad - Math.PI / 4) > 0.55;
          return (
            <circle
              key={`strobe-${row.key}-${i}`}
              cx={PLATTER_CX + row.radius * Math.cos(rad)}
              cy={PLATTER_CY + row.radius * Math.sin(rad)}
              r={row.dotRadius}
              fill={highlight ? 'rgba(240,240,240,0.95)' : 'rgba(200,200,200,0.9)'}
            />
          );
        }),
      )}
      {/* Felt mat surface inside the strobe ring */}
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={FELT_R}
        fill={`url(#${id('platterGradient')})`}
        filter={`url(#${id('feltTexture')})`}
      />
      <circle
        cx={PLATTER_CX}
        cy={PLATTER_CY}
        r={FELT_R}
        fill="none"
        stroke="rgba(220,220,220,0.7)"
        strokeWidth="1.35"
      />
      {/* === Vinyl Record (spinning group) — only when not empty === */}
      {!isEmpty && (
        <g>
          {effectiveIsSpinning && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${PLATTER_CX} ${PLATTER_CY}`}
              to={`360 ${PLATTER_CX} ${PLATTER_CY}`}
              dur="6s"
              repeatCount="indefinite"
            />
          )}
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

          {/* Record label — thumbnail fills entire vinyl surface */}
          {thumbnailUrl ? (
            <>
              <circle
                cx={PLATTER_CX}
                cy={PLATTER_CY}
                r={RECORD_R - 1}
                fill={`url(#${id('thumbPat')})`}
              />
              {/* Center label — red for deck A, blue for deck B */}
              <circle
                cx={PLATTER_CX}
                cy={PLATTER_CY}
                r={LABEL_R}
                fill={deckId === 'a' ? '#c41e3a' : '#1e40af'}
              />
              <circle
                cx={PLATTER_CX}
                cy={PLATTER_CY}
                r={LABEL_R * 0.85}
                fill="none"
                stroke={deckId === 'a' ? '#a31830' : '#1a3690'}
                strokeWidth={0.6}
              />
              {/* Arc path for curved song title */}
              <defs>
                <path
                  id={id('labelArc')}
                  d={`M ${PLATTER_CX - LABEL_R * 0.68} ${PLATTER_CY} A ${LABEL_R * 0.68} ${LABEL_R * 0.68} 0 0 1 ${PLATTER_CX + LABEL_R * 0.68} ${PLATTER_CY}`}
                  fill="none"
                />
              </defs>
              <text
                fill="#f5e6d0"
                fontSize={LABEL_R * 0.22}
                fontFamily="Georgia, serif"
                letterSpacing="0.05em"
              >
                <textPath
                  href={`#${id('labelArc')}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dy="1em"
                >
                  {(remixTitle.length > 15
                    ? remixTitle.slice(0, 15) + '...'
                    : remixTitle
                  ).toUpperCase()}
                </textPath>
              </text>
              {/* Center spindle hole */}
              <circle cx={PLATTER_CX} cy={PLATTER_CY} r={LABEL_R * 0.1} fill="#1a1a1a" />
            </>
          ) : (
            <RecordLabel
              remixTitle={remixTitle}
              cx={PLATTER_CX}
              cy={PLATTER_CY}
              radius={LABEL_R}
              deckId={deckId === 'default' ? undefined : deckId as 'a' | 'b'}
            />
          )}
        </g>
      )}

      {/* === Empty platter hint (guides first-time users) === */}
      {isEmpty && (
        <g opacity="0.2">
          {/* Center spindle dot on bare platter */}
          <circle cx={PLATTER_CX} cy={PLATTER_CY} r={3} fill="#555" />
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
        stroke="#555"
        strokeWidth="0.5"
      />
      {/* Cradle highlight */}
      <rect
        x={PIVOT_X - 10}
        y={PIVOT_Y + 15}
        width="20"
        height="2"
        rx="1"
        fill="rgba(255,255,255,0.08)"
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
