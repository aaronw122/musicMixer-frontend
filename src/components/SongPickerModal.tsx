import { useEffect, useState, useRef } from 'react';
import type { ShelfRecord } from '../types';
import { useShelf } from '../hooks/useShelf';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (vocals: ShelfRecord, instrumentals: ShelfRecord) => void;
};

const VINYL_COLORS = ['#8f2d38', '#2d728f', '#7c6a0a', '#5f4b8b', '#32746d', '#b75d24'];
const YOUTUBE_URL_RE =
  /^https?:\/\/(www\.|m\.|music\.)?youtu(be\.com\/watch\?v=|\.be\/)[A-Za-z0-9_-]+/;

function vinylColor(id: string): string {
  const idx = Array.from(id).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return VINYL_COLORS[idx % VINYL_COLORS.length];
}

export function SongPickerModal({ open, onClose, onConfirm }: Props) {
  const { records, isLoading, error, addRecord } = useShelf();

  const [step, setStep] = useState<1 | 2>(1);
  const [vocalsRecord, setVocalsRecord] = useState<ShelfRecord | null>(null);
  const [pendingPick, setPendingPick] = useState<ShelfRecord | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // "Add from YouTube" inline form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newRecordId, setNewRecordId] = useState<string | null>(null);

  // Reset all internal state when the modal closes
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setStep(1);
      setVocalsRecord(null);
      setPendingPick(null);
      setTransitioning(false);
      setShowAddForm(false);
      setAddUrl('');
      setAddError(null);
      setNewRecordId(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap: capture focus on open, trap Tab inside modal, restore on close
  useEffect(() => {
    if (!open) return;

    // Save the previously focused element to restore on close
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the modal container
    const modal = modalRef.current;
    if (modal) modal.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    };
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

  async function handleAddDone() {
    const trimmed = addUrl.trim();
    if (!YOUTUBE_URL_RE.test(trimmed)) {
      setAddError('Paste a valid YouTube URL');
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      const record = await addRecord(trimmed);
      setShowAddForm(false);
      setAddUrl('');
      setPendingPick(record);
      setNewRecordId(record.id);
      setTimeout(() => setNewRecordId(null), 600);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setIsAdding(false);
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
        ref={modalRef}
        className={`modal-card ${transitioning ? 'transitioning' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={step === 1 ? 'Select vocals' : 'Select instrumentals'}
        tabIndex={-1}
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
          <button className="modal-close" onClick={onClose} aria-label="Close song picker">
            ✕
          </button>
        </div>

        {/* Picker grid */}
        <div className="picker-shelf">
          {isLoading && (
            <div className="picker-status">Loading\u2026</div>
          )}

          {error && !showAddForm && (
            <div className="picker-status picker-error">{error}</div>
          )}

          {!isLoading &&
            records.map(record => {
              const isSelected = pendingPick?.id === record.id;
              const isUsed = step === 2 && vocalsRecord?.id === record.id;
              const isNew = record.id === newRecordId;
              const color = vinylColor(record.id);
              return (
                <div
                  key={record.id}
                  className={`picker-card${isSelected ? ' selected' : ''}${isUsed ? ' disabled' : ''}${isNew ? ' fade-in' : ''}`}
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

          {/* Ghost "Add from YouTube" tile */}
          {!isLoading && !error && !showAddForm && (
            <div className="picker-card add-yt-ghost" onClick={() => setShowAddForm(true)}>
              <div className="picker-vinyl">
                <svg viewBox="0 0 140 140" className="picker-disc add-yt-disc">
                  <circle cx="70" cy="70" r="68" fill="none" stroke="rgba(245, 176, 66, 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <circle cx="70" cy="70" r="12" fill="none" stroke="rgba(245, 176, 66, 0.15)" strokeWidth="0.5" />
                  <circle cx="70" cy="70" r="2" fill="rgba(245, 176, 66, 0.2)" />
                  {/* Plus icon */}
                  <line x1="58" y1="70" x2="82" y2="70" stroke="rgba(245, 176, 66, 0.45)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="70" y1="58" x2="70" y2="82" stroke="rgba(245, 176, 66, 0.45)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="info">
                <div className="t add-yt-label">Add from YouTube</div>
              </div>
            </div>
          )}
        </div>

        {/* Add from YouTube inline form */}
        {showAddForm && (
          <div className="add-yt-form">
            <input
              type="url"
              className="add-yt-input"
              placeholder="Paste a YouTube URL\u2026"
              value={addUrl}
              onChange={e => { setAddUrl(e.target.value); setAddError(null); }}
              disabled={isAdding}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && addUrl.trim()) handleAddDone(); }}
            />
            {addError && <p className="add-yt-error">{addError}</p>}
            <div className="add-yt-actions">
              <button
                type="button"
                className="add-yt-cancel"
                onClick={() => { setShowAddForm(false); setAddUrl(''); setAddError(null); }}
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-yt-done"
                onClick={handleAddDone}
                disabled={isAdding || !addUrl.trim()}
              >
                {isAdding ? 'Adding\u2026' : 'Done'}
              </button>
            </div>
          </div>
        )}

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
                {'\u2190'} Back
              </button>
            )}
            <button
              className="continue-btn"
              disabled={!pendingPick}
              onClick={handleContinue}
            >
              {step === 1 ? 'Continue \u25B8' : 'Load decks \u25B8'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
