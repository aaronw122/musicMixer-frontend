import { useRef, useCallback, useState } from 'react';

type Props = {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = ['.mp3', '.wav'];

export function SongUpload({ label, file, onFileChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [disabled, validateAndSet],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragOver
          ? 'border-blue-400 bg-blue-950/30'
          : file
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
      {file ? (
        <div>
          <p className="text-white font-medium truncate">{file.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(file.size / (1024 * 1024)).toFixed(1)} MB
          </p>
          {!disabled && (
            <button
              className="mt-2 text-xs text-gray-500 hover:text-gray-300 underline"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
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
            Drop an audio file here or <span className="text-blue-400 underline">browse</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">MP3 or WAV, max 50MB</p>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
