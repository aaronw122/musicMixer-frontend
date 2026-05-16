import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Phone } from 'lucide-react';
import { registerSmsNotification } from '../api/client';
import type { ProgressEvent, SongInput } from '../types';
import './MixProcess.css';

type MixStage = '' | 'is-floating' | 'is-breaking' | 'is-mixing' | 'is-sealed' | 'is-done';
type SmsState = 'idle' | 'dialog-open' | 'confirmed';

type Props = {
  songA: SongInput;
  songB: SongInput;
  progress: ProgressEvent;
  sessionId: string;
  onCancel: () => void;
};

const STEP_LABELS: Record<string, string> = {
  downloading: 'Grabbing your tunes',
  separating: 'Separating vocals',
  analyzing: 'Reading the groove',
  interpreting: 'Planning the blend',
  processing: 'Mixing the records',
  rendering: 'Pressing the master',
  complete: 'Done',
};

function thumbnailFor(song: SongInput): string | undefined {
  return song.type === 'youtube' ? song.thumbnailUrl : undefined;
}

function backgroundStyle(url: string | undefined, fallback: string) {
  if (!url) {
    return {
      backgroundImage: fallback,
    };
  }

  return {
    backgroundImage: `url("${url}")`,
  };
}

function useMixStage(progress: ProgressEvent): MixStage {
  const [introComplete, setIntroComplete] = useState(false);
  const [stage, setStage] = useState<MixStage>('is-floating');

  useEffect(() => {
    const breakTimer = window.setTimeout(() => setStage('is-breaking'), 1100);
    const mixTimer = window.setTimeout(() => {
      setIntroComplete(true);
      setStage('is-mixing');
    }, 1900);

    return () => {
      window.clearTimeout(breakTimer);
      window.clearTimeout(mixTimer);
    };
  }, []);

  useEffect(() => {
    if (!introComplete) return;

    if (progress.progress >= 1 || progress.step === 'complete') {
      const sealTimer = window.setTimeout(() => setStage('is-sealed'), 0);
      const doneTimer = window.setTimeout(() => setStage('is-done'), 300);
      return () => {
        window.clearTimeout(sealTimer);
        window.clearTimeout(doneTimer);
      };
    }

    if (progress.progress >= 0.88 || progress.step === 'rendering') {
      const sealTimer = window.setTimeout(() => setStage('is-sealed'), 0);
      return () => window.clearTimeout(sealTimer);
    }

    const mixTimer = window.setTimeout(() => setStage('is-mixing'), 0);
    return () => window.clearTimeout(mixTimer);
  }, [introComplete, progress.progress, progress.step]);

  return stage;
}

function Dust() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}vw`,
        top: `${60 + ((index * 19) % 40)}vh`,
        animationDelay: `${-((index * 0.37) % 6)}s`,
        animationDuration: `${5 + ((index * 0.43) % 4)}s`,
        opacity: 0.4 + ((index * 0.07) % 0.6),
        scale: 0.5 + ((index * 0.11) % 1.2),
      })),
    [],
  );

  return (
    <div className="mix-dust" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
            opacity: particle.opacity,
            '--mix-dust-scale': particle.scale,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function SourceDeck({ thumbnailUrl }: { thumbnailUrl: string | undefined }) {
  return (
    <div className="mix-deck">
      <div
        className="mix-vinyl-source"
        style={backgroundStyle(
          thumbnailUrl,
          'radial-gradient(circle at 40% 35%, #56544d, #171713 70%)',
        )}
      />
    </div>
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
  const raw = digits.replace(/\D/g, '').slice(0, 10);
  const valid = raw.length === 10;

  const formatted =
    raw.length <= 3
      ? raw
      : raw.length <= 6
        ? `(${raw.slice(0, 3)}) ${raw.slice(3)}`
        : `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;

  const submit = () => {
    if (!valid || sending) return;
    setSending(true);
    registerSmsNotification(sessionId, `+1${raw}`)
      .then(onConfirmed)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setSending(false);
      });
  };

  return (
    <div
      className="mix-sms-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mix-sms-card">
        <p>We'll text you when your remix is ready</p>
        <div className="mix-phone-field">
          <span>+1</span>
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            placeholder="(555) 123-4567"
            value={formatted}
            onChange={(event) => {
              setDigits(event.target.value);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
          />
        </div>
        {error && <small>{error}</small>}
        <button disabled={!valid || sending} onClick={submit}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export function MixProcess({ songA, songB, progress, sessionId, onCancel }: Props) {
  const stage = useMixStage(progress);
  const [smsState, setSmsState] = useState<SmsState>('idle');
  const thumbA = thumbnailFor(songA);
  const thumbB = thumbnailFor(songB);
  const pct = Math.max(0, Math.min(100, Math.round(progress.progress * 100)));
  const stepLabel = progress.detail || STEP_LABELS[progress.step] || 'Mixing your remix';
  const leftFallback = 'radial-gradient(circle at 35% 35%, #5b1c18, #111 72%)';
  const rightFallback = 'radial-gradient(circle at 65% 35%, #17315c, #111 72%)';

  return (
    <div className={`mix-scene ${stage}`} role="status" aria-live="polite">
      <div className="mix-bg-table" aria-hidden="true" />
      <div className="mix-bg-studio" aria-hidden="true" />
      <Dust />

      <div className="mix-deck-pair" aria-hidden="true">
        <SourceDeck thumbnailUrl={thumbA} />
        <SourceDeck thumbnailUrl={thumbB} />
      </div>

      <div className="mix-halves-stage" aria-hidden="true">
        <div
          className="mix-vinyl-whole left"
          style={backgroundStyle(thumbA, leftFallback)}
        />
        <div
          className="mix-vinyl-whole right"
          style={backgroundStyle(thumbB, rightFallback)}
        />
        <div className="mix-vinyl-spindle left">
          <span className="dot" />
        </div>
        <div className="mix-vinyl-spindle right">
          <span className="dot" />
        </div>

        <div className="mix-vinyl left" style={backgroundStyle(thumbA, leftFallback)} />
        <div className="mix-vinyl right" style={backgroundStyle(thumbB, rightFallback)} />
        <div
          className="mix-vinyl discarded right-piece"
          style={backgroundStyle(thumbA, leftFallback)}
        />
        <div
          className="mix-vinyl discarded left-piece"
          style={backgroundStyle(thumbB, rightFallback)}
        />

        <div className="mix-crack-flash" />
        <div className="mix-seam-glow" />
        <div className="mix-seal-ring" />
      </div>

      <div className="mix-target-turntable" aria-hidden="true" />

      <div className="mix-progress-shell">
        <div className="mix-progress-percent">{pct}%</div>
        <div className="mix-progress-step">{stepLabel}</div>
        <div className="mix-progress-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="mix-actions">
          {smsState === 'confirmed' ? (
            <span>We'll text you</span>
          ) : (
            <button onClick={() => setSmsState('dialog-open')}>
              <Phone size={15} aria-hidden="true" />
              Text me when it's ready
            </button>
          )}
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>

      {smsState === 'dialog-open' && (
        <SmsDialog
          sessionId={sessionId}
          onClose={() => setSmsState('idle')}
          onConfirmed={() => setSmsState('confirmed')}
        />
      )}
    </div>
  );
}
