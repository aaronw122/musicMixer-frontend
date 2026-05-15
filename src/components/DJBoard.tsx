import type { ReactNode } from 'react';

interface DJBoardProps {
  deckA?: ReactNode;
  deckB?: ReactNode;
  mixControls?: ReactNode;
  /** Content rendered inside the board surface, replacing the deck grid (for processing/ready/error phases) */
  centerContent?: ReactNode;
  children?: ReactNode;
}

/**
 * DJ Board — the main visual container. A warm wooden mixing board surface
 * that holds two turntable decks and center mix controls.
 *
 * Desktop (>=768px): CSS Grid with deckA | mixControls | deckB
 * Mobile (<768px): Flex column stack with proportionally sized decks
 *
 * When `centerContent` is provided, the deck grid is hidden and the center
 * content fills the board surface. Used for processing, playback, and error phases.
 */
export function DJBoard({ deckA, deckB, mixControls, centerContent, children }: DJBoardProps) {
  const showDecks = !centerContent && (deckA || deckB || mixControls);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Board surface */}
      <div
        className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border shadow-2xl"
        style={{
          borderColor: 'var(--board-border)',
          backgroundColor: 'var(--board-bg)',
          boxShadow:
            '0 4px 6px rgba(0,0,0,0.3), 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Wood grain texture overlay via layered backgrounds */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              // Base warm brown gradient
              'linear-gradient(135deg, #7A4E32 0%, #6B3E26 40%, #5C3420 70%, #6B3E26 100%)',
            ].join(', '),
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              // Horizontal wood grain stripes
              'repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
              // Wider grain variation
              'repeating-linear-gradient(87deg, transparent 0px, transparent 11px, rgba(0,0,0,0.025) 11px, rgba(0,0,0,0.025) 13px)',
              // Subtle vertical cross-grain
              'repeating-linear-gradient(178deg, transparent 0px, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px)',
            ].join(', '),
          }}
        />
        {/* Noise/grain SVG overlay for tactile feel */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Top edge highlight for depth */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 80%, transparent)',
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8">
          {showDecks && (
            <>
              {/* Desktop layout: grid with 3 columns */}
              <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:gap-6 md:items-start">
                <div className="min-w-0">{deckA}</div>
                <div className="flex items-center self-stretch">{mixControls}</div>
                <div className="min-w-0">{deckB}</div>
              </div>

              {/* Mobile layout: stacked flex column with proportional turntable sizing */}
              <div className="flex flex-col items-center gap-3 md:hidden">
                <div className="w-[65%] max-w-xs">{deckA}</div>
                <div className="w-[65%] max-w-xs">{deckB}</div>
                <div className="w-[75%] max-w-xs sticky bottom-3 z-20">{mixControls}</div>
              </div>
            </>
          )}

          {centerContent && (
            <div className="flex flex-col items-center">
              {centerContent}
            </div>
          )}
        </div>
      </div>

      {/* Additional content below the board */}
      {children}
    </div>
  );
}
