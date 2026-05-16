import { useState } from 'react';
import { getAudioUrl } from '../api/client';
import { RecordPlayerView } from './RecordPlayerView';

type Props = {
  sessionId: string;
  explanation: string;
  warnings: string[];
  usedFallback: boolean;
  keyWarning?: string;
  expiresAt?: string;
  onNewRemix: () => void;
  listenMode?: boolean;
  skipPlacement?: boolean;
  mixedRecord?: {
    leftThumbnailUrl?: string;
    rightThumbnailUrl?: string;
  };
};

/**
 * Compute a human-readable relative expiration string from an ISO 8601 timestamp.
 * Returns null if the timestamp is invalid or already expired.
 */
function formatExpiresIn(expiresAt: string): string | null {
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return null;

  const remainingMs = expiresMs - Date.now();
  if (remainingMs <= 0) return null;

  const remainingMinutes = Math.round(remainingMs / 60_000);

  if (remainingMinutes < 1) return 'less than a minute';
  if (remainingMinutes < 60) return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function RemixPlayer({
  sessionId,
  explanation,
  warnings,
  usedFallback,
  keyWarning,
  expiresAt,
  onNewRemix,
  listenMode = false,
  skipPlacement = false,
  mixedRecord,
}: Props) {
  const [confirmNew, setConfirmNew] = useState(false);
  const audioUrl = getAudioUrl(sessionId);

  return (
    <div className="space-y-6">
      {/* Record player */}
      <RecordPlayerView
        audioUrl={audioUrl}
        autoPlayAfterPlacement={!listenMode}
        skipPlacement={skipPlacement}
        mixedRecord={mixedRecord}
      />

      <div className="space-y-6 mx-auto" style={{ maxWidth: '540px' }}>
        {/* Key warning */}
        {keyWarning && (
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/15 px-4 py-3 flex items-start gap-2">
            <span className="text-amber-400 text-sm leading-5">ℹ</span>
            <p className="text-xs text-amber-300/90">{keyWarning}</p>
          </div>
        )}

        {/* Explanation */}
        <div
          className={`rounded-lg border p-4 ${
            usedFallback
              ? 'border-amber-700/50 bg-amber-950/20'
              : 'border-amber-800/30 bg-black/20'
          }`}
        >
          {usedFallback && (
            <p className="text-xs text-amber-400 mb-2 font-medium">
              Generated with automatic defaults
            </p>
          )}
          <p className="text-sm text-amber-100/70">{explanation}</p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3"
              >
                <p className="text-xs text-amber-300">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Expiration notice */}
        <p className="text-xs text-amber-200/30 text-center">
          {expiresAt
            ? `This remix will expire in ${formatExpiresIn(expiresAt) ?? 'approximately 3 hours'}.`
            : 'This remix will expire in approximately 3 hours.'}
        </p>

        {/* New remix button */}
        {confirmNew ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-amber-200/50">
              {listenMode
                ? 'Start creating your own remix?'
                : 'Creating a new remix will replace this one. Continue?'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 px-4 py-2 text-sm font-medium text-amber-50 hover:from-amber-500 hover:to-amber-700 transition-colors min-h-[44px]"
                onClick={onNewRemix}
              >
                {listenMode ? 'Yes, let\'s go' : 'Yes, create new'}
              </button>
              <button
                className="rounded-lg bg-amber-900/40 border border-amber-800/30 px-4 py-2 text-sm text-amber-200/60 hover:bg-amber-900/60 transition-colors min-h-[44px]"
                onClick={() => setConfirmNew(false)}
              >
                Keep listening
              </button>
            </div>
          </div>
        ) : (
          <button
            className="cta w-full"
            style={{ position: 'relative', left: 'auto', top: 'auto', transform: 'none' }}
            onClick={() => setConfirmNew(true)}
          >
            Create New Remix
          </button>
        )}
      </div>
    </div>
  );
}
