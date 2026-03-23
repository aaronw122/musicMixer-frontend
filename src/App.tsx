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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="relative mb-1 text-center">
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
          <h1 className="text-4xl font-bold tracking-tight text-white">musicMixer</h1>
          <p className="mt-3 text-lg text-gray-400">
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
      <footer className="py-6 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-3">
          <a href="/about.html" className="hover:text-gray-400 transition-colors">About</a>
          <span>·</span>
          <a href="/terms.html" className="hover:text-gray-400 transition-colors">Terms</a>
          <span>·</span>
          <a href="/privacy.html" className="hover:text-gray-400 transition-colors">Privacy</a>
        </div>
        <p className="mt-1">&copy; 2026 musicMixer</p>
      </footer>
    </div>
  );
}

export default App;
