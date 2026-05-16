import { LoaderCircle, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
  onAddRecord: (youtubeUrl: string) => Promise<unknown>;
};

type OEmbedPreview = {
  title: string;
  thumbnail_url?: string;
};

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.|music\.)?youtu(be\.com\/watch\?v=|\.be\/)[A-Za-z0-9_-]+/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_PATTERN.test(url.trim());
}

export function AddRecordForm({ onAddRecord }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<OEmbedPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isValidYouTubeUrl(url)) {
      setPreview(null);
      setIsPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsPreviewLoading(true);
    setError(null);

    fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.title) {
          setPreview({ title: data.title, thumbnail_url: data.thumbnail_url });
        } else {
          setPreview(null);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setPreview(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsPreviewLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, url]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUrl = url.trim();

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError('Enter a valid YouTube URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddRecord(trimmedUrl);
      setUrl('');
      setPreview(null);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="add-record-blank-jacket"
        onClick={() => setIsOpen(true)}
        aria-label="Add a YouTube record to the shelf"
      >
        <span className="add-record-blank-jacket__plus">
          <Plus size={22} />
        </span>
      </button>
    );
  }

  return (
    <form className="add-record-form" onSubmit={handleSubmit}>
      <div className="add-record-form__row">
        <label className="sr-only" htmlFor="shelf-youtube-url">
          YouTube URL
        </label>
        <input
          id="shelf-youtube-url"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          placeholder="Paste a YouTube URL..."
          className="add-record-form__input"
          disabled={isSubmitting}
        />
        <button
          type="button"
          className="shelf-icon-button"
          onClick={() => {
            setIsOpen(false);
            setUrl('');
            setError(null);
          }}
          aria-label="Close add record form"
          disabled={isSubmitting}
        >
          <X size={16} />
        </button>
      </div>

      {isPreviewLoading && (
        <p className="add-record-form__status">
          <LoaderCircle size={14} className="add-record-form__spinner" />
          Fetching video info...
        </p>
      )}

      {preview && (
        <div className="add-record-form__preview">
          {preview.thumbnail_url && <img src={preview.thumbnail_url} alt="" />}
          <span>{preview.title}</span>
        </div>
      )}

      {error && <p className="add-record-form__error">{error}</p>}

      <button
        type="submit"
        className="shelf-control-button shelf-control-button--primary"
        disabled={isSubmitting || !url.trim()}
      >
        {isSubmitting ? <LoaderCircle size={16} className="add-record-form__spinner" /> : <Plus size={16} />}
        <span>Add record</span>
      </button>
    </form>
  );
}
