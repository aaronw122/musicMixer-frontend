import { createRemix, submitYouTubeRemix } from '../api/client';
import type { SongInput } from '../types';

type SubmitRemixResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: 'unsupported-mixed' };

export async function submitRemixSongs(
  songA: SongInput,
  songB: SongInput,
  onUploadProgress?: (pct: number) => void,
): Promise<SubmitRemixResult> {
  if (songA.type === 'file' && songB.type === 'file') {
    const response = await createRemix(songA.file, songB.file, onUploadProgress);
    return { ok: true, sessionId: response.session_id };
  }

  if (songA.type === 'youtube' && songB.type === 'youtube') {
    const response = await submitYouTubeRemix(songA.url, songB.url);
    return { ok: true, sessionId: response.session_id };
  }

  return { ok: false, reason: 'unsupported-mixed' };
}
