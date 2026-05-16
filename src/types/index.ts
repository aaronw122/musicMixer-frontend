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
  keyWarning?: string;
};

export type CreateRemixResponse = {
  session_id: string;
};

export type SessionStatus = {
  session_id: string;
  status: 'processing' | 'complete' | 'error' | 'cancelled' | 'queued';
  remix_path: string | null;
  explanation: string | null;
  last_event: ProgressEvent | null;
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
      keyWarning?: string;
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
  | { type: 'REMIX_READY'; explanation: string; warnings: string[]; usedFallback: boolean; keyWarning?: string }
  | { type: 'ERROR'; message: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

// === Public Remix (Share Link) Types ===

export type PublicRemixResponse = {
  session_id: string;
  status: 'ready';
  audio_url: string;
  explanation: string;
  warnings: string[];
  usedFallback: boolean;
  expires_at: string;
};

export type ListenSubstate = 'loading' | 'ready' | 'processing' | 'invalid' | 'unavailable' | 'expired';

export type ListenState =
  | { substate: 'loading' }
  | {
      substate: 'ready';
      sessionId: string;
      explanation: string;
      warnings: string[];
      usedFallback: boolean;
      expiresAt: string;
    }
  | { substate: 'processing' }
  | { substate: 'invalid' }
  | { substate: 'unavailable' }
  | { substate: 'expired' };

// === Record Shelf Types ===

export type ShelfRecord = {
  id: string;
  title: string;
  artist: string;
  sleeve_image_url: string;
  youtube_url: string;
  thumbnail_url: string;
};

export type ShelfSelectionState = {
  step: 'vocals' | 'instrumentals';
  vocalsRecord: ShelfRecord | null;
  instrumentalsRecord: ShelfRecord | null;
  previewRecord: ShelfRecord | null;
};

// === API Error Types ===

export type CreateRemixError =
  | { type: 'network' }
  | { type: 'timeout' }
  | { type: 'http'; status: number; body: { detail: string } };
