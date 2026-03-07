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

function stripPhone(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

function validatePhone(raw: string): { valid: boolean; hint: string } {
  const stripped = stripPhone(raw);
  if (!stripped) return { valid: false, hint: '' };
  if (/^\d{10}$/.test(stripped)) {
    return { valid: false, hint: 'Add +1 before your number for US numbers' };
  }
  if (/^\+\d{10,15}$/.test(stripped)) {
    return { valid: true, hint: '' };
  }
  return { valid: false, hint: '' };
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
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const { valid, hint } = validatePhone(phone);

  const handleSubmit = useCallback(async () => {
    if (!valid) return;
    setSending(true);
    setError('');
    try {
      await registerSmsNotification(sessionId, stripPhone(phone));
      onConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setSending(false);
    }
  }, [sessionId, phone, valid, onConfirmed]);

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

        <input
          type="tel"
          inputMode="tel"
          autoFocus
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid && !sending) handleSubmit();
          }}
          className="w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {hint && (
          <p className="mt-2 text-xs text-amber-400 text-center">{hint}</p>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
        )}

        <button
          disabled={!valid || sending}
          onClick={handleSubmit}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>

        <p className="mt-4 text-[11px] text-gray-500 text-center leading-relaxed">
          By entering your number, you agree to receive one text about this remix.
          Standard messaging rates apply.
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
        <p className="text-lg font-medium text-white">{stepLabel}</p>
        <p className="mt-3 text-sm text-gray-400">{progress.detail}</p>
      </div>

      <div className="space-y-2">
        {progress.step !== 'complete' && STEP_ORDER.includes(progress.step) && (
          <p className="text-xs text-gray-500 text-left">
            Step {STEP_ORDER.indexOf(progress.step) + 1} of {STEP_ORDER.length - 1}
          </p>
        )}

        <div className="relative h-5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {pct}%
          </span>
        </div>
      </div>

      {smsState === 'confirmed' ? (
        <p className="text-sm text-gray-400">
          <span className="text-green-400 mr-1">&#10003;</span>
          We'll text you
        </p>
      ) : (
        <button
          className="text-sm text-gray-400 hover:text-white transition-colors"
          onClick={() => setSmsState('dialog-open')}
        >
          <SmsIcon />
          Text me when it's ready
        </button>
      )}

      <button
        className="text-sm text-gray-500 hover:text-gray-300 underline"
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
