import { useState } from 'react';
import { RemixSession } from './components/RemixSession';
import { ListenView } from './components/ListenView';
import { ShareButton } from './components/ShareButton';
import { useListenMode } from './hooks/useListenMode';
import soundboardImg from './assets/soundboard.png';

function App() {
  const listenMode = useListenMode();
  const [readySessionId, setReadySessionId] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen text-gray-100"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="relative mb-6 text-center">
          {listenMode.mode === 'create' && readySessionId && (
            <div className="absolute right-0 top-0">
              <ShareButton sessionId={readySessionId} />
            </div>
          )}
          <img
            src={soundboardImg}
            alt="Soundboard mixer"
            className="mx-auto mb-4 w-24 sm:w-32 drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold tracking-tight text-amber-50">musicMixer</h1>
          <p className="mt-3 text-lg text-amber-200/60">
            Pick two songs. AI grabs the vocals from one and drops them over instrumentals from the other.
          </p>
        </header>

        {listenMode.mode === 'create' ? (
          <RemixSession onSessionReady={setReadySessionId} />
        ) : (
          <ListenView
            state={listenMode.state}
            onCreateRemix={listenMode.exitListenMode}
          />
        )}
      </div>
      <footer className="py-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <div className="flex items-center justify-center gap-3">
          <a href="/about" className="hover:text-amber-200/50 transition-colors">About</a>
          <span>·</span>
          <a href="/terms" className="hover:text-amber-200/50 transition-colors">Terms</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-amber-200/50 transition-colors">Privacy</a>
        </div>
        <p className="mt-1">&copy; 2026 musicMixer</p>
      </footer>
    </div>
  );
}

export default App;
