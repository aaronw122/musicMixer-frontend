import { useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Phone } from 'lucide-react';
import { registerSmsNotification } from '../api/client';
import { MixedVinylRecord, TurntableScene } from './turntable';
import type { ProgressEvent, SongInput } from '../types';
import './MixProcess.css';

type MixStage = '' | 'is-floating' | 'is-breaking' | 'is-mixing' | 'is-sealed' | 'is-done';
type SmsState = 'idle' | 'dialog-open' | 'confirmed';

type Props = {
  songA?: SongInput;
  songB?: SongInput;
  progress: ProgressEvent;
  sessionId: string;
  onCancel: () => void;
  stageOverride?: MixStage;
};

const STEP_LABELS: Record<string, string> = {
  downloading: 'Grabbing your tunes',
  separating: 'Separating vocals',
  analyzing: 'Reading the groove',
  interpreting: 'Planning the blend',
  processing: 'Mixing the records',
  rendering: 'Pressing the master',
  complete: 'Done',
  queue_position: 'Waiting for an open slot...',
  queue_estimate: 'Waiting for an open slot...',
  processing_started: 'Your remix is starting now',
};
const FLOATING_NOTES = ['♪', '♫', '♬', '♩'];

function thumbnailFor(song: SongInput | undefined): string | undefined {
  return song?.type === 'youtube' ? song.thumbnailUrl : undefined;
}

function VinylImage({ thumbnailUrl }: { thumbnailUrl?: string }) {
  const reactId = useId();
  if (!thumbnailUrl) return null;
  const patId = `vimg${reactId.replace(/:/g, '')}`;
  return (
    <svg className="mix-vinyl-img" viewBox="0 0 360 360" aria-hidden="true">
      <defs>
        <pattern
          id={patId}
          patternUnits="objectBoundingBox"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <image
            href={thumbnailUrl}
            x="-0.25"
            y="-0.25"
            width="1.5"
            height="1.5"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      <circle cx="180" cy="180" r="180" fill={`url(#${patId})`} />
    </svg>
  );
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

    if (progress.progress >= 0.96 || progress.step === 'rendering') {
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
        note: FLOATING_NOTES[index % FLOATING_NOTES.length],
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
        >
          {particle.note}
        </span>
      ))}
    </div>
  );
}

function SourceDeck({ thumbnailUrl, deckId }: { thumbnailUrl: string | undefined; deckId: string }) {
  const pid = (base: string) => `mix-src-${base}-${deckId}`;

  return (
    <div className="mix-deck">
      <svg
        className="mix-vinyl-source"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <defs>
          {thumbnailUrl && (
            <pattern
              id={pid('thumb')}
              patternUnits="objectBoundingBox"
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={thumbnailUrl}
                x="-0.25"
                y="-0.25"
                width="1.5"
                height="1.5"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          )}
          <radialGradient id={pid('vinyl')} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#111" />
          </radialGradient>
          <radialGradient id={pid('shimmer')} cx="40%" cy="35%">
            <stop offset="0%" stopColor="#333" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <clipPath id={pid('clip')}>
            <circle cx="100" cy="100" r="97" />
          </clipPath>
        </defs>

        {/* Vinyl disc body */}
        <g clipPath={`url(#${pid('clip')})`}>
          <circle cx="100" cy="100" r="140" fill={`url(#${pid('vinyl')})`} />
          {thumbnailUrl && (
            <circle cx="100" cy="100" r="97" fill={`url(#${pid('thumb')})`} />
          )}
        </g>

        {/* Groove rings */}
        {[0.94, 0.88, 0.82, 0.76, 0.70, 0.64, 0.58, 0.52, 0.46].map((pct) => (
          <circle
            key={pct}
            cx="100"
            cy="100"
            r={97 * pct}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="0.4"
          />
        ))}

        {/* Groove shimmer */}
        <circle cx="100" cy="100" r="97" fill={`url(#${pid('shimmer')})`} />

        {/* Edge ring */}
        <circle cx="100" cy="100" r="97" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

        {/* Center label */}
        <circle cx="100" cy="100" r="28" fill={deckId === 'a' ? '#c41e3a' : '#1e40af'} />
        <circle
          cx="100"
          cy="100"
          r="24"
          fill="none"
          stroke={deckId === 'a' ? '#a31830' : '#1a3690'}
          strokeWidth="0.6"
        />

        {/* Spindle hole */}
        <circle cx="100" cy="100" r="3" fill="#1a1a1a" />
      </svg>
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

export function MixProcess({ songA, songB, progress, sessionId, onCancel, stageOverride }: Props) {
  const liveStage = useMixStage(progress);
  const stage = stageOverride ?? liveStage;
  const [smsState, setSmsState] = useState<SmsState>('idle');
  const thumbA = thumbnailFor(songA);
  const thumbB = thumbnailFor(songB);
  const pct = Math.max(0, Math.min(100, Math.round(progress.progress * 100)));
  const isQueued = progress.step === 'queue_position' || progress.step === 'queue_estimate';
  const stepLabel = progress.detail || STEP_LABELS[progress.step] || 'Mixing your remix';

  // Halves converge: fraction goes 1→0 as pct goes 0→96
  const mixFraction = stage === 'is-mixing'
    ? 1 - Math.min(pct / 96, 1)
    : undefined;

  return (
    <div className={`mix-scene ${stage}`} role="status" aria-live="polite">
      <div className="mix-bg-table" aria-hidden="true" />
      <div className="mix-bg-studio" aria-hidden="true" />
      <Dust />

      <div className="mix-deck-pair" aria-hidden="true">
        <SourceDeck thumbnailUrl={thumbA} deckId="a" />
        <SourceDeck thumbnailUrl={thumbB} deckId="b" />
      </div>

      <div className="mix-halves-stage" aria-hidden="true">
        <div className="mix-vinyl-whole left">
          <VinylImage thumbnailUrl={thumbA} />
        </div>
        <div className="mix-vinyl-whole right">
          <VinylImage thumbnailUrl={thumbB} />
        </div>
        <div
          className="mix-vinyl-spindle left"
          style={mixFraction != null ? { '--mix-converge': mixFraction } as CSSProperties : undefined}
        >
          <span className="dot" />
        </div>
        <div
          className="mix-vinyl-spindle right"
          style={mixFraction != null ? { '--mix-converge': mixFraction } as CSSProperties : undefined}
        >
          <span className="dot" />
        </div>

        <div
          className="mix-vinyl left"
          style={mixFraction != null ? { '--mix-converge': mixFraction } as CSSProperties : undefined}
        >
          <VinylImage thumbnailUrl={thumbA} />
        </div>
        <div
          className="mix-vinyl right"
          style={mixFraction != null ? { '--mix-converge': mixFraction } as CSSProperties : undefined}
        >
          <VinylImage thumbnailUrl={thumbB} />
        </div>
        <div className="mix-vinyl discarded right-piece">
          <VinylImage thumbnailUrl={thumbA} />
        </div>
        <div className="mix-vinyl discarded left-piece">
          <VinylImage thumbnailUrl={thumbB} />
        </div>

        <div className="mix-vinyl-merged">
          <svg viewBox="0 0 360 360" aria-hidden="true">
            <MixedVinylRecord
              cx={180}
              cy={180}
              radius={179}
              leftThumbnailUrl={thumbA}
              rightThumbnailUrl={thumbB}
              idPrefix={`mix-merged-${sessionId}`}
            />
          </svg>
        </div>

        <div className="mix-crack-flash" />
        <svg className="mix-seam-glow" viewBox="0 0 360 360" aria-hidden="true">
          <defs>
            <linearGradient id={`seam-grad-${sessionId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(245,176,66)" stopOpacity="0" />
              <stop offset="35%" stopColor="rgb(255,236,180)" stopOpacity="0.95" />
              <stop offset="50%" stopColor="rgb(245,176,66)" stopOpacity="0.95" />
              <stop offset="65%" stopColor="rgb(255,236,180)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="rgb(245,176,66)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M180,2 L210.3,29.4 149.7,56.8 210.3,84.2 149.7,111.5 210.3,138.9 149.7,166.3 210.3,193.7 149.7,221.1 210.3,248.5 149.7,275.8 210.3,303.2 149.7,330.6 180,358"
            fill="none"
            stroke={`url(#seam-grad-${sessionId})`}
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="mix-seal-ring" />
      </div>

      <div className="mix-target-turntable" aria-hidden="true">
        <TurntableScene
          remixTitle="Your Remix"
          tonearmAngle={7}
          isSpinning={false}
          deckId={`mix-drop-${sessionId}`}
          mixedRecord={{
            leftThumbnailUrl: thumbA,
            rightThumbnailUrl: thumbB,
          }}
        />
      </div>

      <div className="mix-progress-shell">
        {isQueued ? (
          <>
            <div className="mix-progress-step" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Another remix is in progress
            </div>
            <div className="mix-progress-step" style={{ opacity: 0.7 }}>
              Yours will start automatically — hang tight
            </div>
            <div className="mix-progress-bar" style={{ marginTop: '1rem' }}>
              <i className="mix-bar-pulse" />
            </div>
            <div className="mix-actions" style={{ marginTop: '1.2rem' }}>
              {smsState === 'confirmed' ? (
                <span>We'll text you when it's ready</span>
              ) : (
                <button onClick={() => setSmsState('dialog-open')} className="mix-sms-cta-prominent">
                  <Phone size={15} aria-hidden="true" />
                  Text me when it's ready
                </button>
              )}
              <button onClick={onCancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
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
                  Text me when it's ready (remix can take up to 4 mins)
                </button>
              )}
              <button onClick={onCancel}>Cancel</button>
            </div>
          </>
        )}
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
