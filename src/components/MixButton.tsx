import { useRef, useEffect, useCallback, useState } from 'react';

type Props = {
  canMix: boolean;
  submitting: boolean;
  onClick: () => void;
};

/* ------------------------------------------------------------------ */
/*  Reusable EQ Knob                                                   */
/* ------------------------------------------------------------------ */

function Knob({
  cx,
  cy,
  r,
  label,
  id,
}: {
  cx: number;
  cy: number;
  r: number;
  label: string;
  id: string;
}) {
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#3a3b3e" />
          <stop offset="60%" stopColor="#2a2b2e" />
          <stop offset="100%" stopColor="#1a1b1e" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      {/* Indicator dot at 12 o'clock */}
      <circle cx={cx} cy={cy - r + 2} r={1.5} fill="white" opacity={0.6} />
      {/* Label */}
      <text
        x={cx}
        y={cy + r + 10}
        fontSize={6.5}
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing={1.2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
      >
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable Channel Fader                                             */
/* ------------------------------------------------------------------ */

function Fader({
  cx,
  accentColor,
  side,
}: {
  cx: number;
  accentColor: string;
  side: 'l' | 'r';
}) {
  return (
    <g>
      {/* Slot */}
      <rect x={cx - 6} y={170} width={12} height={100} rx={2} fill="#1a1b1d" />
      {/* Rail */}
      <line x1={cx} y1={175} x2={cx} y2={265} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      {/* Tick marks */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`fader-tick-${side}-${i}`}
          x1={cx + 7}
          y1={175 + i * 18}
          x2={cx + 10}
          y2={175 + i * 18}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.6}
        />
      ))}
      {/* Slider cap */}
      <rect x={cx - 9} y={215} width={18} height={10} rx={2} fill="url(#mixer-fader-cap-grad)" stroke="#5a5c61" strokeWidth={0.5} />
      {/* Accent center line */}
      <line x1={cx} y1={217} x2={cx} y2={223} stroke={accentColor} strokeWidth={1.2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  useCircleHitArea — document-level hit-testing for CSS 3D contexts  */
/* ------------------------------------------------------------------ */

function useCircleHitArea({
  containerRef,
  cx,
  cy,
  r,
  viewBoxWidth,
  viewBoxHeight,
  isReady,
  onClick,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cx: number;
  cy: number;
  r: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  isReady: boolean;
  onClick: () => void;
}): { pressed: boolean } {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const isInCircle = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const screenCx = rect.left + rect.width * (cx / viewBoxWidth);
    const screenCy = rect.top + rect.height * (cy / viewBoxHeight);
    const screenR = rect.width * (r / viewBoxWidth);
    const dx = clientX - screenCx;
    const dy = clientY - screenCy;
    return dx * dx + dy * dy <= screenR * screenR;
  }, [containerRef, cx, cy, r, viewBoxWidth, viewBoxHeight]);

  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    const handleClick = (e: MouseEvent) => {
      if (isInCircle(e.clientX, e.clientY)) onClickRef.current();
    };
    const handleMove = (e: MouseEvent) => {
      document.body.style.cursor = isInCircle(e.clientX, e.clientY) ? 'pointer' : '';
    };
    const handleDown = (e: MouseEvent) => {
      if (isInCircle(e.clientX, e.clientY)) setPressed(true);
    };
    const handleUp = () => setPressed(false);
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
    };
  }, [isReady, isInCircle]);

  return { pressed };
}

/* ------------------------------------------------------------------ */
/*  SVG Sub-components                                                 */
/* ------------------------------------------------------------------ */

function ChassisBackground() {
  return (
    <>
      <rect
        x={6}
        y={6}
        width={248}
        height={428}
        rx={10}
        fill="url(#mixer-chassis-grad)"
        stroke="#333"
        strokeWidth={0.8}
      />
      {/* Inner bevel */}
      <rect
        x={8}
        y={8}
        width={244}
        height={424}
        rx={8}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={0.8}
      />
      {/* Bevel gradient overlay */}
      <rect
        x={6}
        y={6}
        width={248}
        height={428}
        rx={10}
        fill="url(#mixer-bevel-overlay)"
      />
    </>
  );
}

function ChannelLabels() {
  return (
    <>
      {/* VOCAL label -- left */}
      <rect x={10} y={38} width={44} height={11} rx={1.5} fill="#d8443a" />
      <text
        x={32}
        y={43.5}
        fontSize={6.5}
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing={3}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
      >
        VOCAL
      </text>

      {/* INSTR label -- right */}
      <rect x={206} y={38} width={44} height={11} rx={1.5} fill="#3a78d8" />
      <text
        x={228}
        y={43.5}
        fontSize={6.5}
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing={3}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
      >
        INSTR
      </text>
    </>
  );
}

function MixButtonDome({
  cx,
  cy,
  r,
  pressed,
  submitting,
  isReady,
}: {
  cx: number;
  cy: number;
  r: number;
  pressed: boolean;
  submitting: boolean;
  isReady: boolean;
}) {
  /* Tick marks around the MIX button rim */
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    ticks.push({
      x1: cx + Math.cos(angle) * 65,
      y1: cy + Math.sin(angle) * 65,
      x2: cx + Math.cos(angle) * 68,
      y2: cy + Math.sin(angle) * 68,
    });
  }

  return (
    <g opacity={submitting ? undefined : isReady ? 1 : 0.4}>

      {/* a) Shadow beneath button */}
      <ellipse
        cx={cx}
        cy={cy + 14}
        rx={pressed ? r - 3 : r - 2}
        ry={pressed ? 20 : 22}
        fill={pressed ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)'}
        filter="url(#mixer-btn-shadow-blur)"
        style={{ transition: 'all 0.15s ease-out' }}
      />

      {/* b) Chrome rim */}
      <circle cx={cx} cy={cy} r={r + 4} fill="url(#mixer-chrome-grad)" />
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
      {/* Inner rim edge */}
      <circle cx={cx} cy={cy} r={r + 0.5} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />

      {/* Dome group -- scales down on press while chrome rim stays fixed */}
      <g style={{
        transform: pressed ? 'translate(0.5px, 0.5px)' : 'translate(0, 0)',
        transition: 'transform 0.15s ease-out',
      }}>
        {/* c) Red dome cap */}
        <circle cx={cx} cy={cy} r={r} fill="url(#mixer-cap-grad)" />

        {/* d) Dome specular highlight */}
        <circle cx={cx} cy={cy} r={r} fill="url(#mixer-dome-highlight)"
          style={{ opacity: pressed ? 0.5 : 1, transition: 'opacity 0.15s ease' }}
        />

        {/* e) Subtle edge shadow on dome */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 1}
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={2}
        />

        {/* f) "MIX" text -- white with subtle shadow */}
        <text
          x={cx}
          y={cy + 2}
          fontSize={34}
          fontFamily={`"Helvetica Neue", "Arial Black", Helvetica, Arial, sans-serif`}
          fontWeight={900}
          letterSpacing={6}
          fill="rgba(0,0,0,0.2)"
          textAnchor="middle"
          dominantBaseline="central"
        >
          MIX
        </text>
        <text
          x={cx}
          y={cy}
          fontSize={34}
          fontFamily={`"Helvetica Neue", "Arial Black", Helvetica, Arial, sans-serif`}
          fontWeight={900}
          letterSpacing={6}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
        >
          MIX
        </text>
      </g>

      {/* Submitting pulse animation */}
      {submitting && (
        <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.08)">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

function CrossfaderSection({ cx }: { cx: number }) {
  return (
    <>
      {/* Outer housing */}
      <rect x={28} y={380} width={204} height={34} rx={5} fill="#1a1b1d" />

      {/* Rail track */}
      <line x1={40} y1={397} x2={220} y2={397} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* Tick marks -- above */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`cf-tick-above-${i}`}
          x1={50 + i * 32}
          y1={385}
          x2={50 + i * 32}
          y2={390}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.6}
        />
      ))}
      {/* Tick marks -- below */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`cf-tick-below-${i}`}
          x1={50 + i * 32}
          y1={404}
          x2={50 + i * 32}
          y2={409}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.6}
        />
      ))}

      {/* Metal cap */}
      <rect
        x={cx - 11}
        y={387}
        width={22}
        height={20}
        rx={2.5}
        fill="#e3e4e7"
        stroke="#5a5c61"
        strokeWidth={0.6}
      />
      {/* Center groove on cap */}
      <line x1={cx} y1={389} x2={cx} y2={405} stroke="#5a5c61" strokeWidth={0.8} />

      {/* "A . CROSSFADE . B" label */}
      <text
        x={cx}
        y={422}
        fontSize={6}
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing={1.5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.25)"
      >
        A &middot; CROSSFADE &middot; B
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  MixButton — full SVG mixer panel                                   */
/* ------------------------------------------------------------------ */

export function MixButton({ canMix, submitting, onClick }: Props) {
  const isReady = canMix && !submitting;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mixR, setMixR] = useState(57);

  const mixCx = 130;
  const mixCy = 286;

  // Read --mix-btn-r CSS custom property (mobile override)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const val = getComputedStyle(el).getPropertyValue('--mix-btn-r').trim();
    if (val) setMixR(Number(val));
  }, []);

  // Document-level click listener — bypasses 3D transform hit-testing bugs in Chromium.
  const { pressed } = useCircleHitArea({
    containerRef,
    cx: mixCx,
    cy: mixCy,
    r: mixR,
    viewBoxWidth: 260,
    viewBoxHeight: 440,
    isReady,
    onClick,
  });

  return (
    <div ref={containerRef} className="mix-panel relative w-full h-full">
    <svg
      viewBox="0 0 260 440"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Mixer panel"
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        {/* Chassis gradient */}
        <linearGradient id="mixer-chassis-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2022" />
          <stop offset="50%" stopColor="#141416" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </linearGradient>

        {/* Bevel gradient overlay */}
        <linearGradient id="mixer-bevel-overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="30%" stopColor="transparent" />
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>

        {/* Chrome rim gradient */}
        <linearGradient id="mixer-chrome-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="15%" stopColor="#e8e8ea" />
          <stop offset="40%" stopColor="#c0c2c6" />
          <stop offset="60%" stopColor="#a8aaae" />
          <stop offset="80%" stopColor="#c8cacf" />
          <stop offset="100%" stopColor="#909296" />
        </linearGradient>

        {/* Red dome cap gradient — 3D dome shading */}
        <radialGradient
          id="mixer-cap-grad"
          cx="40%"
          cy="32%"
          r="58%"
        >
          <stop offset="0%" stopColor="#ff4a4a" />
          <stop offset="30%" stopColor="#e22828" />
          <stop offset="65%" stopColor="#b81c1c" />
          <stop offset="85%" stopColor="#8a1010" />
          <stop offset="100%" stopColor="#5a0808" />
        </radialGradient>

        {/* Dome highlight — white specular */}
        <radialGradient id="mixer-dome-highlight" cx="38%" cy="28%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Bottom shadow blur */}
        <filter id="mixer-btn-shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Crossfader cap gradient */}
        <linearGradient id="mixer-cf-cap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3e4e7" />
          <stop offset="50%" stopColor="#d0d1d4" />
          <stop offset="100%" stopColor="#c0c2c6" />
        </linearGradient>

        {/* Fader cap gradient */}
        <linearGradient id="mixer-fader-cap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3e4e7" />
          <stop offset="100%" stopColor="#c0c2c6" />
        </linearGradient>
      </defs>

      {/* 1. Mixer Chassis Background */}
      <ChassisBackground />

      {/* 2. Channel Strip Labels */}
      <ChannelLabels />

      {/* 3. EQ Knobs */}
      {/* Left channel (VOCAL) */}
      <Knob cx={32} cy={68} r={8.5} label="GAIN" id="mixer-knob-l-gain" />
      <Knob cx={32} cy={96} r={8} label="HI" id="mixer-knob-l-hi" />
      <Knob cx={32} cy={122} r={8} label="MID" id="mixer-knob-l-mid" />
      <Knob cx={32} cy={148} r={8} label="LOW" id="mixer-knob-l-low" />

      {/* Right channel (INSTR) */}
      <Knob cx={228} cy={68} r={8.5} label="GAIN" id="mixer-knob-r-gain" />
      <Knob cx={228} cy={96} r={8} label="HI" id="mixer-knob-r-hi" />
      <Knob cx={228} cy={122} r={8} label="MID" id="mixer-knob-r-mid" />
      <Knob cx={228} cy={148} r={8} label="LOW" id="mixer-knob-r-low" />

      {/* 3b. Channel Faders */}
      <Fader cx={32} accentColor="#d8443a" side="l" />
      <Fader cx={228} accentColor="#3a78d8" side="r" />

      {/* 4. HERO: MIX Button */}
      <MixButtonDome
        cx={mixCx}
        cy={mixCy}
        r={mixR}
        pressed={pressed}
        submitting={submitting}
        isReady={isReady}
      />

      {/* 5. Crossfader */}
      <CrossfaderSection cx={mixCx} />
    </svg>
    </div>
  );
}
