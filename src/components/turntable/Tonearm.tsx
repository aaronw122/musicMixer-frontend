type Props = {
  /** Pivot point X coordinate */
  pivotX: number;
  /** Pivot point Y coordinate */
  pivotY: number;
  /** Rotation angle in degrees (7 = parked, ~22 = playing) */
  angle: number;
  /** Length scaling factor for the tonearm */
  scale: number;
  /** Unique deck identifier for SVG ID namespacing */
  deckId?: string;
};

export function Tonearm({ pivotX, pivotY, angle, scale, deckId = 'default' }: Props) {
  const armLength = 95 * scale;
  const counterweightOuterR = 9;
  const counterweightInnerR = 6;

  const metalGradientId = `tonearm-metal-${deckId}`;

  // Arm endpoint
  const armEndX = pivotX;
  const armEndY = pivotY + armLength;

  // Arm tapers from pivot to headshell
  const armWidthTop = 3.5 * scale;
  const armWidthBot = 2 * scale;

  return (
    <g
      style={{
        transformOrigin: `${pivotX}px ${pivotY}px`,
        transform: `rotate(${-angle}deg)`,
        transition: 'transform 1200ms cubic-bezier(.4,.1,.3,1)',
      }}
    >
      <defs>
        <linearGradient id={metalGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8b9bc" />
          <stop offset="35%" stopColor="#e2e3e6" />
          <stop offset="65%" stopColor="#c8c9cc" />
          <stop offset="100%" stopColor="#a8a9ac" />
        </linearGradient>
        <radialGradient id={`pivot-grad-${deckId}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="50%" stopColor="#aaa" />
          <stop offset="100%" stopColor="#777" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <polygon
        points={`
          ${pivotX - armWidthTop / 2 + 2},${pivotY + 2}
          ${pivotX + armWidthTop / 2 + 2},${pivotY + 2}
          ${pivotX + armWidthBot / 2 + 2},${armEndY + 2}
          ${pivotX - armWidthBot / 2 + 2},${armEndY + 2}
        `}
        fill="rgba(0,0,0,0.2)"
      />

      {/* === Counterweight (above pivot) === */}
      <circle
        cx={pivotX}
        cy={pivotY - counterweightOuterR * 1.2}
        r={counterweightOuterR}
        fill="#3a3b3d"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="0.5"
      />
      {/* Grip ridges */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`cw-ridge-${i}`}
          x1={pivotX - counterweightOuterR + 3 + i * 2.4}
          y1={pivotY - counterweightOuterR * 1.2 - counterweightOuterR + 2}
          x2={pivotX - counterweightOuterR + 3 + i * 2.4}
          y2={pivotY - counterweightOuterR * 1.2 + counterweightOuterR - 2}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />
      ))}
      {/* Inner hub */}
      <circle
        cx={pivotX}
        cy={pivotY - counterweightInnerR * 1.4}
        r={counterweightInnerR}
        fill="#1d1e20"
      />

      {/* === Pivot mount === */}
      <circle
        cx={pivotX}
        cy={pivotY}
        r={5 * scale}
        fill={`url(#pivot-grad-${deckId})`}
        stroke="#666"
        strokeWidth={0.5}
      />

      {/* === Arm rest nub === */}
      <rect
        x={pivotX + 6}
        y={pivotY - 2.5}
        width={14}
        height={5}
        rx={2.5}
        fill="#3a3b3d"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={0.4}
      />

      {/* === Main arm — tapered tube === */}
      <polygon
        points={`
          ${pivotX - armWidthTop / 2},${pivotY}
          ${pivotX + armWidthTop / 2},${pivotY}
          ${pivotX + armWidthBot / 2},${armEndY}
          ${pivotX - armWidthBot / 2},${armEndY}
        `}
        fill={`url(#${metalGradientId})`}
      />
      {/* Highlight streak */}
      <line
        x1={pivotX - 0.3}
        y1={pivotY + 5}
        x2={pivotX - 0.3}
        y2={armEndY - 5}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.6}
      />

      {/* === Headshell (top-down view) — flat plate at end of arm === */}
      <g>
        {/* Mask to cut slots — grey not black so they're semi-transparent */}
        <mask id={`headshell-mask-${deckId}`}>
          <rect x={armEndX - 5} y={armEndY} width={10} height={18} rx={1.5} fill="white" />
          <rect x={armEndX - 2.5} y={armEndY + 3} width={5} height={2} rx={1} fill="#444" />
          <rect x={armEndX - 2.5} y={armEndY + 7} width={5} height={2} rx={1} fill="#444" />
          <rect x={armEndX - 2.5} y={armEndY + 11} width={5} height={2} rx={1} fill="#444" />
        </mask>
        {/* Shadow layer under the slots — darker tint visible through the cutouts */}
        <rect x={armEndX - 2.5} y={armEndY + 3} width={5} height={2} rx={1} fill="rgba(0,0,0,0.45)" />
        <rect x={armEndX - 2.5} y={armEndY + 7} width={5} height={2} rx={1} fill="rgba(0,0,0,0.45)" />
        <rect x={armEndX - 2.5} y={armEndY + 11} width={5} height={2} rx={1} fill="rgba(0,0,0,0.45)" />
        {/* Plate body with cutout holes */}
        <rect
          x={armEndX - 5}
          y={armEndY}
          width={10}
          height={18}
          rx={1.5}
          fill="#2a2b2d"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.4}
          mask={`url(#headshell-mask-${deckId})`}
        />
        {/* Connector ring where arm meets headshell */}
        <circle cx={armEndX} cy={armEndY + 1} r={3} fill="#555" stroke="#444" strokeWidth={0.4} />
        <circle cx={armEndX} cy={armEndY + 1} r={1.5} fill="#333" />
        {/* Finger lift tab — sticks out to the side */}
        <path
          d={`M ${armEndX + 5} ${armEndY + 1} l 6 -3 l 0 3 l -6 2 Z`}
          fill="#2a2b2d"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
      </g>
    </g>
  );
}
