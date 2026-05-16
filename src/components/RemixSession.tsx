import { useReducer, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { remixReducer, initialState } from '../hooks/useRemixReducer';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { DJBoard } from './DJBoard';
import { InputDeck } from './InputDeck';
import { MixButton } from './MixButton';
import { RecordShelf } from './RecordShelf';
import { SongPickerModal } from './SongPickerModal';
import { createRemix, submitYouTubeRemix } from '../api/client';
import type { AppState, CreateRemixError, ShelfRecord, SongInput } from '../types';

function formatError(error: CreateRemixError): string {
  switch (error.type) {
    case 'network':
      return 'Request failed. Check your connection and try again.';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case 'http':
      if (error.status === 429) {
        return 'Another remix is being created. Please wait and try again.';
      } else if (error.status === 413) {
        return error.body.detail || 'File too large. Maximum 50MB per song.';
      } else if (error.status === 422) {
        return error.body.detail || 'Invalid input. Please check your uploads.';
      } else {
        return error.body.detail || 'Something went wrong. Please try again.';
      }
    default:
      return 'Something went wrong. Please try again.';
  }
}

/** True when both slots have YouTube URLs (no file uploads). */
function isBothYouTube(a: SongInput | null, b: SongInput | null): boolean {
  return a?.type === 'youtube' && b?.type === 'youtube';
}

export function RemixSession() {
  const [state, dispatch] = useReducer(remixReducer, initialState);
  const navigate = useNavigate();
  useFormPersistence(state, dispatch);

  const [modalOpen, setModalOpen] = useState(false);

  // Derive session ID only when actively processing (used in effect + dep array)
  const activeSessionId = state.phase === 'processing' ? state.sessionId : null;

  // Navigate to remix page when processing starts
  useEffect(() => {
    if (state.phase === 'processing') {
      // Pass minimal serializable song data for processing visuals.
      const toSongState = (s: SongInput) =>
        s.type === 'youtube'
          ? { type: 'youtube' as const, url: s.url, thumbnailUrl: s.thumbnailUrl }
          : { type: 'file' as const };
      navigate(`/remix/${activeSessionId}`, {
        state: {
          creator: true,
          songA: toSongState(state.songA),
          songB: toSongState(state.songB),
        },
      });
    }
  }, [state.phase, activeSessionId, navigate]);

  // Handle file upload submission
  const handleUpload = useCallback(async () => {
    if (state.phase !== 'uploading') return;
    if (state.songA.type !== 'file' || state.songB.type !== 'file') return;

    try {
      const response = await createRemix(
        state.songA.file,
        state.songB.file,
        (pct) => dispatch({ type: 'UPLOAD_PROGRESS', percent: pct }),
      );
      dispatch({ type: 'UPLOAD_SUCCESS', sessionId: response.session_id });
    } catch (err) {
      dispatch({ type: 'ERROR', message: formatError(err as CreateRemixError) });
    }
  }, [state]);

  // Handle YouTube URL submission
  const handleYouTubeSubmit = useCallback(async () => {
    if (state.phase !== 'submitting') return;
    if (state.songA.type !== 'youtube' || state.songB.type !== 'youtube') return;

    try {
      const response = await submitYouTubeRemix(
        state.songA.url,
        state.songB.url,
      );
      dispatch({ type: 'SUBMIT_SUCCESS', sessionId: response.session_id });
    } catch (err) {
      dispatch({ type: 'ERROR', message: formatError(err as CreateRemixError) });
    }
  }, [state]);

  // Trigger upload when entering uploading phase
  useEffect(() => {
    if (state.phase === 'uploading') handleUpload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Trigger YouTube submit when entering submitting phase
  useEffect(() => {
    if (state.phase === 'submitting') handleYouTubeSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (state.phase !== 'idle') return;
    const { songA, songB } = state;
    if (!songA || !songB) return;

    if (isBothYouTube(songA, songB)) {
      dispatch({ type: 'START_SUBMIT' });
    } else {
      dispatch({ type: 'START_UPLOAD' });
    }
  }, [state]);

  // Modal confirm — load both songs from shelf records
  const handleModalConfirm = useCallback(
    (vocals: ShelfRecord, instrumentals: ShelfRecord) => {
      dispatch({
        type: 'SET_YOUTUBE_URL_A',
        url: vocals.youtube_url,
        title: vocals.title,
        thumbnailUrl: vocals.thumbnail_url,
      });
      dispatch({
        type: 'SET_YOUTUBE_URL_B',
        url: instrumentals.youtube_url,
        title: instrumentals.title,
        thumbnailUrl: instrumentals.thumbnail_url,
      });
      setModalOpen(false);
    },
    [dispatch],
  );

  // Derive UI state
  const songA = 'songA' in state ? state.songA : null;
  const songB = 'songB' in state ? state.songB : null;
  const bothLoaded = songA !== null && songB !== null;

  // CTA label depends on whether songs are already loaded
  const ctaLabel = bothLoaded ? 'Change songs' : 'Choose your songs \u25B8';

  // Shared board elements
  const deckA = <InputDeck deckId="a" song={songA} />;
  const deckB = <InputDeck deckId="b" song={songB} />;
  const cabinet = <RecordShelf />;

  // --- Phase render functions ---

  function renderIdle() {
    return (
      <DJBoard
        deckA={deckA}
        deckB={deckB}
        mixControls={
          <MixButton
            canMix={bothLoaded}
            submitting={false}
            onClick={handleSubmit}
          />
        }
        cabinetContent={cabinet}
        cabinetOverlay={
          <button
            className="cta"
            onClick={() => setModalOpen(true)}
          >
            {ctaLabel}
          </button>
        }
      />
    );
  }

  function renderUploading(s: Extract<AppState, { phase: 'uploading' }>) {
    return (
      <>
        <DJBoard
          deckA={deckA}
          deckB={deckB}
          mixControls={
            <MixButton
              canMix={false}
              submitting={true}
              onClick={() => {}}
            />
          }
          cabinetContent={cabinet}
        />
        {/* Upload progress below the stage */}
        <div className="mx-auto mt-4 w-full max-w-md space-y-1">
          <div className="h-2 rounded-full bg-black/30 overflow-hidden border border-amber-900/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${s.uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-amber-200/40 text-center">
            Uploading... {s.uploadProgress}%
          </p>
        </div>
      </>
    );
  }

  function renderSubmitting() {
    return (
      <>
        <DJBoard
          deckA={deckA}
          deckB={deckB}
          mixControls={
            <MixButton
              canMix={false}
              submitting={true}
              onClick={() => {}}
            />
          }
          cabinetContent={cabinet}
        />
        <p className="mt-4 text-sm text-amber-200/40 text-center">
          Submitting your songs...
        </p>
      </>
    );
  }

  function renderError(s: Extract<AppState, { phase: 'error' }>) {
    return (
      <DJBoard
        centerContent={
          <div className="w-full max-w-md mx-auto text-center space-y-4 py-4">
            <div className="rounded-lg border border-amber-700/50 bg-amber-950/25 p-6">
              <p className="text-amber-200/80">{s.message}</p>
            </div>
            <button
              className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 px-6 py-3 text-sm font-medium text-amber-50 hover:from-amber-500 hover:to-amber-700 transition-colors min-h-[44px]"
              onClick={() => dispatch({ type: 'RETRY' })}
            >
              Try Again
            </button>
          </div>
        }
        cabinetContent={cabinet}
      />
    );
  }

  function renderPhase() {
    switch (state.phase) {
      case 'idle':        return renderIdle();
      case 'uploading':   return renderUploading(state);
      case 'submitting':  return renderSubmitting();
      case 'processing':
      case 'ready':       return null;
      case 'error':       return renderError(state);
    }
  }

  return (
    <>
      {/* App header */}
      <header className="app-header">
        <h1>musicMixer</h1>
        <p>Pick two songs. AI grabs the vocals from one and drops them over instrumentals from the other.</p>
      </header>

      {/* Rotate prompt — CSS shows it only on portrait phones */}
      <div className="rotate-prompt">
        <div className="icon">
          <svg viewBox="0 0 24 24" stroke="#f5b042" strokeWidth="2" fill="none">
            <rect x="7" y="3" width="10" height="18" rx="2" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
        </div>
        <h2>Rotate your device</h2>
        <p>
          musicMixer is built for landscape. Tilt your phone sideways to get to
          the decks.
        </p>
      </div>

      {/* Song picker modal */}
      <SongPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      {renderPhase()}
    </>
  );
}
