import { Link } from 'react-router-dom';
import { MixProcess } from './MixProcess';
import { TurntableScene } from './turntable';
import type { ProgressEvent, SongInput } from '../types';

const songA: SongInput = {
  type: 'youtube',
  url: 'https://youtu.be/dQw4w9WgXcQ',
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
};

const songB: SongInput = {
  type: 'youtube',
  url: 'https://youtu.be/6yWA5K9zL7k',
  thumbnailUrl: 'https://i.ytimg.com/vi/6yWA5K9zL7k/hqdefault.jpg',
};

const progressByStage: Array<{
  title: string;
  stage: '' | 'is-floating' | 'is-breaking' | 'is-mixing' | 'is-sealed' | 'is-done';
  progress: ProgressEvent;
}> = [
  {
    title: '0. Source decks',
    stage: '',
    progress: { step: 'separating', detail: 'Ready to lift', progress: 0 },
  },
  {
    title: '1. Lift',
    stage: 'is-floating',
    progress: { step: 'separating', detail: 'Lifting tracks', progress: 0.08 },
  },
  {
    title: '2. Break',
    stage: 'is-breaking',
    progress: { step: 'separating', detail: 'Splitting the records', progress: 0.16 },
  },
  {
    title: '3. Mix',
    stage: 'is-mixing',
    progress: { step: 'processing', detail: 'Mixing the records', progress: 0.52 },
  },
  {
    title: '4. Seal',
    stage: 'is-sealed',
    progress: { step: 'rendering', detail: 'Sealing the groove', progress: 0.91 },
  },
  {
    title: '5. Drop',
    stage: 'is-done',
    progress: { step: 'complete', detail: 'Dropping onto the turntable', progress: 1 },
  },
];

const mixedRecord = {
  leftThumbnailUrl: songA.thumbnailUrl,
  rightThumbnailUrl: songB.thumbnailUrl,
};

export function MixProcessPreview() {
  return (
    <main className="mix-preview">
      <header className="mix-preview-header">
        <div>
          <p>Local visual QA</p>
          <h1>Mix Process Stages</h1>
        </div>
        <Link to="/">Back to app</Link>
      </header>

      <section className="mix-preview-grid">
        {progressByStage.map((item) => (
          <article className="mix-preview-card" key={item.title}>
            <h2>{item.title}</h2>
            <MixProcess
              songA={songA}
              songB={songB}
              progress={item.progress}
              sessionId="preview"
              onCancel={() => {}}
              stageOverride={item.stage}
            />
          </article>
        ))}
      </section>

      <section className="mix-preview-player-row">
        <article className="mix-preview-card mix-preview-player-card">
          <h2>6. Player record - placed</h2>
          <TurntableScene
            remixTitle="Your Remix"
            tonearmAngle={0}
            isSpinning={false}
            deckId="preview-idle"
            mixedRecord={mixedRecord}
          />
        </article>
        <article className="mix-preview-card mix-preview-player-card">
          <h2>7. Player record - playing</h2>
          <TurntableScene
            remixTitle="Your Remix"
            tonearmAngle={27}
            isSpinning={true}
            deckId="preview-playing"
            mixedRecord={mixedRecord}
          />
        </article>
      </section>
    </main>
  );
}
