// === API Contract Types ===

export type ProgressStep =
  | 'downloading'
  | 'separating'
  | 'analyzing'
  | 'interpreting'
  | 'processing'
  | 'rendering'
  | 'complete'
  | 'error'
  | 'keepalive';

export type ProgressEvent = {
  step: ProgressStep;
  detail: string;
  progress: number;
  explanation?: string;
  warnings?: string[];
  usedFallback?: boolean;
};

export type CreateRemixResponse = {
  session_id: string;
};

export type SessionStatus = {
  status: 'processing' | 'complete' | 'error';
  progress?: number;
  detail?: string;
  explanation?: string;
  warnings?: string[];
  usedFallback?: boolean;
};

// === Song Input Types ===

export type SongInput =
  | { type: 'file'; file: File }
  | { type: 'youtube'; url: string; title?: string; thumbnailUrl?: string };

// === App State (discriminated union) ===

export type AppState =
  | {
      phase: 'idle';
      songA: SongInput | null;
      songB: SongInput | null;
    }
  | {
      phase: 'uploading';
      songA: SongInput;
      songB: SongInput;
      uploadProgress: number;
    }
  | {
      phase: 'submitting';
      songA: SongInput;
      songB: SongInput;
    }
  | {
      phase: 'processing';
      sessionId: string;
      progress: ProgressEvent;
      songA: SongInput;
      songB: SongInput;
    }
  | {
      phase: 'ready';
      sessionId: string;
      explanation: string;
      warnings: string[];
      usedFallback: boolean;
    }
  | {
      phase: 'error';
      message: string;
      songA: SongInput | null;
      songB: SongInput | null;
    };

// === Reducer Actions (discriminated union) ===

export type AppAction =
  | { type: 'SET_SONG_A'; file: File | null }
  | { type: 'SET_SONG_B'; file: File | null }
  | { type: 'SET_YOUTUBE_URL_A'; url: string; title?: string; thumbnailUrl?: string }
  | { type: 'SET_YOUTUBE_URL_B'; url: string; title?: string; thumbnailUrl?: string }
  | { type: 'CLEAR_SONG_A' }
  | { type: 'CLEAR_SONG_B' }
  | { type: 'START_UPLOAD' }
  | { type: 'START_SUBMIT' }
  | { type: 'UPLOAD_PROGRESS'; percent: number }
  | { type: 'UPLOAD_SUCCESS'; sessionId: string }
  | { type: 'SUBMIT_SUCCESS'; sessionId: string }
  | { type: 'PROGRESS_EVENT'; event: ProgressEvent }
  | { type: 'REMIX_READY'; explanation: string; warnings: string[]; usedFallback: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

// === API Error Types ===

export type CreateRemixError =
  | { type: 'network' }
  | { type: 'timeout' }
  | { type: 'http'; status: number; body: { detail: string } };
