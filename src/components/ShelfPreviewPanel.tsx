import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import type { ShelfSelectionState } from '../types';

type Props = {
  selectionState: ShelfSelectionState;
  onConfirm: () => void;
  onBack: () => void;
  onReset: () => void;
};

export function ShelfPreviewPanel({
  selectionState,
  onConfirm,
  onBack,
  onReset,
}: Props) {
  const preview = selectionState.previewRecord;
  const isInstrumentalsStep = selectionState.step === 'instrumentals';
  const hasCompleteSelection =
    selectionState.vocalsRecord !== null && selectionState.instrumentalsRecord !== null;

  return (
    <aside className="shelf-preview-panel" aria-live="polite">
      <div className="shelf-preview-panel__copy">
        <p className="shelf-preview-panel__eyebrow">
          {selectionState.step === 'vocals' ? 'Vocals source' : 'Instrumental source'}
        </p>
        {preview ? (
          <>
            <h3 className="shelf-preview-panel__title">{preview.title}</h3>
            <p className="shelf-preview-panel__artist">{preview.artist}</p>
          </>
        ) : (
          <>
            <h3 className="shelf-preview-panel__title">
              {selectionState.step === 'vocals'
                ? 'Pick your vocals'
                : 'Pick your instrumentals'}
            </h3>
            <p className="shelf-preview-panel__artist">Select a sleeve from the bay.</p>
          </>
        )}
      </div>

      <div className="shelf-preview-panel__actions">
        {isInstrumentalsStep && (
          <button type="button" className="shelf-control-button shelf-control-button--ghost" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
        {hasCompleteSelection ? (
          <button type="button" className="shelf-control-button shelf-control-button--ghost" onClick={onReset}>
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        ) : null}
        <button
          type="button"
          className="shelf-control-button shelf-control-button--primary"
          onClick={onConfirm}
          disabled={!preview}
        >
          <Check size={16} />
          <span>{selectionState.step === 'vocals' ? 'Confirm vocals' : 'Confirm instrumentals'}</span>
        </button>
      </div>
    </aside>
  );
}
