import type { ListenState } from '../types';
import { DJBoard } from './DJBoard';
import { RemixPlayer } from './RemixPlayer';

type Props = {
  state: ListenState;
  onCreateRemix: () => void;
};

function ListenError({
  title,
  message,
  onCreateRemix,
}: {
  title: string;
  message: string;
  onCreateRemix: () => void;
}) {
  return (
    <DJBoard
      centerContent={
        <div className="text-center space-y-6 py-4">
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/25 p-8">
            <h2 className="text-lg font-semibold text-amber-50 mb-2">{title}</h2>
            <p className="text-sm text-amber-200/60">{message}</p>
          </div>
          <button
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 px-6 py-3 text-sm font-medium text-amber-50 hover:from-amber-500 hover:to-amber-700 transition-colors min-h-[44px]"
            onClick={onCreateRemix}
          >
            Create Your Own Remix
          </button>
        </div>
      }
    />
  );
}

export function ListenView({ state, onCreateRemix }: Props) {
  switch (state.substate) {
    case 'loading':
      return (
        <DJBoard
          centerContent={
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-800/60 border-t-amber-400" />
              <p className="mt-4 text-sm text-amber-200/50">Loading shared remix...</p>
            </div>
          }
        />
      );

    case 'processing':
      return (
        <DJBoard
          centerContent={
            <div className="text-center py-12 space-y-4">
              <div className="inline-block h-8 w-8 animate-pulse rounded-full bg-amber-400/40" />
              <p className="text-sm text-amber-100/80">Your remix is still being created</p>
              <p className="text-xs text-amber-200/40">
                We'll load it automatically when it's ready. Check back soon if this page
                closes.
              </p>
            </div>
          }
        />
      );

    case 'ready':
      return (
        <DJBoard
          centerContent={
            <div className="w-full max-w-2xl mx-auto py-4">
              <RemixPlayer
                sessionId={state.sessionId}
                explanation={state.explanation}
                warnings={state.warnings}
                usedFallback={state.usedFallback}
                expiresAt={state.expiresAt}
                onNewRemix={onCreateRemix}
                listenMode={true}
              />
            </div>
          }
        />
      );

    case 'invalid':
      return (
        <ListenError
          title="Invalid Link"
          message="This share link doesn't look right. It may have been copied incorrectly."
          onCreateRemix={onCreateRemix}
        />
      );

    case 'unavailable':
      return (
        <ListenError
          title="Remix Not Available"
          message="This remix could not be found. It may have already expired or been removed."
          onCreateRemix={onCreateRemix}
        />
      );

    case 'expired':
      return (
        <ListenError
          title="Remix Expired"
          message="This remix has expired. Remixes are only available for about 3 hours after creation."
          onCreateRemix={onCreateRemix}
        />
      );
  }
}
