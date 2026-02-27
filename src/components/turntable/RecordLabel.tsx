type Props = {
  remixTitle: string;
  cx: number;
  cy: number;
  radius: number;
};

export function RecordLabel({ remixTitle, cx, cy, radius }: Props) {
  const displayTitle =
    remixTitle.length > 28 ? remixTitle.slice(0, 25) + '...' : remixTitle;

  return (
    <g>
      {/* Label background — amber/cream */}
      <circle cx={cx} cy={cy} r={radius} fill="#d4a04a" />
      {/* Inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.85}
        fill="none"
        stroke="#c4903a"
        strokeWidth={0.6}
      />
      {/* Brand text */}
      <text
        x={cx}
        y={cy - radius * 0.18}
        textAnchor="middle"
        fill="#2a1a0a"
        fontSize={radius * 0.22}
        fontWeight="bold"
        fontFamily="Georgia, serif"
      >
        FRACTAL RECORDS
      </text>
      {/* Decorative line */}
      <line
        x1={cx - radius * 0.55}
        y1={cy + radius * 0.02}
        x2={cx + radius * 0.55}
        y2={cy + radius * 0.02}
        stroke="#2a1a0a"
        strokeWidth={0.4}
        opacity={0.5}
      />
      {/* Remix title */}
      <text
        x={cx}
        y={cy + radius * 0.3}
        textAnchor="middle"
        fill="#3a2a1a"
        fontSize={radius * 0.16}
        fontFamily="Georgia, serif"
      >
        {displayTitle}
      </text>
      {/* Center spindle hole */}
      <circle cx={cx} cy={cy} r={radius * 0.12} fill="#1a1a1a" />
    </g>
  );
}
