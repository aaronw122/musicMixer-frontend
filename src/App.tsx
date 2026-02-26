import { RemixSession } from './components/RemixSession';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">musicMixer</h1>
          <p className="mt-3 text-lg text-gray-400">
            Upload two songs. Describe your mashup. AI does the rest.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            musicMixer takes the vocals from one song and layers them over the other song's beat.
          </p>
        </header>
        <RemixSession />
      </div>
    </div>
  );
}

export default App;
