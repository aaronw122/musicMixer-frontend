type Props = {
  canMix: boolean;
  submitting: boolean;
  onClick: () => void;
};

/**
 * MixButton — the central trigger to start a remix.
 *
 * Disabled when fewer than two songs are loaded. Shows a pulsing glow
 * when ready. On mobile it renders full-width; on desktop it sits
 * vertically centered between the two decks.
 */
export function MixButton({ canMix, submitting, onClick }: Props) {
  const isReady = canMix && !submitting;

  return (
    <button
      disabled={!isReady}
      onClick={onClick}
      className={`
        relative rounded-full font-bold uppercase tracking-widest
        transition-all duration-300 select-none
        w-full min-h-[44px] md:w-20 md:h-20 lg:w-24 lg:h-24
        py-4 md:py-0
        text-lg md:text-base lg:text-lg
        ${
          isReady
            ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg hover:from-amber-400 hover:to-amber-600 hover:shadow-xl active:scale-95 cursor-pointer mix-button-pulse'
            : 'bg-amber-900/40 text-amber-200/30 border border-amber-800/30 cursor-not-allowed'
        }
      `}
      aria-label={submitting ? 'Submitting remix' : 'Mix songs'}
    >
      {/* Glow ring for ready state */}
      {isReady && (
        <span
          className="absolute inset-0 rounded-full mix-button-glow pointer-events-none"
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">
        {submitting ? 'Mixing...' : 'MIX'}
      </span>
    </button>
  );
}
