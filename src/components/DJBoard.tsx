import type { ReactNode } from 'react';

interface DJBoardProps {
  deckA?: ReactNode;
  deckB?: ReactNode;
  mixControls?: ReactNode;
  /** Content rendered inside the table surface, replacing the deck grid (for processing/error phases) */
  centerContent?: ReactNode;
  /** Record spine content for the cabinet bin */
  cabinetContent?: ReactNode;
  /** Overlay content floating above the cabinet (CTA button) — not tilted */
  cabinetOverlay?: ReactNode;
}

/**
 * DJ Board — skeuomorphic wooden DJ table with 3D perspective.
 *
 * Structure:
 *   .stage              perspective: 1400px
 *     .console          preserve-3d wrapper
 *       .table          rotateX(18deg) — wooden surface
 *         .deck-row     grid: 1fr 200px 1fr
 *       .table-edge     front lip
 *       .cabinet-area   wraps cabinet + overlay (position: relative)
 *         .cabinet      rotateX(-40deg) — record bin tilted away
 *         .cabinet-overlay  (NOT tilted) — CTA floats here
 */
export function DJBoard({
  deckA,
  deckB,
  mixControls,
  centerContent,
  cabinetContent,
  cabinetOverlay,
}: DJBoardProps) {
  const showDecks = !centerContent && (deckA || deckB || mixControls);

  return (
    <div className="stage">
      <div className="console">
        {/* Wooden table surface */}
        <div className="table">
          {showDecks && (
            <div className="deck-row">
              <div className="deck-cell">
                <div className="unit turntable-wrap">{deckA}</div>
              </div>
              <div className="deck-cell">
                <div className="unit mixer-wrap">{mixControls}</div>
              </div>
              <div className="deck-cell">
                <div className="unit turntable-wrap">{deckB}</div>
              </div>
            </div>
          )}

          {centerContent && (
            <div className="flex flex-col items-center">{centerContent}</div>
          )}

          {/* Front lip — inside .table so it shares the 3D transform */}
          <div className="table-edge" />
        </div>

        {/* Cabinet area — wraps tilted bin + untilted overlay */}
        <div className="cabinet-area">
          <div className="cabinet">
            {cabinetContent}
          </div>
          {cabinetOverlay && (
            <div className="cabinet-overlay">
              {cabinetOverlay}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
