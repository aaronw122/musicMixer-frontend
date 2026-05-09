import { useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { RemixSession } from './components/RemixSession';
import { RemixPage } from './components/RemixPage';
import { ShareButton } from './components/ShareButton';
import soundboardImg from './assets/soundboard.png';

/** Redirect legacy ?listen=<id> links to /remix/:id */
function Home() {
  const [params] = useSearchParams();
  const listenId = params.get('listen');
  if (listenId) {
    return <Navigate to={`/remix/${listenId}`} replace />;
  }
  return <HomeContent />;
}

function HomeContent() {
  const [readySessionId, setReadySessionId] = useState<string | null>(null);

  return (
    <>
      {readySessionId && (
        <div className="absolute right-0 top-0">
          <ShareButton sessionId={readySessionId} />
        </div>
      )}
      <RemixSession onSessionReady={setReadySessionId} />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="relative mb-1 text-center">
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

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/remix/:sessionId" element={<RemixPage />} />
        </Routes>
      </div>
      <footer className="py-6 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-3">
          <a href="/about" className="hover:text-gray-400 transition-colors">About</a>
          <span>·</span>
          <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
        </div>
        <p className="mt-1">&copy; 2026 musicMixer</p>
      </footer>
    </div>
  );
}

export default App;
