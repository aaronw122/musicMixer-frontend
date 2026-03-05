import { useState, useRef, useCallback } from 'react';
import { getAudioUrl, buildShareUrl } from '../api/client';
import { RecordPlayerView } from './RecordPlayerView';

type Props = {
  sessionId: string;
  explanation: string;
  warnings: string[];
  usedFallback: boolean;
  onNewRemix: () => void;
  listenMode?: boolean;
};

type CopyState = 'idle' | 'copied' | 'fallback';

export function RemixPlayer({
  sessionId,
  explanation,
  warnings,
  usedFallback,
  onNewRemix,
  listenMode = false,
}: Props) {
  const [confirmNew, setConfirmNew] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const audioUrl = getAudioUrl(sessionId);
  const shareUrl = buildShareUrl(sessionId);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard API not available (e.g. non-HTTPS, iframe restrictions)
      setCopyState('fallback');
    }
  }, [shareUrl]);

  const handleFallbackSelect = useCallback(() => {
    fallbackInputRef.current?.select();
  }, []);

  return (
    <div className="space-y-6">
      {/* Record player */}
      <RecordPlayerView audioUrl={audioUrl} />

      {/* Explanation */}
      <div
        className={`rounded-lg border p-4 ${
          usedFallback
            ? 'border-amber-700/50 bg-amber-950/20'
            : 'border-gray-700 bg-gray-900/30'
        }`}
      >
        {usedFallback && (
          <p className="text-xs text-amber-400 mb-2 font-medium">
            Generated with automatic defaults
          </p>
        )}
        <p className="text-sm text-gray-300">{explanation}</p>
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

      {/* Share link (create mode only) */}
      {!listenMode && (
        <div className="space-y-2">
          {copyState === 'fallback' ? (
            <div className="flex gap-2">
              <input
                ref={fallbackInputRef}
                type="text"
                readOnly
                value={shareUrl}
                onClick={handleFallbackSelect}
                className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-300 select-all"
              />
              <button
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 shrink-0"
                onClick={() => setCopyState('idle')}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              className="w-full rounded-lg border border-blue-700/50 bg-blue-950/20 py-3 text-sm text-blue-300 hover:border-blue-600 hover:text-blue-200"
              onClick={handleCopyLink}
            >
              {copyState === 'copied' ? 'Link Copied!' : 'Copy Share Link'}
            </button>
          )}
        </div>
      )}

      {/* Expiration notice */}
      <p className="text-xs text-gray-600 text-center">
        This remix will expire in approximately 3 hours.
      </p>

      {/* New remix button */}
      {confirmNew ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">
            {listenMode
              ? 'Start creating your own remix?'
              : 'Creating a new remix will replace this one. Continue?'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
              onClick={onNewRemix}
            >
              {listenMode ? 'Yes, let\'s go' : 'Yes, create new'}
            </button>
            <button
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
              onClick={() => setConfirmNew(false)}
            >
              Keep listening
            </button>
          </div>
        </div>
      ) : (
        <button
          className="w-full rounded-lg border border-gray-700 py-3 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300"
          onClick={() => setConfirmNew(true)}
        >
          Create New Remix
        </button>
      )}
    </div>
  );
}
