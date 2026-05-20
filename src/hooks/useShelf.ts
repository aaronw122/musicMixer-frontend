import { useCallback, useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import { addShelfRecord, fetchShelfRecords } from '../api/client';
import type { AppAction, ShelfRecord, ShelfSelectionState } from '../types';

/** Placeholder records shown when the backend shelf API is unavailable. */
const PLACEHOLDER_RECORDS: ShelfRecord[] = [
  {
    id: 'house-of-pain-jump-around',
    title: 'Jump Around',
    artist: 'House of Pain',
    sleeve_image_url: 'https://i.ytimg.com/vi/XhzpxjuwZy0/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=XhzpxjuwZy0',
    thumbnail_url: 'https://i.ytimg.com/vi/XhzpxjuwZy0/hqdefault.jpg',
  },
  {
    id: 'kool-and-the-gang-get-down-on-it',
    title: 'Get Down On It',
    artist: 'Kool & The Gang',
    sleeve_image_url: 'https://i.ytimg.com/vi/qchPLaiKocI/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=qchPLaiKocI',
    thumbnail_url: 'https://i.ytimg.com/vi/qchPLaiKocI/hqdefault.jpg',
  },
  {
    id: 'mf-doom-gazillion-ear',
    title: 'Gazzillion Ear',
    artist: 'MF DOOM',
    sleeve_image_url: 'https://i.ytimg.com/vi/DUZ7-C0wPF4/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=DUZ7-C0wPF4',
    thumbnail_url: 'https://i.ytimg.com/vi/DUZ7-C0wPF4/hqdefault.jpg',
  },
  {
    id: 'pitbull-international-love',
    title: 'International Love',
    artist: 'Pitbull ft. Chris Brown',
    sleeve_image_url: 'https://i.ytimg.com/vi/CdXesX6mYUE/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=CdXesX6mYUE',
    thumbnail_url: 'https://i.ytimg.com/vi/CdXesX6mYUE/hqdefault.jpg',
  },
  {
    id: 'grateful-dead-althea',
    title: 'Althea',
    artist: 'Grateful Dead',
    sleeve_image_url: 'https://i.ytimg.com/vi/ZZNZgtj26Fk/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=ZZNZgtj26Fk',
    thumbnail_url: 'https://i.ytimg.com/vi/ZZNZgtj26Fk/hqdefault.jpg',
  },
  {
    id: 'roy-orbison-you-got-it',
    title: 'You Got It',
    artist: 'Roy Orbison',
    sleeve_image_url: 'https://i.ytimg.com/vi/QNAVrQ96mpA/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=QNAVrQ96mpA',
    thumbnail_url: 'https://i.ytimg.com/vi/QNAVrQ96mpA/hqdefault.jpg',
  },
];

const initialSelectionState: ShelfSelectionState = {
  step: 'vocals',
  vocalsRecord: null,
  instrumentalsRecord: null,
  previewRecord: null,
};

export function useShelf() {
  const [records, setRecords] = useState<ShelfRecord[]>([]);
  const [selectionState, setSelectionState] =
    useState<ShelfSelectionState>(initialSelectionState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecords = await fetchShelfRecords();
      setRecords(nextRecords.length > 0 ? nextRecords : PLACEHOLDER_RECORDS);
    } catch {
      // Backend shelf not available — use placeholder records
      setRecords(PLACEHOLDER_RECORDS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const previewRecord = useCallback((record: ShelfRecord) => {
    setSelectionState((current) => ({ ...current, previewRecord: record }));
  }, []);

  const confirmSelection = useCallback(() => {
    setSelectionState((current) => {
      if (!current.previewRecord) return current;

      if (current.step === 'vocals') {
        return {
          step: 'instrumentals',
          vocalsRecord: current.previewRecord,
          instrumentalsRecord: current.instrumentalsRecord,
          previewRecord: current.instrumentalsRecord,
        };
      }

      return {
        ...current,
        instrumentalsRecord: current.previewRecord,
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setSelectionState((current) => ({
      step: 'vocals',
      vocalsRecord: current.vocalsRecord,
      instrumentalsRecord: null,
      previewRecord: current.vocalsRecord,
    }));
  }, []);

  const resetSelection = useCallback(() => {
    setSelectionState(initialSelectionState);
  }, []);

  const addRecord = useCallback(async (youtubeUrl: string) => {
    setError(null);

    try {
      const createdRecord = await addShelfRecord(youtubeUrl);
      setRecords((current) => [
        ...current.filter((record) => record.id !== createdRecord.id),
        createdRecord,
      ]);
      setSelectionState((current) => ({ ...current, previewRecord: createdRecord }));
      return createdRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add record';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const populateDecks = useCallback(
    (dispatch: Dispatch<AppAction>) => {
      if (!selectionState.vocalsRecord || !selectionState.instrumentalsRecord) {
        return false;
      }

      dispatch({
        type: 'SET_YOUTUBE_URL_A',
        url: selectionState.vocalsRecord.youtube_url,
        title: selectionState.vocalsRecord.title,
        thumbnailUrl: selectionState.vocalsRecord.thumbnail_url,
      });
      dispatch({
        type: 'SET_YOUTUBE_URL_B',
        url: selectionState.instrumentalsRecord.youtube_url,
        title: selectionState.instrumentalsRecord.title,
        thumbnailUrl: selectionState.instrumentalsRecord.thumbnail_url,
      });
      return true;
    },
    [selectionState.instrumentalsRecord, selectionState.vocalsRecord],
  );

  return {
    records,
    selectionState,
    isLoading,
    error,
    refreshRecords: loadRecords,
    previewRecord,
    confirmSelection,
    goBack,
    resetSelection,
    addRecord,
    populateDecks,
  };
}
