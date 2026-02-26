import type { AppState, AppAction } from '../types';

export const initialState: AppState = {
  phase: 'idle',
  songA: null,
  songB: null,
  prompt: '',
};

export function remixReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SONG_A':
      if (state.phase !== 'idle') return state;
      return { ...state, songA: action.file };

    case 'SET_SONG_B':
      if (state.phase !== 'idle') return state;
      return { ...state, songB: action.file };

    case 'SET_PROMPT':
      if (state.phase !== 'idle') return state;
      return { ...state, prompt: action.prompt };

    case 'START_UPLOAD':
      if (state.phase !== 'idle' || !state.songA || !state.songB) return state;
      return {
        phase: 'uploading',
        songA: state.songA,
        songB: state.songB,
        prompt: state.prompt,
        uploadProgress: 0,
      };

    case 'UPLOAD_PROGRESS':
      if (state.phase !== 'uploading') return state;
      return { ...state, uploadProgress: action.percent };

    case 'UPLOAD_SUCCESS':
      if (state.phase !== 'uploading') return state;
      return {
        phase: 'processing',
        sessionId: action.sessionId,
        progress: { step: 'separating', detail: 'Starting...', progress: 0 },
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
      };

    case 'ERROR': {
      const songA = state.phase === 'uploading' || state.phase === 'idle' ? state.songA : null;
      const songB = state.phase === 'uploading' || state.phase === 'idle' ? state.songB : null;
      const prompt = state.phase === 'uploading' || state.phase === 'idle' ? state.prompt : '';
      return {
        phase: 'error',
        message: action.message,
        songA,
        songB,
        prompt,
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
