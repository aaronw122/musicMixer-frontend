type Props = {
  labelColor: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function VinylRecord({ labelColor, size = 100, className, style }: Props) {
  const half = size / 2;
  const bodyRadius = half - 1; // Leave 1px for stroke
  const grooveRadii = [half * 0.85, half * 0.75, half * 0.65];
  const labelRadius = half * 0.35;
  const holeRadius = half * 0.08;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Record body */}
      <circle
        cx={half}
        cy={half}
        r={bodyRadius}
        fill="#1a1a1a"
        stroke="#444"
        strokeWidth={1}
      />

      {/* Groove rings */}
      {grooveRadii.map((r) => (
        <circle
          key={r}
          cx={half}
          cy={half}
          r={r}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={0.5}
        />
      ))}

      {/* Colored center label */}
      <circle cx={half} cy={half} r={labelRadius} fill={labelColor} />

      {/* Center hole */}
      <circle cx={half} cy={half} r={holeRadius} fill="#111" />
    </svg>
  );
}
