import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { RemixSession } from './components/RemixSession';
import { RemixPage } from './components/RemixPage';
import soundboardImg from './assets/soundboard.png';

/** Redirect legacy ?listen=<id> share links to /remix/:id */
function HomeWithRedirect() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const listenId = params.get('listen');

  useEffect(() => {
    if (listenId) {
      navigate(`/remix/${listenId}`, { replace: true });
    }
  }, [listenId, navigate]);

  if (listenId) return null; // Will redirect
  return <RemixSession />;
}

function App() {
  return (
    <div
      className="min-h-screen text-gray-100"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="relative mb-6 text-center">
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

        <Routes>
          <Route path="/" element={<HomeWithRedirect />} />
          <Route path="/remix/:sessionId" element={<RemixPage />} />
        </Routes>
      </div>
      <footer className="py-6 text-center text-xs text-amber-200/25">
        <div className="flex items-center justify-center gap-3">
          <a href="/about" className="hover:text-amber-200/50 transition-colors min-h-[44px] inline-flex items-center">About</a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-amber-200/50 transition-colors min-h-[44px] inline-flex items-center">Terms</a>
          <span aria-hidden="true">·</span>
          <a href="/privacy" className="hover:text-amber-200/50 transition-colors min-h-[44px] inline-flex items-center">Privacy</a>
        </div>
        <p className="mt-1">&copy; 2026 musicMixer</p>
      </footer>
    </div>
  );
}

export default App;
