// === API Contract Types ===

export type ProgressStep =
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

// === App State (discriminated union) ===

export type AppState =
  | {
      phase: 'idle';
      songA: File | null;
      songB: File | null;
      prompt: string;
    }
  | {
      phase: 'uploading';
      songA: File;
      songB: File;
      prompt: string;
      uploadProgress: number;
    }
  | {
      phase: 'processing';
      sessionId: string;
      progress: ProgressEvent;
      songA: File;
      songB: File;
      prompt: string;
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
      songA: File | null;
      songB: File | null;
      prompt: string;
    };

// === Reducer Actions (discriminated union) ===

export type AppAction =
  | { type: 'SET_SONG_A'; file: File | null }
  | { type: 'SET_SONG_B'; file: File | null }
  | { type: 'SET_PROMPT'; prompt: string }
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_PROGRESS'; percent: number }
  | { type: 'UPLOAD_SUCCESS'; sessionId: string }
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
