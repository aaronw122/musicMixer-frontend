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
  const armLength = 138 * scale;
  const armWidth = 3 * scale;
  const counterweightOuterR = 9;
  const counterweightInnerR = 6;

  const metalGradientId = `tonearm-metal-${deckId}`;

  // Arm endpoint (straight vertical arm extending downward from pivot)
  const armEndX = pivotX;
  const armEndY = pivotY + armLength;

  // Cartridge/headshell dimensions
  const shellW = 18;
  const shellH = 14;
  const innerW = 14;
  const innerH = 8;

  return (
    <g
      style={{
        transformOrigin: `${pivotX}px ${pivotY}px`,
        transform: `rotate(${angle}deg)`,
        transition: 'transform 1200ms cubic-bezier(.4,.1,.3,1)',
      }}
    >
      <defs>
        {/* Brushed metal gradient for the arm — left-to-right highlight */}
        <linearGradient id={metalGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8b9bc" />
          <stop offset="35%" stopColor="#e2e3e6" />
          <stop offset="65%" stopColor="#c8c9cc" />
          <stop offset="100%" stopColor="#a8a9ac" />
        </linearGradient>

        {/* Pivot mount gradient */}
        <radialGradient id={`pivot-grad-${deckId}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="50%" stopColor="#aaa" />
          <stop offset="100%" stopColor="#777" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <rect
        x={pivotX - armWidth / 2 + 2}
        y={pivotY + 2}
        width={armWidth}
        height={armLength}
        rx={armWidth / 2}
        fill="rgba(0,0,0,0.25)"
        filter="url(#none)"
        opacity="0.4"
      />

      {/* === Counterweight (above pivot) === */}
      {/* Outer ring */}
      <circle
        cx={pivotX}
        cy={pivotY - counterweightOuterR * 1.2}
        r={counterweightOuterR}
        fill="#3a3b3d"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="0.5"
      />
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

      {/* === Main arm — silver vertical rect === */}
      <rect
        x={pivotX - armWidth / 2}
        y={pivotY}
        width={armWidth}
        height={armLength}
        rx={armWidth / 2}
        fill={`url(#${metalGradientId})`}
      />

      {/* === Cartridge/headshell at the bottom (rotated 20deg) === */}
      <g transform={`rotate(20, ${armEndX}, ${armEndY})`}>
        {/* Outer shell */}
        <rect
          x={armEndX - shellW / 2}
          y={armEndY - 2}
          width={shellW}
          height={shellH}
          rx={2}
          fill="#e0e1e4"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.5"
        />
        {/* Inner panel */}
        <rect
          x={armEndX - innerW / 2}
          y={armEndY - 2 + (shellH - innerH) / 2}
          width={innerW}
          height={innerH}
          rx={1}
          fill="#1a1b1d"
        />
        {/* Stylus stub */}
        <rect
          x={armEndX - 0.5}
          y={armEndY - 2 + shellH}
          width={1}
          height={4}
          fill="#f0f0f0"
        />
      </g>
    </g>
  );
}
