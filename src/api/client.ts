import type { CreateRemixResponse, SessionStatus, CreateRemixError } from '../types';

const API_BASE = '/api';

/**
 * Upload two songs to create a remix.
 * Uses XMLHttpRequest for upload progress support.
 */
export function createRemix(
  songA: File,
  songB: File,
  onUploadProgress?: (pct: number) => void,
): Promise<CreateRemixResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('song_a', songA);
    formData.append('song_b', songB);

    xhr.open('POST', `${API_BASE}/remix`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      onUploadProgress?.(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let body = { detail: 'Unknown error' };
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* use default */
        }
        reject({ type: 'http', status: xhr.status, body } as CreateRemixError);
      }
    };

    xhr.onerror = () => reject({ type: 'network' } as CreateRemixError);
    xhr.ontimeout = () => reject({ type: 'timeout' } as CreateRemixError);

    xhr.send(formData);
  });
}

/**
 * Submit two YouTube URLs to create a remix.
 * Uses JSON body (no file upload needed).
 */
export async function submitYouTubeRemix(
  urlA: string,
  urlB: string,
): Promise<CreateRemixResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/remix/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url_a: urlA, url_b: urlB }),
    });
  } catch {
    throw { type: 'network' } as CreateRemixError;
  }

  if (!response.ok) {
    let body = { detail: 'Unknown error' };
    try {
      body = await response.json();
    } catch {
      /* use default */
    }
    throw { type: 'http', status: response.status, body } as CreateRemixError;
  }

  return response.json();
}

/**
 * Connect to SSE progress stream for a remix session.
 */
export function connectProgress(sessionId: string): EventSource {
  return new EventSource(`${API_BASE}/remix/${sessionId}/progress`);
}

/**
 * Get the current status of a remix session (for reconnection).
 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatus> {
  const res = await fetch(`${API_BASE}/remix/${sessionId}/status`);
  if (res.status === 404) {
    throw new Error('Session not found');
  }
  return res.json();
}

/**
 * Get the audio URL for a completed remix.
 */
export function getAudioUrl(sessionId: string): string {
  return `${API_BASE}/remix/${sessionId}/audio`;
}
