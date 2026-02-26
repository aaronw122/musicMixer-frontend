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
const PURPLE = '#7c3aed';

export function VinylMergeAnimation({ progress }: Props) {
  const p = Math.max(0, Math.min(1, progress));

  // Monotonic progress — never goes backward
  const maxProgressRef = useRef(0);
  maxProgressRef.current = Math.max(maxProgressRef.current, p);
  const mp = maxProgressRef.current;

  const gooeyFilterRef = useRef<PaintMeldRefs>(null);

  // --- Position: records reach center at ~50% ---
  const offset = MAX_OFFSET * (1 - Math.min(1, mp / 0.5));

  // --- Layer 1 (top): Detailed vinyl records ---
  // Full until 50%, fade out by 80%
  const vinylOpacity = mp <= 0.5 ? 1 : Math.max(0, 1 - (mp - 0.5) / 0.3);

  // --- Layer 2 (middle): Gooey blob merge ---
  // Fade in 35-55%, hold 55-65%, fade out 65-85%
  let gooeyOpacity: number;
  if (mp <= 0.35) gooeyOpacity = 0;
  else if (mp <= 0.55) gooeyOpacity = (mp - 0.35) / 0.2;
  else if (mp <= 0.65) gooeyOpacity = 1;
  else if (mp <= 0.85) gooeyOpacity = 1 - (mp - 0.65) / 0.2;
  else gooeyOpacity = 0;

  // --- Layer 3 (bottom): Marbled disc ---
  // Fade in 60-85%, persist as final visual
  const marbleOpacity = mp <= 0.6 ? 0 : Math.min(1, (mp - 0.6) / 0.25);

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

  // --- Layout ---
  const svgWidth = RECORD_SIZE + MAX_OFFSET * 2;
  const svgHeight = RECORD_SIZE;
  const svgCenterX = svgWidth / 2;
  const svgCenterY = svgHeight / 2;
  const r = RECORD_SIZE / 2;

  const transitionStyle = 'left 0.5s ease-out, opacity 0.5s ease-out';

  return (
    <div
      className="relative mx-auto"
      style={{ width: svgWidth, height: svgHeight }}
    >
      {/* Layer 3 (bottom): Marbled disc — gradient + turbulence displacement */}
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
              <linearGradient
                id="marble-grad"
                x1="0"
                y1="0.5"
                x2="1"
                y2="0.5"
              >
                <stop offset="0%" stopColor={RED} />
                <stop offset="28%" stopColor={RED} />
                <stop offset="50%" stopColor={PURPLE} />
                <stop offset="72%" stopColor={BLUE} />
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
            {/* Dark center label */}
            <circle cx={r} cy={r} r={r * 0.35} fill="#1a1a1a" />
            {/* Center hole */}
            <circle cx={r} cy={r} r={r * 0.08} fill="#111" />
          </svg>
        </div>
      </div>

      {/* Layer 2 (middle): Gooey blob merge — two semi-transparent circles */}
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
  );
}
