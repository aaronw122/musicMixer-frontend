interface RecordLabelProps {
  title?: string;
  cx: number;
  cy: number;
  radius: number;
}

export function RecordLabel({ title, cx, cy, radius }: RecordLabelProps) {
  const borderWidth = radius * 0.06;
  const spindleRadius = radius * 0.1;
  const brandFontSize = radius * 0.24;
  const titleFontSize = radius * 0.15;

  return (
    <g>
      {/* Label gradient definition */}
      <defs>
        <radialGradient id="labelGradient" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#F5E6C8" />
          <stop offset="60%" stopColor="#E8D5A8" />
          <stop offset="100%" stopColor="#D4BE8A" />
        </radialGradient>
      </defs>

      {/* Label background with warm cream/amber fill */}
      <circle cx={cx} cy={cy} r={radius} fill="url(#labelGradient)" />

      {/* Outer border ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#8B6914"
        strokeWidth={borderWidth}
        opacity={0.5}
      />

      {/* Inner decorative ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.85}
        fill="none"
        stroke="#A0522D"
        strokeWidth={borderWidth * 0.4}
        opacity={0.25}
      />

      {/* "Fractal Records" brand text — upper half */}
      <text
        x={cx}
        y={cy - radius * 0.35}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#5C3D2E"
        fontSize={brandFontSize}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        letterSpacing="0.05em"
      >
        FRACTAL
      </text>
      <text
        x={cx}
        y={cy - radius * 0.1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#7B5B3A"
        fontSize={brandFontSize * 0.65}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="normal"
        letterSpacing="0.15em"
      >
        RECORDS
      </text>

      {/* Center spindle hole */}
      <circle
        cx={cx}
        cy={cy}
        r={spindleRadius}
        fill="#1a1a1a"
        stroke="#333"
        strokeWidth={borderWidth * 0.3}
      />

      {/* Thin divider line below center */}
      <line
        x1={cx - radius * 0.5}
        y1={cy + radius * 0.2}
        x2={cx + radius * 0.5}
        y2={cy + radius * 0.2}
        stroke="#8B6914"
        strokeWidth={borderWidth * 0.3}
        opacity={0.35}
      />

      {/* Remix title text — lower half */}
      {title && (
        <text
          x={cx}
          y={cy + radius * 0.45}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#6B4226"
          fontSize={titleFontSize}
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontStyle="italic"
        >
          {/* Truncate long titles */}
          {title.length > 24 ? title.slice(0, 22) + '...' : title}
        </text>
      )}
    </g>
  );
}
