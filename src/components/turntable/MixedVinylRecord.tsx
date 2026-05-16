/**
 * MixedVinylRecord — shared SVG record with split album art (left/right halves).
 *
 * Used by TurntableScene (embedded in the turntable SVG) and MixProcess
 * (standalone for the seal/done animation stages). Renders as an SVG <g>
 * element so it can be embedded in any SVG context.
 */

export type MixedVinylRecordProps = {
  /** Center X in the parent SVG coordinate system */
  cx: number;
  /** Center Y in the parent SVG coordinate system */
  cy: number;
  /** Outer radius of the vinyl disc */
  radius: number;
  /** Left half thumbnail URL (song A) */
  leftThumbnailUrl?: string;
  /** Right half thumbnail URL (song B) */
  rightThumbnailUrl?: string;
  /** Prefix for SVG element IDs (must be unique per instance) */
  idPrefix: string;
};

// Groove ring positions as fraction of radius
const GROOVE_RINGS = [0.94, 0.88, 0.82, 0.76, 0.70, 0.64, 0.58, 0.52, 0.46];

export function MixedVinylRecord({
  cx,
  cy,
  radius,
  leftThumbnailUrl,
  rightThumbnailUrl,
  idPrefix,
}: MixedVinylRecordProps) {
  const id = (base: string) => `${idPrefix}-${base}`;
  const labelR = radius * 0.293; // ~34/116 matching TurntableScene proportions
  const r = radius - 1;

  // Jagged seam: zigzag from exact bottom to exact top (no gaps at poles)
  const amp = r * 0.17; // horizontal zigzag amplitude
  const steps = 12;
  const seamParts: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const y = cy + r * (1 - 2 * t);
    const xOff = (i % 2 === 0 ? -1 : 1) * amp;
    seamParts.push(`L ${cx + xOff} ${y}`);
  }
  const seamDown = `L ${cx} ${cy + r} ${seamParts.join(' ')} L ${cx} ${cy - r}`;

  // Left half: counterclockwise arc (left side) + jagged seam back up
  const leftPath = `
    M ${cx} ${cy - r}
    A ${r} ${r} 0 0 0 ${cx} ${cy + r}
    ${seamDown}
    Z
  `;

  // Right half: clockwise arc (right side) + same jagged seam back up
  const rightPath = `
    M ${cx} ${cy - r}
    A ${r} ${r} 0 0 1 ${cx} ${cy + r}
    ${seamDown}
    Z
  `;

  return (
    <g>
      <defs>
        {/* objectBoundingBox patterns — applied to circles so the bounding box
            is always a square centered on the disc. The -0.25/1.5 zoom crops
            YouTube 4:3 letterbox bars reliably at any size. */}
        {leftThumbnailUrl && (
          <pattern
            id={id('leftPat')}
            patternUnits="objectBoundingBox"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <image
              href={leftThumbnailUrl}
              x="-0.25"
              y="-0.25"
              width="1.5"
              height="1.5"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        )}
        {rightThumbnailUrl && (
          <pattern
            id={id('rightPat')}
            patternUnits="objectBoundingBox"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <image
              href={rightThumbnailUrl}
              x="-0.25"
              y="-0.25"
              width="1.5"
              height="1.5"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        )}
        <radialGradient id={id('vinylGrad')} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        <radialGradient id={id('shimmer')} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#333" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('discClip')}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <clipPath id={id('leftClip')}>
          <path d={leftPath} />
        </clipPath>
        <clipPath id={id('rightClip')}>
          <path d={rightPath} />
        </clipPath>
      </defs>

      {/* Vinyl base */}
      <g clipPath={`url(#${id('discClip')})`}>
        <circle cx={cx} cy={cy} r={r * 1.4} fill={`url(#${id('vinylGrad')})`} />

        {/* Left half: full circle filled with left image, clipped to jagged left path */}
        <g clipPath={`url(#${id('leftClip')})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={leftThumbnailUrl ? `url(#${id('leftPat')})` : '#7f1d1d'}
          />
        </g>

        {/* Right half: full circle filled with right image, clipped to jagged right path */}
        <g clipPath={`url(#${id('rightClip')})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={rightThumbnailUrl ? `url(#${id('rightPat')})` : '#1e3a8a'}
          />
        </g>
      </g>

      {/* Edge ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

      {/* Groove rings */}
      {GROOVE_RINGS.map((pct) => (
        <circle
          key={pct}
          cx={cx}
          cy={cy}
          r={r * pct}
          fill="none"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="0.4"
        />
      ))}

      {/* Groove shimmer */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id('shimmer')})`} />

      {/* Center label — red left, blue right, reusing outer zigzag seam */}
      <clipPath id={id('labelClip')}>
        <circle cx={cx} cy={cy} r={labelR} />
      </clipPath>
      <g clipPath={`url(#${id('labelClip')})`}>
        <path d={leftPath} fill="#d8443a" />
        <path d={rightPath} fill="#3a78d8" />
      </g>
      <circle cx={cx} cy={cy} r={labelR * 0.85} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />

      {/* Spindle hole */}
      <circle cx={cx} cy={cy} r={labelR * 0.1} fill="#1a1a1a" />
    </g>
  );
}
