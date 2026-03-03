type Props = {
  remixTitle: string;
  cx: number;
  cy: number;
  radius: number;
};

export function RecordLabel({ remixTitle, cx, cy, radius }: Props) {
  const displayTitle =
    remixTitle.length > 28 ? remixTitle.slice(0, 25) + '...' : remixTitle;

  // Arc radius for the curved brand text
  const textR = radius * 0.68;
  const topArcId = `label-top-${cx}-${cy}`;
  const bottomArcId = `label-bottom-${cx}-${cy}`;

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

      {/* Arc paths for curved text */}
      <defs>
        {/* Upper semicircle: left to right through top */}
        <path
          id={topArcId}
          d={`M ${cx - textR} ${cy} A ${textR} ${textR} 0 0 1 ${cx + textR} ${cy}`}
          fill="none"
        />
        {/* Lower semicircle: left to right through bottom */}
        <path
          id={bottomArcId}
          d={`M ${cx - textR} ${cy} A ${textR} ${textR} 0 0 0 ${cx + textR} ${cy}`}
          fill="none"
        />
      </defs>

      {/* FRACTAL curving along the top */}
      <text
        fill="#2a1a0a"
        fontSize={radius * 0.2}
        fontWeight="bold"
        fontFamily="Georgia, serif"
        letterSpacing="0.08em"
      >
        <textPath
          href={`#${topArcId}`}
          startOffset="50%"
          textAnchor="middle"
          dy="1em"
        >
          FRACTAL
        </textPath>
      </text>

      {/* RECORDS curving along the bottom */}
      <text
        fill="#2a1a0a"
        fontSize={radius * 0.2}
        fontWeight="bold"
        fontFamily="Georgia, serif"
        letterSpacing="0.08em"
      >
        <textPath
          href={`#${bottomArcId}`}
          startOffset="50%"
          textAnchor="middle"
          dy="-0.4em"
        >
          RECORDS
        </textPath>
      </text>

      {/* Remix title centered */}
      <text
        x={cx}
        y={cy + radius * 0.08}
        textAnchor="middle"
        fill="#3a2a1a"
        fontSize={radius * 0.14}
        fontFamily="Georgia, serif"
      >
        {displayTitle}
      </text>
      {/* Center spindle hole */}
      <circle cx={cx} cy={cy} r={radius * 0.1} fill="#1a1a1a" />
    </g>
  );
}
