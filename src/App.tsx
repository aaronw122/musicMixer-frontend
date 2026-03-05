import { RemixSession } from './components/RemixSession';
import { ListenView } from './components/ListenView';
import { useListenMode } from './hooks/useListenMode';

function App() {
  const listenMode = useListenMode();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">musicMixer</h1>
          {listenMode.mode === 'create' ? (
            <>
              <p className="mt-3 text-lg text-gray-400">
                Upload two songs. Describe your mashup. AI does the rest.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                musicMixer takes the vocals from one song and layers them over the other song's beat.
              </p>
            </>
          ) : (
            <p className="mt-3 text-lg text-gray-400">
              Someone shared a remix with you.
            </p>
          )}
        </header>
        {listenMode.mode === 'create' ? (
          <RemixSession />
        ) : (
          <ListenView
            state={listenMode.state}
            onCreateRemix={listenMode.exitListenMode}
          />
        )}
      </div>
    </div>
  );
}

export default App;
