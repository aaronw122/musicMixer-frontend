import { useState, useCallback } from 'react';
import type { ProgressEvent } from '../types';
import { VinylMergeAnimation } from './VinylMergeAnimation';
import { registerSmsNotification } from '../api/client';

type Props = {
  progress: ProgressEvent;
  sessionId: string;
  onCancel: () => void;
};

type SmsState = 'idle' | 'dialog-open' | 'sending' | 'confirmed' | 'error';

const STEP_LABELS: Record<string, string> = {
  downloading: 'Grabbing your tunes',
  separating: 'Taking the songs apart',
  analyzing: 'Studying the vibes',
  interpreting: 'Cooking up a plan',
  processing: 'Making things fit',
  rendering: 'Mixing it all together',
  complete: 'Done!',
};

const STEP_ORDER = ['downloading', 'separating', 'analyzing', 'interpreting', 'processing', 'rendering', 'complete'];

/** Extract raw digits from formatted input. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Format up to 10 digits as (XXX) XXX-XXXX. */
function formatUsPhone(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Convert display value to E.164 for the API. */
function toE164(digits: string): string {
  return `+1${digits.slice(0, 10)}`;
}

function validatePhone(digits: string): boolean {
  return digits.length === 10;
}

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

  const valid = validatePhone(digits);
  const display = formatUsPhone(digits);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = digitsOnly(e.target.value);
    setDigits(raw.slice(0, 10));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!valid) return;
    setSending(true);
    setError('');
    try {
      await registerSmsNotification(sessionId, toE164(digits));
      onConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setSending(false);
    }
  }, [sessionId, digits, valid, onConfirmed]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl border p-6 shadow-2xl" style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}>
        <p className="text-center text-amber-50 text-base font-medium mb-5">
          We'll text you when your remix is ready
        </p>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-200/50 text-lg select-none">+1</span>
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            placeholder="(555) 123-4567"
            value={display}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid && !sending) handleSubmit();
            }}
            className="w-full rounded-lg bg-black/30 border border-amber-800/50 pl-12 pr-4 py-3 text-amber-50 text-lg placeholder-amber-200/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {error && (
          <p className="mt-2 text-xs text-amber-400 text-center">{error}</p>
        )}

        <button
          disabled={!valid || sending}
          onClick={handleSubmit}
          className="mt-4 w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 px-4 py-3 text-sm font-medium text-amber-50 transition-colors hover:from-amber-500 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>

        <p className="mt-4 text-[11px] text-amber-200/30 text-center leading-relaxed">
          By clicking Send, I consent to receive SMS notifications &amp; alerts
          from <strong className="text-amber-200/50">musicMixer</strong>.
          Message frequency varies. Msg &amp; data rates may apply.
          Reply STOP to unsubscribe at any time.{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200/50">Terms</a>
          {' & '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200/50">Privacy</a>.
        </p>
      </div>
    </div>
  );
}

export function ProgressDisplay({ progress, sessionId, onCancel }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.progress * 100)));
  const stepLabel = STEP_LABELS[progress.step] ?? progress.step;
  const [smsState, setSmsState] = useState<SmsState>('idle');

  return (
    <div className="space-y-10 text-center">
      <VinylMergeAnimation progress={progress.progress} />

      <div>
        <p className="text-lg font-medium text-amber-50">{stepLabel}</p>
        <p className="mt-3 text-sm text-amber-200/50">{progress.detail}</p>
      </div>

      <div className="space-y-2">
        {progress.step !== 'complete' && STEP_ORDER.includes(progress.step) && (
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
          className="text-sm text-amber-200/50 hover:text-white transition-colors min-h-[44px]"
          onClick={() => setSmsState('dialog-open')}
        >
          <SmsIcon />
          Text me when it's ready
        </button>
      )}

      <button
        className="text-sm text-amber-200/30 hover:text-amber-200/60 underline min-h-[44px]"
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
