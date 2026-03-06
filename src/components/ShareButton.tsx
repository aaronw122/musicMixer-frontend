import { useState, useRef, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { buildShareUrl } from '../api/client';

type Props = {
  sessionId: string;
};

export function ShareButton({ sessionId }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const shareUrl = buildShareUrl(sessionId);

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('fallback');
    }
  }, [shareUrl]);

  if (state === 'fallback') {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fallbackInputRef}
          type="text"
          readOnly
          value={shareUrl}
          onClick={() => fallbackInputRef.current?.select()}
          className="w-48 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 select-all"
        />
        <button
          className="text-xs text-gray-400 hover:text-gray-200"
          onClick={() => setState('idle')}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="group relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
      aria-label="Share remix"
    >
      <Share2 size={20} />
      {state === 'copied' && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-green-400 shadow-lg">
          Link copied!
        </span>
      )}
    </button>
  );
}
