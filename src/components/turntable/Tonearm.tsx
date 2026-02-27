type Props = {
  /** Pivot point X coordinate */
  pivotX: number;
  /** Pivot point Y coordinate */
  pivotY: number;
  /** Rotation angle in degrees (0 = parked, ~25-32 = playing) */
  angle: number;
  /** Length scaling factor for the tonearm */
  scale: number;
};

export function Tonearm({ pivotX, pivotY, angle, scale }: Props) {
  // Arm dimensions relative to scale
  const armLength = 130 * scale;
  const headLength = 18 * scale;
  const armWidth = 4 * scale;
  const counterweightR = 6 * scale;

  return (
    <g
      style={{
        transformOrigin: `${pivotX}px ${pivotY}px`,
        transform: `rotate(${angle}deg)`,
        transition: 'transform 0.8s ease-in-out',
      }}
    >
      {/* Drop shadow */}
      <line
        x1={pivotX}
        y1={pivotY}
        x2={pivotX - armLength * 0.25}
        y2={pivotY + armLength * 0.92}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={armWidth + 2}
        strokeLinecap="round"
        transform="translate(2, 2)"
      />

      {/* Counterweight (behind pivot) */}
      <circle
        cx={pivotX + counterweightR * 1.5}
        cy={pivotY - counterweightR * 0.5}
        r={counterweightR}
        fill="#888"
        stroke="#666"
        strokeWidth={0.5}
      />

      {/* Pivot mount */}
      <circle cx={pivotX} cy={pivotY} r={5 * scale} fill="#999" stroke="#777" strokeWidth={0.5} />

      {/* Main arm — brushed metal gradient */}
      <defs>
        <linearGradient id="tonearm-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b0b0b0" />
          <stop offset="40%" stopColor="#d8d8d8" />
          <stop offset="60%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
      </defs>
      <line
        x1={pivotX}
        y1={pivotY}
        x2={pivotX - armLength * 0.25}
        y2={pivotY + armLength * 0.92}
        stroke="url(#tonearm-metal)"
        strokeWidth={armWidth}
        strokeLinecap="round"
      />

      {/* Headshell — angled piece at the end */}
      <line
        x1={pivotX - armLength * 0.25}
        y1={pivotY + armLength * 0.92}
        x2={pivotX - armLength * 0.25 - headLength * 0.35}
        y2={pivotY + armLength * 0.92 + headLength}
        stroke="#c0c0c0"
        strokeWidth={armWidth * 0.7}
        strokeLinecap="round"
      />

      {/* Cartridge */}
      <rect
        x={pivotX - armLength * 0.25 - headLength * 0.35 - armWidth * 0.4}
        y={pivotY + armLength * 0.92 + headLength - 1}
        width={armWidth * 0.8}
        height={4 * scale}
        fill="#444"
        rx={1}
      />

      {/* Needle tip */}
      <circle
        cx={pivotX - armLength * 0.25 - headLength * 0.35}
        cy={pivotY + armLength * 0.92 + headLength + 4 * scale}
        r={1 * scale}
        fill="#ddd"
      />
    </g>
  );
}
