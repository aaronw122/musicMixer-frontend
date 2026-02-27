import { useRef, useCallback, useState, useEffect } from 'react';
import type { SongInput } from '../types';

type InputMode = 'file' | 'youtube';

type Props = {
  label: string;
  song: SongInput | null;
  onFileChange: (file: File | null) => void;
  onYouTubeUrl: (url: string, title?: string, thumbnailUrl?: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = ['.mp3', '.wav'];

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.|music\.)?youtu(be\.com\/watch\?v=|\.be\/)[A-Za-z0-9_-]+/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_PATTERN.test(url.trim());
}

type OEmbedResult = { title: string; thumbnail_url: string } | null;

function useOEmbed(url: string) {
  const [result, setResult] = useState<OEmbedResult>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url || !isValidYouTubeUrl(url)) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.title) {
          setResult({ title: data.title, thumbnail_url: data.thumbnail_url });
        } else {
          setResult(null);
        }
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { result, loading };
}

export function SongUpload({
  label,
  song,
  onFileChange,
  onYouTubeUrl,
  onClear,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<InputMode>(
    song?.type === 'youtube' ? 'youtube' : 'file',
  );
  const [urlInput, setUrlInput] = useState(
    song?.type === 'youtube' ? song.url : '',
  );

  // Track the last submitted URL to avoid re-submitting on every keystroke
  const lastSubmittedUrl = useRef<string>(song?.type === 'youtube' ? song.url : '');

  const { result: oembedResult, loading: oembedLoading } = useOEmbed(urlInput);

  // When oEmbed result arrives and URL is valid, dispatch the YouTube URL action
  useEffect(() => {
    if (
      oembedResult &&
      isValidYouTubeUrl(urlInput) &&
      lastSubmittedUrl.current !== urlInput.trim()
    ) {
      lastSubmittedUrl.current = urlInput.trim();
      onYouTubeUrl(urlInput.trim(), oembedResult.title, oembedResult.thumbnail_url);
    }
  }, [oembedResult, urlInput, onYouTubeUrl]);

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        setError('Only MP3 and WAV files are supported.');
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Maximum ${MAX_SIZE_MB}MB.`);
        return;
      }
      onFileChange(f);
    },
    [onFileChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || mode !== 'file') return;
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [disabled, mode, validateAndSet],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  const handleModeSwitch = useCallback(
    (newMode: InputMode) => {
      if (disabled || newMode === mode) return;
      setMode(newMode);
      setError(null);
      setUrlInput('');
      lastSubmittedUrl.current = '';
      onClear();
    },
    [disabled, mode, onClear],
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUrlInput(value);
      setError(null);

      // If user clears the field, clear the song
      if (!value.trim()) {
        lastSubmittedUrl.current = '';
        onClear();
        return;
      }

      // Validate URL format on change (show error only for clearly wrong URLs)
      if (value.trim().length > 10 && !isValidYouTubeUrl(value)) {
        setError('Enter a valid YouTube URL (youtube.com/watch or youtu.be)');
      }
    },
    [onClear],
  );

  const isFileSong = song?.type === 'file';
  const isYouTubeSong = song?.type === 'youtube';

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      {!disabled && (
        <div className="flex rounded-lg bg-gray-900 p-0.5">
          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'file'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => handleModeSwitch('file')}
          >
            Upload File
          </button>
          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'youtube'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => handleModeSwitch('youtube')}
          >
            YouTube Link
          </button>
        </div>
      )}

      {mode === 'file' ? (
        /* File upload mode */
        <div
          className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-950/30'
              : isFileSong
                ? 'border-green-500/50 bg-green-950/20'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
          } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            className="sr-only"
            onChange={handleChange}
            disabled={disabled}
          />
          <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
          {isFileSong ? (
            <div>
              <p className="text-white font-medium truncate">{song.file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(song.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              {!disabled && (
                <button
                  className="mt-2 text-xs text-gray-500 hover:text-gray-300 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                    setError(null);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-500">
                Drop an audio file here or{' '}
                <span className="text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">MP3 or WAV, max 50MB</p>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        /* YouTube URL mode */
        <div
          className={`relative rounded-xl border-2 p-6 transition-colors ${
            isYouTubeSong
              ? 'border-green-500/50 bg-green-950/20'
              : 'border-gray-700 bg-gray-900/50'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <p className="text-sm font-medium text-gray-400 mb-3">{label}</p>

          <input
            type="text"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Paste a YouTube URL..."
            value={urlInput}
            onChange={handleUrlChange}
            disabled={disabled}
          />

          {/* Loading state */}
          {oembedLoading && urlInput && isValidYouTubeUrl(urlInput) && (
            <p className="mt-2 text-xs text-gray-500">Fetching video info...</p>
          )}

          {/* YouTube preview */}
          {isYouTubeSong && song.title && (
            <div className="mt-3 flex items-start gap-3">
              {song.thumbnailUrl && (
                <img
                  src={song.thumbnailUrl}
                  alt=""
                  className="w-20 h-15 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">
                  {song.title}
                </p>
                <span className="inline-block mt-1 rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                  YouTube source (~128kbps)
                </span>
              </div>
            </div>
          )}

          {/* Clear button */}
          {isYouTubeSong && !disabled && (
            <button
              className="mt-2 text-xs text-gray-500 hover:text-gray-300 underline"
              onClick={() => {
                setUrlInput('');
                lastSubmittedUrl.current = '';
                onClear();
                setError(null);
              }}
            >
              Remove
            </button>
          )}

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
