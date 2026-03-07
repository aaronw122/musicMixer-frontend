import type { AppState, AppAction } from '../types';

export const initialState: AppState = {
  phase: 'idle',
  songA: null,
  songB: null,
};

export function remixReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SONG_A':
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        songA: action.file ? { type: 'file', file: action.file } : null,
      };

    case 'SET_SONG_B':
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        songB: action.file ? { type: 'file', file: action.file } : null,
      };

    case 'SET_YOUTUBE_URL_A':
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        songA: {
          type: 'youtube',
          url: action.url,
          title: action.title,
          thumbnailUrl: action.thumbnailUrl,
        },
      };

    case 'SET_YOUTUBE_URL_B':
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        songB: {
          type: 'youtube',
          url: action.url,
          title: action.title,
          thumbnailUrl: action.thumbnailUrl,
        },
      };

    case 'CLEAR_SONG_A':
      if (state.phase !== 'idle') return state;
      return { ...state, songA: null };

    case 'CLEAR_SONG_B':
      if (state.phase !== 'idle') return state;
      return { ...state, songB: null };

    case 'START_UPLOAD':
      if (state.phase !== 'idle' || !state.songA || !state.songB) return state;
      return {
        phase: 'uploading',
        songA: state.songA,
        songB: state.songB,
        uploadProgress: 0,
      };

    case 'START_SUBMIT':
      if (state.phase !== 'idle' || !state.songA || !state.songB) return state;
      return {
        phase: 'submitting',
        songA: state.songA,
        songB: state.songB,
      };

    case 'UPLOAD_PROGRESS':
      if (state.phase !== 'uploading') return state;
      return { ...state, uploadProgress: action.percent };

    case 'UPLOAD_SUCCESS':
      if (state.phase !== 'uploading') return state;
      return {
        phase: 'processing',
        sessionId: action.sessionId,
        progress: { step: 'separating', detail: 'Starting pipeline...', progress: 0.02 },
        songA: state.songA,
        songB: state.songB,
      };

    case 'SUBMIT_SUCCESS':
      if (state.phase !== 'submitting') return state;
      return {
        phase: 'processing',
        sessionId: action.sessionId,
        progress: { step: 'downloading', detail: 'Starting download...', progress: 0.02 },
        songA: state.songA,
        songB: state.songB,
      };

    case 'PROGRESS_EVENT':
      if (state.phase !== 'processing') return state;
      return { ...state, progress: action.event };

    case 'REMIX_READY':
      if (state.phase !== 'processing') return state;
      return {
        phase: 'ready',
        sessionId: state.sessionId,
        explanation: action.explanation,
        warnings: action.warnings,
        usedFallback: action.usedFallback,
        keyWarning: action.keyWarning,
      };

    case 'ERROR': {
      const hasFormData =
        state.phase === 'idle' ||
        state.phase === 'uploading' ||
        state.phase === 'submitting' ||
        state.phase === 'processing';
      return {
        phase: 'error' as const,
        message: action.message,
        songA: hasFormData ? state.songA : null,
        songB: hasFormData ? state.songB : null,
      };
    }

    case 'RETRY':
      if (state.phase !== 'error') return state;
      return {
        phase: 'idle' as const,
        songA: state.songA,
        songB: state.songB,
      };

    case 'CANCEL':
      if (state.phase !== 'processing') return state;
      return {
        phase: 'idle' as const,
        songA: state.songA,
        songB: state.songB,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
