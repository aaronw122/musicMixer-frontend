import { useState, useEffect } from 'react';
import { TurntableScene } from './turntable';
import { AlbumMeldCanvas } from './AlbumMeldCanvas';
import { ProgressDisplay } from './ProgressDisplay';
import type { ProgressEvent, SongInput } from '../types';

type Props = {
  songA: SongInput;
  songB: SongInput;
  progress: ProgressEvent;
  sessionId: string;
  onCancel: () => void;
  /** Upload progress percentage (0-100) during uploading phase */
  uploadProgress?: number;
  /** Whether we are in uploading/submitting (pre-processing) phase */
  isPreProcessing?: boolean;
};

/** Phase of the merge animation sequence */
type MergePhase = 'lift' | 'slide' | 'meld';

/** Proxy thumbnail URL through backend for CORS-safe WebGL access. */
function proxyThumbnailUrl(url: string): string {
  return `/api/thumbnail-proxy?url=${encodeURIComponent(url)}`;
}

/** Extract proxied thumbnail from a song input, or a placeholder path. */
function getThumbnailUrl(song: SongInput): string {
  if (song.type === 'youtube' && song.thumbnailUrl) {
    return proxyThumbnailUrl(song.thumbnailUrl);
  }
  // File uploads or missing thumbnails get a dark placeholder
  return '';
}

/**
 * MergeTransition — the visual merge animation shown during processing.
 *
 * Animation sequence:
 * 1. "lift" — Both records lift off turntables (translate-y + scale-down)
 * 2. "slide" — Records slide toward center
 * 3. "meld" — Crossfade to AlbumMeldCanvas, driven by SSE progress
 *
 * Below the merge visual, the existing ProgressDisplay shows step labels,
 * percentage bar, SMS opt-in, and cancel — restyled for the warm board theme.
 */
export function MergeTransition({
  songA,
  songB,
  progress,
  sessionId,
  onCancel,
  uploadProgress,
  isPreProcessing,
}: Props) {
  const [mergePhase, setMergePhase] = useState<MergePhase>('lift');

  // Drive animation phases with timers
  useEffect(() => {
    setMergePhase('lift');
    const slideTimer = setTimeout(() => setMergePhase('slide'), 600);
    const meldTimer = setTimeout(() => setMergePhase('meld'), 1400);
    return () => {
      clearTimeout(slideTimer);
      clearTimeout(meldTimer);
    };
  }, []);

  const thumbA = getThumbnailUrl(songA);
  const thumbB = getThumbnailUrl(songB);

  // Turntable visibility: visible during lift and slide, fading during meld
  const showTurntables = mergePhase !== 'meld';

  // Meld canvas visibility: appears during meld phase
  const showMeld = mergePhase === 'meld';

  // Animation classes for deck records
  const liftClass = mergePhase === 'lift' ? 'merge-lift' : '';
  const slideClassA =
    mergePhase === 'slide' ? 'merge-slide-left' : '';
  const slideClassB =
    mergePhase === 'slide' ? 'merge-slide-right' : '';

  // During pre-processing (uploading/submitting), show a simple waiting state
  const effectiveProgress = isPreProcessing
    ? { step: 'uploading' as const, detail: 'Uploading your songs...', progress: (uploadProgress ?? 0) / 100 }
    : progress;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual merge area */}
      <div className="relative w-full max-w-2xl mx-auto" style={{ minHeight: 200 }}>
        {/* Turntable records during lift/slide */}
        {showTurntables && (
          <div className="flex justify-center items-center gap-4">
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 transition-all duration-600 ease-out ${liftClass} ${slideClassA}`}
            >
              <TurntableScene
                remixTitle=""
                tonearmAngle={0}
                isSpinning={true}
                deckId="merge-a"
                thumbnailUrl={thumbA || undefined}
              />
            </div>
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 transition-all duration-600 ease-out ${liftClass} ${slideClassB}`}
            >
              <TurntableScene
                remixTitle=""
                tonearmAngle={0}
                isSpinning={true}
                deckId="merge-b"
                thumbnailUrl={thumbB || undefined}
              />
            </div>
          </div>
        )}

        {/* AlbumMeldCanvas during meld phase */}
        {showMeld && (
          <div
            className="flex justify-center transition-opacity duration-700 ease-in"
            style={{ opacity: showMeld ? 1 : 0 }}
          >
            <AlbumMeldCanvas
              imageA={thumbA || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect fill="%23555" width="1" height="1"/></svg>'}
              imageB={thumbB || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect fill="%23333" width="1" height="1"/></svg>'}
              progress={effectiveProgress.progress}
              size={220}
              className="rounded-full overflow-hidden shadow-2xl merge-meld-appear"
            />
          </div>
        )}
      </div>

      {/* Progress info — reuse ProgressDisplay but override the merge animation */}
      <div className="w-full max-w-md mx-auto merge-progress-area">
        <ProgressDisplayInline
          progress={effectiveProgress}
          sessionId={sessionId}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline progress display — same content as ProgressDisplay but without the
// VinylMergeAnimation (we already have our own merge visual above).
// ---------------------------------------------------------------------------

import { registerSmsNotification } from '../api/client';

type SmsState = 'idle' | 'dialog-open' | 'sending' | 'confirmed' | 'error';

const STEP_LABELS: Record<string, string> = {
  uploading: 'Uploading your songs',
  downloading: 'Grabbing your tunes',
  separating: 'Taking the songs apart',
  analyzing: 'Studying the vibes',
  interpreting: 'Cooking up a plan',
  processing: 'Making things fit',
  rendering: 'Mixing it all together',
  complete: 'Done!',
};

const STEP_ORDER = ['downloading', 'separating', 'analyzing', 'interpreting', 'processing', 'rendering', 'complete'];

function SmsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-4 h-4 mr-1.5 -mt-0.5"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SmsDialog({
  sessionId,
  onClose,
  onConfirmed,
}: {
  sessionId: string;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [digits, setDigits] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const valid = digits.replace(/\D/g, '').length === 10;
  const raw = digits.replace(/\D/g, '').slice(0, 10);

  const formatPhone = (d: string): string => {
    if (d.length === 0) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-gray-900 border border-gray-700/50 p-6 shadow-2xl">
        <p className="text-center text-white text-base font-medium mb-5">
          We'll text you when your remix is ready
        </p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">+1</span>
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            placeholder="(555) 123-4567"
            value={formatPhone(raw)}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid && !sending) {
                setSending(true);
                registerSmsNotification(sessionId, `+1${raw}`)
                  .then(() => onConfirmed())
                  .catch((err) => {
                    setError(err instanceof Error ? err.message : 'Something went wrong.');
                    setSending(false);
                  });
              }
            }}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 pl-12 pr-4 py-3 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
        <button
          disabled={!valid || sending}
          onClick={() => {
            if (!valid) return;
            setSending(true);
            registerSmsNotification(sessionId, `+1${raw}`)
              .then(() => onConfirmed())
              .catch((err) => {
                setError(err instanceof Error ? err.message : 'Something went wrong.');
                setSending(false);
              });
          }}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
        <p className="mt-4 text-[11px] text-gray-500 text-center leading-relaxed">
          By clicking Send, I consent to receive SMS notifications &amp; alerts
          from <strong className="text-gray-400">musicMixer</strong>.
          Message frequency varies. Msg &amp; data rates may apply.
          Reply STOP to unsubscribe at any time.{' '}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Terms</a>
          {' & '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Privacy</a>.
        </p>
      </div>
    </div>
  );
}

/**
 * ProgressDisplayInline — progress UI without the VinylMergeAnimation.
 * Same step labels, progress bar, SMS opt-in, and cancel as ProgressDisplay,
 * but styled to sit below our custom merge visual on the DJ board.
 */
function ProgressDisplayInline({
  progress,
  sessionId,
  onCancel,
}: {
  progress: { step: string; detail: string; progress: number };
  sessionId: string;
  onCancel: () => void;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.progress * 100)));
  const stepLabel = STEP_LABELS[progress.step] ?? progress.step;
  const [smsState, setSmsState] = useState<SmsState>('idle');

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-lg font-medium text-white">{stepLabel}</p>
        <p className="mt-2 text-sm text-amber-200/50">{progress.detail}</p>
      </div>

      <div className="space-y-2">
        {progress.step !== 'complete' &&
          progress.step !== 'uploading' &&
          STEP_ORDER.includes(progress.step) && (
            <p className="text-xs text-amber-200/40 text-left">
              Step {STEP_ORDER.indexOf(progress.step) + 1} of {STEP_ORDER.length - 1}
            </p>
          )}

        <div className="relative h-5 rounded-full bg-black/30 overflow-hidden border border-amber-900/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {pct}%
          </span>
        </div>
      </div>

      {smsState === 'confirmed' ? (
        <p className="text-sm text-amber-200/60">
          <span className="text-green-400 mr-1">&#10003;</span>
          We'll text you
        </p>
      ) : (
        <button
          className="text-sm text-amber-200/50 hover:text-white transition-colors"
          onClick={() => setSmsState('dialog-open')}
        >
          <SmsIcon />
          Text me when it's ready
        </button>
      )}

      <button
        className="text-sm text-amber-200/30 hover:text-amber-200/60 underline"
        onClick={onCancel}
      >
        Cancel
      </button>

      {(smsState === 'dialog-open' || smsState === 'sending' || smsState === 'error') && (
        <SmsDialog
          sessionId={sessionId}
          onClose={() => setSmsState('idle')}
          onConfirmed={() => setSmsState('confirmed')}
        />
      )}
    </div>
  );
}
