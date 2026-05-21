import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { RemixSession } from './components/RemixSession';
import { RemixPage } from './components/RemixPage';
import { MixProcessPreview } from './components/MixProcessPreview';
import { useGoatCounter } from './hooks/useGoatCounter';

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
  useGoatCounter();

  return (
    <div className="min-h-screen flex flex-col items-center gap-[18px] px-4 py-8">
      <Routes>
        <Route path="/" element={<HomeWithRedirect />} />
        <Route path="/remix/:sessionId" element={<RemixPage />} />
        <Route path="/mix-process-preview" element={<MixProcessPreview />} />
      </Routes>
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
