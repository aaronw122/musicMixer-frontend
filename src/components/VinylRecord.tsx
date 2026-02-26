type Props = {
  color: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

function adjustBrightness(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [r, g, b]
      .map((c) => clamp(c + amount).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function VinylRecord({ color, size = 150, className, style }: Props) {
  const half = size / 2;
  const bodyRadius = half - 1;
  const labelRadius = half * 0.35;
  const holeRadius = half * 0.08;

  const lighter = adjustBrightness(color, 35);
  const darker = adjustBrightness(color, -35);
  const edgeHighlight = adjustBrightness(color, 50);

  const grooves = [
    { r: half * 0.88, stroke: lighter, opacity: 0.3 },
    { r: half * 0.78, stroke: darker, opacity: 0.25 },
    { r: half * 0.68, stroke: lighter, opacity: 0.2 },
    { r: half * 0.58, stroke: darker, opacity: 0.25 },
    { r: half * 0.48, stroke: lighter, opacity: 0.15 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Colored disc body */}
      <circle
        cx={half}
        cy={half}
        r={bodyRadius}
        fill={color}
        stroke={edgeHighlight}
        strokeWidth={1}
      />

      {/* Groove rings — subtle lighter/darker variations */}
      {grooves.map((g) => (
        <circle
          key={g.r}
          cx={half}
          cy={half}
          r={g.r}
          fill="none"
          stroke={g.stroke}
          strokeWidth={0.8}
          opacity={g.opacity}
        />
      ))}

      {/* Dark center label */}
      <circle cx={half} cy={half} r={labelRadius} fill="#1a1a1a" />

      {/* Center hole */}
      <circle cx={half} cy={half} r={holeRadius} fill="#111" />
    </svg>
  );
}
