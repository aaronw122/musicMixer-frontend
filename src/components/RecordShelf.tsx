import type { ShelfRecord } from '../types';

// Seeded PRNG for deterministic lean angles (same every render)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Color palettes for filler records
const SPINE_COLORS = [
  '#8f2d38', '#2d728f', '#7c6a0a', '#5f4b8b', '#32746d', '#b75d24',
  '#3d5a80', '#9b2335', '#6b705c', '#cb997e', '#2c6e49', '#774936',
  '#264653', '#e76f51', '#606c38', '#dda15e', '#bc6c25', '#283618',
];

// Stripe colors for label bands
const STRIPE_COLORS = [
  '#c4a35a', '#e8d5b5', '#d44', '#44d', '#fff', '#f90',
];

/** Clamp a value between 0 and 255 */
function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Parse a hex color (#rrggbb) into [r, g, b] */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert [r, g, b] back to #rrggbb */
function toHex(r: number, g: number, b: number): string {
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Lighten a hex color by a factor (0..1) */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/** Darken a hex color by a factor (0..1) */
function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(
    r * (1 - amount),
    g * (1 - amount),
    b * (1 - amount),
  );
}

/** Derive a color from a record ID using the spine palette */
function colorFromRecordId(id: string): string {
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SPINE_COLORS[index % SPINE_COLORS.length];
}

type SpineData = {
  width: number;
  height: number;
  background: string;
  lean: number;
};

/** Build background gradient for a single spine */
function spineBackground(
  color: string,
  hasStripe: boolean,
  stripeColor: string,
  stripePos: number,
): string {
  if (!hasStripe) {
    return `linear-gradient(180deg, ${lighten(color, 0.15)} 0%, ${color} 40%, ${darken(color, 0.2)} 100%)`;
  }
  return `linear-gradient(180deg, ${lighten(color, 0.15)} 0%, ${color} ${stripePos - 5}%, ${stripeColor} ${stripePos}%, ${stripeColor} ${stripePos + 3}%, ${color} ${stripePos + 8}%, ${darken(color, 0.2)} 100%)`;
}

/** Generate ~80 spines mixing featured records with filler */
function generateSpines(
  records: ShelfRecord[],
  rand: () => number,
): SpineData[] {
  const TOTAL = 160;
  const spines: SpineData[] = [];

  // Determine positions for featured records (spread them evenly)
  const featuredPositions = new Set<number>();
  if (records.length > 0) {
    const spacing = Math.floor(TOTAL / (records.length + 1));
    for (let i = 0; i < records.length; i++) {
      featuredPositions.add(spacing * (i + 1));
    }
  }

  let featuredIndex = 0;

  for (let i = 0; i < TOTAL; i++) {
    if (featuredPositions.has(i) && featuredIndex < records.length) {
      // Featured spine — slightly wider, color derived from record ID
      const record = records[featuredIndex++];
      const color = colorFromRecordId(record.id);
      const hasStripe = rand() > 0.5;
      const stripeColor = STRIPE_COLORS[Math.floor(rand() * STRIPE_COLORS.length)];
      const stripePos = 30 + Math.floor(rand() * 40); // 30–70%

      spines.push({
        width: 6 + Math.floor(rand() * 2),       // 6–7px
        height: 134 + Math.floor(rand() * 9),     // 134–142px
        background: spineBackground(color, hasStripe, stripeColor, stripePos),
        lean: (rand() * 4 - 2),                   // -2° to +2°
      });
    } else {
      // Filler spine
      const color = SPINE_COLORS[Math.floor(rand() * SPINE_COLORS.length)];
      const hasStripe = rand() > 0.6;
      const stripeColor = STRIPE_COLORS[Math.floor(rand() * STRIPE_COLORS.length)];
      const stripePos = 30 + Math.floor(rand() * 40);

      spines.push({
        width: 4 + Math.floor(rand() * 4),        // 4–7px
        height: 134 + Math.floor(rand() * 9),      // 134–142px
        background: spineBackground(color, hasStripe, stripeColor, stripePos),
        lean: (rand() * 4 - 2),
      });
    }
  }

  return spines;
}

type Props = {
  /** Optional: pass real records from useShelf to show as "featured" spines */
  records?: ShelfRecord[];
};

export function RecordShelf({ records = [] }: Props) {
  const rand = seededRandom(42);

  // Generate ~80 spines: mix of featured (from real records) and filler
  const spines = generateSpines(records, rand);

  return (
    <div className="spine-track" aria-hidden="true">
      {spines.map((spine, i) => (
        <div
          key={i}
          className="spine-record"
          style={{
            width: `${spine.width}px`,
            height: `${spine.height}px`,
            background: spine.background,
            transform: `rotate(${spine.lean}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
      ))}
    </div>
  );
}
