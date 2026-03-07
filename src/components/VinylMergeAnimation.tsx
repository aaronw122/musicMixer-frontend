import { useEffect, useRef } from 'react';
import { VinylRecord } from './VinylRecord';
import { PaintMeldFilter, type PaintMeldRefs } from './PaintMeldFilter';

type Props = {
  progress: number;
};

const RECORD_SIZE = 150;
const MAX_OFFSET = 140;

const RED = '#dc2626';
const BLUE = '#2563eb';

export function VinylMergeAnimation({ progress }: Props) {
  const p = Math.max(0, Math.min(1, progress));

  // Monotonic progress — never goes backward
  const maxProgressRef = useRef(0);
  maxProgressRef.current = Math.max(maxProgressRef.current, p);
  const mp = maxProgressRef.current;

  const gooeyFilterRef = useRef<PaintMeldRefs>(null);

  // Refs for marble filter — updated imperatively so turbulence evolves
  const marbleTurbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const marbleDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

  // --- Position: records reach center at ~50% ---
  const offset = MAX_OFFSET * (1 - Math.min(1, mp / 0.5));

  // --- Layer 1 (top): Detailed vinyl records ---
  // Full until 40%, fade out by 65%
  const vinylOpacity = mp <= 0.4 ? 1 : Math.max(0, 1 - (mp - 0.4) / 0.25);

  // --- Layer 2 (middle): Gooey blob merge ---
  // Reduced role — brief transition, lower peak opacity to let marble show through
  // Fade in 40-55%, fade out 55-70%
  let gooeyOpacity: number;
  if (mp <= 0.4) gooeyOpacity = 0;
  else if (mp <= 0.55) gooeyOpacity = ((mp - 0.4) / 0.15) * 0.5; // peak at 0.5 opacity
  else if (mp <= 0.7) gooeyOpacity = 0.5 * (1 - (mp - 0.55) / 0.15);
  else gooeyOpacity = 0;

  // --- Layer 3 (bottom): Marbled disc ---
  // Starts early at 20% — visible as soon as records begin overlapping
  // Full opacity by 50%, persists as final visual
  const marbleOpacity = mp <= 0.2 ? 0 : Math.min(1, (mp - 0.2) / 0.3);

  // Groove rings: fade in 70-90% to give the disc a "finished vinyl" look
  const grooveOpacity = mp <= 0.7 ? 0 : Math.min(1, (mp - 0.7) / 0.2);

  // Completion glow
  const showGlow = mp > 0.95;

  // --- Update gooey filter params imperatively ---
  useEffect(() => {
    const refs = gooeyFilterRef.current;
    if (!refs) return;

    // Displacement: 0 → peak 22 at 50% → settle 12 at 100%
    let displacementScale: number;
    if (mp <= 0.5) displacementScale = (mp / 0.5) * 22;
    else displacementScale = 22 - ((mp - 0.5) / 0.5) * 10;

    // Blur: 0 until 40% → 12 at 70% → 7 at 100%
    let blurStdDev: number;
    if (mp <= 0.4) blurStdDev = 0;
    else if (mp <= 0.7) blurStdDev = ((mp - 0.4) / 0.3) * 12;
    else blurStdDev = 12 - ((mp - 0.7) / 0.3) * 5;

    // ColorMatrix alpha contrast
    let alphaContrast: number;
    let alphaOffset: number;
    if (mp <= 0.5) {
      alphaContrast = 19;
      alphaOffset = -9;
    } else if (mp <= 0.75) {
      const t = (mp - 0.5) / 0.25;
      alphaContrast = 19 - t * 7;
      alphaOffset = -9 + t * 3;
    } else {
      const t = (mp - 0.75) / 0.25;
      alphaContrast = 12 + t * 3;
      alphaOffset = -6 - t * 1.5;
    }

    refs.displacement?.setAttribute('scale', String(displacementScale));
    refs.blur?.setAttribute('stdDeviation', String(blurStdDev));
    refs.colorMatrix?.setAttribute(
      'values',
      `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alphaContrast} ${alphaOffset}`,
    );
  }, [mp]);

  // --- Update marble filter params imperatively ---
  // Turbulence evolves: starts rough/chaotic (high frequency, high displacement)
  // and settles to a refined marble pattern
  useEffect(() => {
    const turbulence = marbleTurbulenceRef.current;
    const displacement = marbleDisplacementRef.current;
    if (!turbulence || !displacement) return;

    // baseFrequency: 0.08 (rough) → 0.025 (mid) → 0.012 (polished)
    // Higher frequency = more chaotic, smaller features
    let baseFreq: number;
    if (mp <= 0.2) {
      baseFreq = 0.08;
    } else if (mp <= 0.7) {
      const t = (mp - 0.2) / 0.5;
      baseFreq = 0.08 - t * 0.055; // 0.08 → 0.025
    } else {
      const t = (mp - 0.7) / 0.3;
      baseFreq = 0.025 - t * 0.013; // 0.025 → 0.012 (continues refining)
    }

    // Displacement scale: 50 (chaotic) → 30 (mid) → 15 (polished)
    let marbleDisplacement: number;
    if (mp <= 0.2) {
      marbleDisplacement = 50;
    } else if (mp <= 0.7) {
      const t = (mp - 0.2) / 0.5;
      marbleDisplacement = 50 - t * 20; // 50 → 30
    } else {
      const t = (mp - 0.7) / 0.3;
      marbleDisplacement = 30 - t * 15; // 30 → 15 (continues smoothing)
    }

    turbulence.setAttribute('baseFrequency', String(baseFreq));
    displacement.setAttribute('scale', String(marbleDisplacement));
  }, [mp]);

  // --- Layout ---
  const svgWidth = RECORD_SIZE + MAX_OFFSET * 2;
  const svgHeight = RECORD_SIZE;
  const svgCenterX = svgWidth / 2;
  const svgCenterY = svgHeight / 2;
  const r = RECORD_SIZE / 2;

  const transitionStyle = 'left 0.5s ease-out, opacity 0.5s ease-out';

  return (
    <div className="merge-animation-wrapper flex justify-center">
    <div
      className="relative shrink-0"
      style={{ width: svgWidth, height: svgHeight }}
    >
      {/* Layer 2 (bottom): Gooey blob merge — brief transition behind marble */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: svgWidth,
          height: svgHeight,
          opacity: gooeyOpacity,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          overflow="visible"
          aria-hidden="true"
        >
          <PaintMeldFilter ref={gooeyFilterRef} />
          <g filter="url(#paint-meld)">
            <circle
              cx={svgCenterX - offset}
              cy={svgCenterY}
              r={r}
              fill={RED}
              opacity={0.7}
            />
            <circle
              cx={svgCenterX + offset}
              cy={svgCenterY}
              r={r}
              fill={BLUE}
              opacity={0.7}
            />
          </g>
        </svg>
      </div>

      {/* Layer 3 (middle): Marbled disc — renders ABOVE gooey blob */}
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET,
          top: 0,
          opacity: marbleOpacity,
          transition: 'opacity 0.5s ease-out',
          filter: showGlow
            ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.6))'
            : 'none',
        }}
      >
        <div className="animate-vinyl-spin">
          <svg
            width={RECORD_SIZE}
            height={RECORD_SIZE}
            viewBox={`0 0 ${RECORD_SIZE} ${RECORD_SIZE}`}
            aria-hidden="true"
          >
            <defs>
              {/* Natural blend: red → purple → blue (turbulence makes it marbled) */}
              <linearGradient
                id="marble-grad"
                x1="0"
                y1="0.5"
                x2="1"
                y2="0.5"
              >
                <stop offset="0%" stopColor={RED} />
                <stop offset="30%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="70%" stopColor="#2563eb" />
                <stop offset="100%" stopColor={BLUE} />
              </linearGradient>
              <filter
                id="marble-fx"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feTurbulence
                  ref={marbleTurbulenceRef}
                  type="fractalNoise"
                  baseFrequency={0.08}
                  numOctaves={4}
                  seed={7}
                  result="noise"
                />
                <feDisplacementMap
                  ref={marbleDisplacementRef}
                  in="SourceGraphic"
                  in2="noise"
                  scale={50}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <clipPath id="disc-clip">
                <circle cx={r} cy={r} r={r - 1} />
              </clipPath>
            </defs>
            {/* Disc body: gradient circle distorted by turbulence, clipped to round shape */}
            <g clipPath="url(#disc-clip)">
              <circle
                cx={r}
                cy={r}
                r={r * 1.4}
                fill="url(#marble-grad)"
                filter="url(#marble-fx)"
              />
            </g>
            {/* Groove rings — fade in during 70-100% for "finished vinyl" feel */}
            {grooveOpacity > 0 && (
              <g opacity={grooveOpacity}>
                {[0.42, 0.48, 0.54, 0.60, 0.66, 0.72, 0.78, 0.84, 0.90, 0.95].map((pct) => (
                  <circle
                    key={pct}
                    cx={r}
                    cy={r}
                    r={r * pct}
                    fill="none"
                    stroke="rgba(0,0,0,0.25)"
                    strokeWidth={1}
                  />
                ))}
              </g>
            )}
            {/* Shimmer highlight — subtle glossy reflection at 85%+ */}
            {mp > 0.85 && (
              <ellipse
                cx={r * 0.65}
                cy={r * 0.55}
                rx={r * 0.3}
                ry={r * 0.12}
                fill="rgba(255,255,255,0.08)"
                opacity={Math.min(1, (mp - 0.85) / 0.15)}
                transform={`rotate(-30 ${r * 0.65} ${r * 0.55})`}
              />
            )}
            {/* Dark center label */}
            <circle cx={r} cy={r} r={r * 0.35} fill="#1a1a1a" />
            {/* Center hole */}
            <circle cx={r} cy={r} r={r * 0.08} fill="#111" />
          </svg>
        </div>
      </div>

      {/* Layer 1 (top): Detailed vinyl records */}
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET - offset,
          top: 0,
          opacity: vinylOpacity,
          transition: transitionStyle,
        }}
      >
        <div className="animate-vinyl-spin">
          <VinylRecord color={RED} size={RECORD_SIZE} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: MAX_OFFSET + offset,
          top: 0,
          opacity: vinylOpacity,
          transition: transitionStyle,
        }}
      >
        <div className="animate-vinyl-spin">
          <VinylRecord color={BLUE} size={RECORD_SIZE} />
        </div>
      </div>
    </div>
    </div>
  );
}
