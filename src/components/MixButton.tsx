import { useRef, useEffect, useCallback } from 'react';

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
/*  MixButton — full SVG mixer panel                                   */
/* ------------------------------------------------------------------ */

export function MixButton({ canMix, submitting, onClick }: Props) {
  const isReady = canMix && !submitting;
  const containerRef = useRef<HTMLDivElement>(null);

  const mixCx = 130;
  const mixCy = 286;
  const mixR = 65;

  // Document-level click listener — bypasses 3D transform hit-testing bugs in Chromium.
  // getBoundingClientRect gives projected screen coords, so we can check if the click
  // landed within the MIX circle regardless of CSS 3D transforms.
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const isInMixCircle = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * (mixCx / 260);
    const cy = rect.top + rect.height * (mixCy / 440);
    const r = rect.width * (mixR / 260);
    const dx = clientX - cx;
    const dy = clientY - cy;
    return dx * dx + dy * dy <= r * r;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const handleClick = (e: MouseEvent) => {
      if (isInMixCircle(e.clientX, e.clientY)) onClickRef.current();
    };
    const handleMove = (e: MouseEvent) => {
      document.body.style.cursor = isInMixCircle(e.clientX, e.clientY) ? 'pointer' : '';
    };
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousemove', handleMove);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousemove', handleMove);
      document.body.style.cursor = '';
    };
  }, [isReady, isInMixCircle]);

  /* Tick marks around the MIX button rim */
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    ticks.push({
      x1: mixCx + Math.cos(angle) * 65,
      y1: mixCy + Math.sin(angle) * 65,
      x2: mixCx + Math.cos(angle) * 68,
      y2: mixCy + Math.sin(angle) * 68,
    });
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
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

        {/* MIX button cap gradient */}
        <radialGradient
          id="mixer-cap-grad"
          cx="35%"
          cy="28%"
          r="60%"
        >
          <stop offset="0%" stopColor="#ffefc8" />
          <stop offset="40%" stopColor="#f5b042" />
          <stop offset="75%" stopColor="#a04a08" />
          <stop offset="100%" stopColor="#3a1a02" />
        </radialGradient>

        {/* Glass highlight gradient */}
        <radialGradient id="mixer-glass-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

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

      {/* ============================================================ */}
      {/* 1. Mixer Chassis Background                                   */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 2. Channel Strip Labels                                       */}
      {/* ============================================================ */}
      {/* VOCAL label — left */}
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

      {/* INSTR label — right */}
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

      {/* ============================================================ */}
      {/* 3. EQ Knobs                                                   */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 3b. Channel Faders                                             */}
      {/* ============================================================ */}
      {/* Left fader (VOCAL) */}
      <g>
        {/* Slot */}
        <rect x={26} y={170} width={12} height={100} rx={2} fill="#1a1b1d" />
        {/* Rail */}
        <line x1={32} y1={175} x2={32} y2={265} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Tick marks */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`fader-tick-l-${i}`}
            x1={39}
            y1={175 + i * 18}
            x2={42}
            y2={175 + i * 18}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.6}
          />
        ))}
        {/* Slider cap */}
        <rect x={23} y={215} width={18} height={10} rx={2} fill="url(#mixer-fader-cap-grad)" stroke="#5a5c61" strokeWidth={0.5} />
        {/* Red center line */}
        <line x1={32} y1={217} x2={32} y2={223} stroke="#d8443a" strokeWidth={1.2} />
      </g>

      {/* Right fader (INSTR) */}
      <g>
        {/* Slot */}
        <rect x={222} y={170} width={12} height={100} rx={2} fill="#1a1b1d" />
        {/* Rail */}
        <line x1={228} y1={175} x2={228} y2={265} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Tick marks */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`fader-tick-r-${i}`}
            x1={235}
            y1={175 + i * 18}
            x2={238}
            y2={175 + i * 18}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.6}
          />
        ))}
        {/* Slider cap */}
        <rect x={219} y={215} width={18} height={10} rx={2} fill="url(#mixer-fader-cap-grad)" stroke="#5a5c61" strokeWidth={0.5} />
        {/* Blue center line */}
        <line x1={228} y1={217} x2={228} y2={223} stroke="#3a78d8" strokeWidth={1.2} />
      </g>

      {/* ============================================================ */}
      {/* 4. HERO: MIX Button                                           */}
      {/* ============================================================ */}
      <g
        opacity={submitting ? undefined : isReady ? 1 : 0.4}
      >

        {/* a) 64 knurled tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgba(60,40,10,0.5)"
            strokeWidth={1}
          />
        ))}

        {/* b) Cap fill */}
        <circle cx={mixCx} cy={mixCy} r={mixR} fill="url(#mixer-cap-grad)" />

        {/* c) Glass highlight */}
        <ellipse
          cx={mixCx - 12}
          cy={mixCy - 16}
          rx={28}
          ry={18}
          fill="url(#mixer-glass-grad)"
          pointerEvents="none"
        />

        {/* d) Inner engraved ring */}
        <circle
          cx={mixCx}
          cy={mixCy}
          r={53}
          fill="none"
          stroke="rgba(60,30,5,0.3)"
          strokeWidth={0.8}
        />

        {/* e) "MIX" text */}
        <text
          x={mixCx}
          y={mixCy + 12}
          fontSize={34}
          fontFamily={`"Helvetica Neue", "Arial Black", Helvetica, Arial, sans-serif`}
          fontWeight={900}
          letterSpacing={4}
          fill="#3a1a02"
          stroke="rgba(255,235,180,0.5)"
          strokeWidth={0.6}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {submitting ? "..." : "MIX"}
        </text>

        {/* Submitting pulse animation */}
        {submitting && (
          <circle cx={mixCx} cy={mixCy} r={mixR} fill="none">
            <animate
              attributeName="opacity"
              values="1;0.6;1"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>

      {/* ============================================================ */}
      {/* 5. Crossfader                                                 */}
      {/* ============================================================ */}
      {/* Outer housing */}
      <rect x={28} y={380} width={204} height={34} rx={5} fill="#1a1b1d" />

      {/* Rail track */}
      <line x1={40} y1={397} x2={220} y2={397} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* Tick marks — above */}
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
      {/* Tick marks — below */}
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
        x={mixCx - 11}
        y={387}
        width={22}
        height={20}
        rx={2.5}
        fill="#e3e4e7"
        stroke="#5a5c61"
        strokeWidth={0.6}
      />
      {/* Center groove on cap */}
      <line x1={mixCx} y1={389} x2={mixCx} y2={405} stroke="#5a5c61" strokeWidth={0.8} />

      {/* "A . CROSSFADE . B" label */}
      <text
        x={mixCx}
        y={422}
        fontSize={6}
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing={1.5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.25)"
      >
        A &middot; CROSSFADE &middot; B
      </text>
    </svg>
    </div>
  );
}
