interface TonearmProps {
  pivotX: number;
  pivotY: number;
  angle: number; // 0 = parked (arm hangs down, away from record), ~25-30 = over record
  className?: string;
}

/**
 * Bird's-eye tonearm SVG group.
 *
 * At angle=0 the arm hangs straight down from the pivot (parked / cradle position).
 * Positive angles rotate counterclockwise (swinging the needle end toward the record).
 * The entire group is rotated around the pivot point via CSS transform.
 */
export function Tonearm({ pivotX, pivotY, angle, className }: TonearmProps) {
  // All geometry is built with the arm pointing straight down from the pivot.
  // The CSS rotation handles swinging it toward the record.
  const armLength = 185;
  const armWidth = 4.5;
  const headshellLen = 18;
  const headshellW = 7;

  // Key Y positions along the arm (relative to pivot)
  const armEndY = pivotY + armLength;
  const headshellEndY = armEndY + headshellLen;

  return (
    <g
      className={className}
      style={{
        transformOrigin: `${pivotX}px ${pivotY}px`,
        transform: `rotate(${-angle}deg)`,
      }}
    >
      <defs>
        {/* Drop shadow for depth */}
        <filter id="tonearmShadow" x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx={3} dy={4} stdDeviation={4} floodColor="#000" floodOpacity={0.35} />
        </filter>

        {/* Brushed metal gradient — runs along the arm width */}
        <linearGradient id="armMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8a8a8a" />
          <stop offset="25%" stopColor="#c8c8c8" />
          <stop offset="50%" stopColor="#e0e0e0" />
          <stop offset="75%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>

        {/* Pivot base — radial brushed metal */}
        <radialGradient id="pivotMetalGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ddd" />
          <stop offset="60%" stopColor="#aaa" />
          <stop offset="100%" stopColor="#777" />
        </radialGradient>

        {/* Headshell gradient */}
        <linearGradient id="headshellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#707070" />
          <stop offset="50%" stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#606060" />
        </linearGradient>
      </defs>

      {/* === Shadow layer === */}
      <g filter="url(#tonearmShadow)">
        {/* Counterweight (small circle near pivot) */}
        <ellipse
          cx={pivotX}
          cy={pivotY + 18}
          rx={6}
          ry={5}
          fill="#666"
          stroke="#555"
          strokeWidth={0.5}
        />

        {/* Main arm shaft */}
        <rect
          x={pivotX - armWidth / 2}
          y={pivotY + 10}
          width={armWidth}
          height={armLength - 10}
          rx={armWidth / 2}
          fill="url(#armMetalGrad)"
        />

        {/* Arm taper — narrower in the lower third for realism */}
        <polygon
          points={`
            ${pivotX - armWidth / 2},${pivotY + armLength * 0.65}
            ${pivotX + armWidth / 2},${pivotY + armLength * 0.65}
            ${pivotX + armWidth * 0.35},${armEndY}
            ${pivotX - armWidth * 0.35},${armEndY}
          `}
          fill="url(#armMetalGrad)"
        />

        {/* Headshell — angled piece extending from the arm end */}
        <g transform={`rotate(-15, ${pivotX}, ${armEndY})`}>
          <rect
            x={pivotX - headshellW / 2}
            y={armEndY - 1}
            width={headshellW}
            height={headshellLen}
            rx={1.5}
            fill="url(#headshellGrad)"
          />

          {/* Cartridge body */}
          <rect
            x={pivotX - 2.5}
            y={armEndY + headshellLen * 0.35}
            width={5}
            height={8}
            rx={0.8}
            fill="#3a3a3a"
            stroke="#555"
            strokeWidth={0.3}
          />

          {/* Needle / stylus tip */}
          <line
            x1={pivotX}
            y1={armEndY + headshellLen * 0.35 + 8}
            x2={pivotX}
            y2={headshellEndY + 2}
            stroke="#bbb"
            strokeWidth={1}
            strokeLinecap="round"
          />
          {/* Needle tip dot */}
          <circle
            cx={pivotX}
            cy={headshellEndY + 2.5}
            r={0.8}
            fill="#ddd"
          />
        </g>
      </g>

      {/* === Pivot base (on top of arm) === */}
      <circle
        cx={pivotX}
        cy={pivotY}
        r={11}
        fill="url(#pivotMetalGrad)"
        stroke="#777"
        strokeWidth={0.8}
      />
      {/* Pivot screw detail */}
      <circle cx={pivotX} cy={pivotY} r={2.5} fill="#666" />
      <circle cx={pivotX} cy={pivotY} r={1} fill="#888" />

      {/* Arm rest / cradle hint (visible when parked) */}
      <rect
        x={pivotX - 5}
        y={pivotY + armLength + headshellLen + 8}
        width={10}
        height={3}
        rx={1.5}
        fill="#555"
        opacity={0.3}
      />
    </g>
  );
}
