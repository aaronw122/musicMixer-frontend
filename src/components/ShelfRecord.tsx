import type { ShelfRecord as ShelfRecordType } from '../types';

type Props = {
  record: ShelfRecordType;
  style?: React.CSSProperties;
};

function colorFromRecordId(id: string): string {
  const palette = ['#8f2d38', '#2d728f', '#7c6a0a', '#5f4b8b', '#32746d', '#b75d24'];
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[index % palette.length];
}

/**
 * ShelfRecord — renders a single thin record spine for the cabinet bin.
 * Used for "featured" records that map to real shelf entries.
 */
export function ShelfRecord({ record, style }: Props) {
  const color = colorFromRecordId(record.id);

  return (
    <div
      className="spine-record"
      style={{
        width: '6px',
        height: '138px',
        background: `linear-gradient(180deg, ${color}cc 0%, ${color} 40%, ${color}88 100%)`,
        ...style,
      }}
      title={`${record.title} — ${record.artist}`}
    />
  );
}
