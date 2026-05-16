import { useEffect, useState } from 'react';
import type { ShelfRecord } from '../types';
import { useShelf } from '../hooks/useShelf';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (vocals: ShelfRecord, instrumentals: ShelfRecord) => void;
};

const VINYL_COLORS = ['#8f2d38', '#2d728f', '#7c6a0a', '#5f4b8b', '#32746d', '#b75d24'];

function vinylColor(id: string): string {
  const idx = Array.from(id).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return VINYL_COLORS[idx % VINYL_COLORS.length];
}

export function SongPickerModal({ open, onClose, onConfirm }: Props) {
  const { records, isLoading, error } = useShelf();

  const [step, setStep] = useState<1 | 2>(1);
  const [vocalsRecord, setVocalsRecord] = useState<ShelfRecord | null>(null);
  const [pendingPick, setPendingPick] = useState<ShelfRecord | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Reset all internal state when the modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setVocalsRecord(null);
      setPendingPick(null);
      setTransitioning(false);
    }
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleContinue() {
    if (!pendingPick) return;

    if (step === 1) {
      setTransitioning(true);
      setVocalsRecord(pendingPick);

      setTimeout(() => {
        setStep(2);
        setPendingPick(null);
        requestAnimationFrame(() => {
          setTransitioning(false);
        });
      }, 175);
    } else {
      if (vocalsRecord) {
        onConfirm(vocalsRecord, pendingPick);
        setStep(1);
        setVocalsRecord(null);
        setPendingPick(null);
      }
    }
  }

  function handleBack() {
    setTransitioning(true);
    setTimeout(() => {
      setStep(1);
      setPendingPick(vocalsRecord);
      requestAnimationFrame(() => setTransitioning(false));
    }, 175);
  }

  return (
    <div className={`modal-backdrop ${open ? 'open' : ''}`} onClick={handleBackdropClick}>
      <div
        className={`modal-card ${transitioning ? 'transitioning' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="step-eyebrow">Step {step} of 2</div>
            <h2 className="step-title">
              {step === 1 ? 'Select vocals' : 'Select instrumentals'}
            </h2>
            <div className="step-dots">
              <span className={`dot ${step >= 1 ? 'active' : ''}`} />
              <span className={`dot ${step >= 2 ? 'active' : ''}`} />
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Picker grid */}
        <div className="picker-shelf">
          {isLoading && (
            <div className="picker-status">Loading…</div>
          )}

          {error && (
            <div className="picker-status picker-error">{error}</div>
          )}

          {!isLoading &&
            !error &&
            records.map(record => {
              const isSelected = pendingPick?.id === record.id;
              const isUsed = step === 2 && vocalsRecord?.id === record.id;
              const color = vinylColor(record.id);
              return (
                <div
                  key={record.id}
                  className={`picker-card ${isSelected ? 'selected' : ''} ${isUsed ? 'disabled' : ''}`}
                  onClick={() => !isUsed && setPendingPick(record)}
                >
                  <div className="picker-vinyl">
                    <svg viewBox="0 0 140 140" className="picker-disc">
                      <defs>
                        <clipPath id={`disc-clip-${record.id}`}>
                          <circle cx="70" cy="70" r="66" />
                        </clipPath>
                        <pattern
                          id={`thumb-${record.id}`}
                          patternUnits="objectBoundingBox"
                          patternContentUnits="objectBoundingBox"
                          width="1" height="1"
                        >
                          <image
                            href={record.thumbnail_url}
                            x="-0.25" y="-0.25"
                            width="1.5" height="1.5"
                            preserveAspectRatio="xMidYMid slice"
                          />
                        </pattern>
                        <radialGradient id={`shimmer-${record.id}`} cx="40%" cy="35%">
                          <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      {/* Outer edge */}
                      <circle cx="70" cy="70" r="68" fill="#0a0a0a" />
                      {/* Full-bleed thumbnail as record surface */}
                      <circle cx="70" cy="70" r="66" fill={`url(#thumb-${record.id})`} />
                      {/* Groove rings over the image */}
                      {[0.94, 0.88, 0.82, 0.76, 0.70, 0.64, 0.58].map(pct => (
                        <circle key={pct} cx="70" cy="70" r={66 * pct} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.4" />
                      ))}
                      {/* Shimmer */}
                      <circle cx="70" cy="70" r="66" fill={`url(#shimmer-${record.id})`} />
                      {/* Center label */}
                      <circle cx="70" cy="70" r="12" fill={color} />
                      <circle cx="70" cy="70" r="11" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                      {/* Spindle */}
                      <circle cx="70" cy="70" r="2" fill="#1a1a1a" />
                    </svg>
                    {isSelected && <span className="check-badge">✓</span>}
                  </div>
                  <div className="info">
                    <div className="t">{record.title}</div>
                    <div className="a">{record.artist}</div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-hint">
            {pendingPick ? (
              <>
                {step === 1 ? 'Vocals: ' : 'Instrumentals: '}
                <span className="selected-title">{pendingPick.title}</span>
              </>
            ) : step === 1
              ? 'Choose a song for vocals'
              : 'Choose a song for instrumentals'}
          </div>
          <div>
            {step === 2 && (
              <button className="back-step-btn" onClick={handleBack}>
                ← Back
              </button>
            )}
            <button
              className="continue-btn"
              disabled={!pendingPick}
              onClick={handleContinue}
            >
              {step === 1 ? 'Continue ▸' : 'Load decks ▸'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
