type Props = {
  remixTitle: string;
  cx: number;
  cy: number;
  radius: number;
  deckId?: 'a' | 'b';
};

const DECK_COLORS = {
  a: { bg: '#c41e3a', ring: '#a31830', text: '#f5e6d0' },
  b: { bg: '#1e40af', ring: '#1a3690', text: '#f5e6d0' },
  default: { bg: '#d4a04a', ring: '#c4903a', text: '#2a1a0a' },
} as const;

export function RecordLabel({ remixTitle, cx, cy, radius, deckId }: Props) {
  const colors = deckId ? DECK_COLORS[deckId] : DECK_COLORS.default;
  const displayTitle =
    remixTitle.length > 28 ? remixTitle.slice(0, 25) + '...' : remixTitle;

  // Arc radius for the curved brand text
  const textR = radius * 0.68;
  const topArcId = `label-top-${cx}-${cy}`;
  const bottomArcId = `label-bottom-${cx}-${cy}`;

  return (
    <g>
      {/* Label background */}
      <circle cx={cx} cy={cy} r={radius} fill={colors.bg} />
      {/* Inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.85}
        fill="none"
        stroke={colors.ring}
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
        fill={colors.text}
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
        fill={colors.text}
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
