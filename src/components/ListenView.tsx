import type { ListenState } from '../types';
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
    <div className="text-center space-y-6">
      <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-8">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{message}</p>
      </div>
      <button
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
        onClick={onCreateRemix}
      >
        Create Your Own Remix
      </button>
    </div>
  );
}

export function ListenView({ state, onCreateRemix }: Props) {
  switch (state.substate) {
    case 'loading':
      return (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-500 border-t-blue-400" />
          <p className="mt-4 text-sm text-gray-400">Loading shared remix...</p>
        </div>
      );

    case 'processing':
      return (
        <div className="text-center py-12 space-y-4">
          <div className="inline-block h-8 w-8 animate-pulse rounded-full bg-blue-400/60" />
          <p className="text-sm text-gray-300">Your remix is still being created</p>
          <p className="text-xs text-gray-500">
            We'll load it automatically when it's ready. Check back soon if this page
            closes.
          </p>
        </div>
      );

    case 'ready':
      return (
        <RemixPlayer
          sessionId={state.sessionId}
          explanation={state.explanation}
          warnings={state.warnings}
          usedFallback={state.usedFallback}
          expiresAt={state.expiresAt}
          onNewRemix={onCreateRemix}
          listenMode={true}
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
