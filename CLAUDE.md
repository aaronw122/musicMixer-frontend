# musicMixer — Frontend Client

React-based web client for musicMixer. Users upload two songs, describe a mashup via text prompt, and the app orchestrates AI-powered stem separation, mixing, and playback.

**Status:** Not yet scaffolded. Day 1 uses a static HTML page served by the FastAPI backend (`backend/static/index.html`). This repo gets created on Day 3.

## Repository Structure

TBD — will be scaffolded with Vite + React. Expected layout:

```
frontend/
  src/
    components/    # React components
    api/           # API client / fetch helpers
    App.tsx
    main.tsx
  public/
  index.html
  tailwind.config.*
  vite.config.ts
  tsconfig.json
  package.json
  CLAUDE.md
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React | Scaffolded via Vite |
| Language | TypeScript | Strict mode preferred |
| Styling | Tailwind CSS | Utility-first |
| Build tool | Vite | Dev server on port 5173 |
| Package manager | **bun** | NEVER use npm/npx/yarn/pnpm |
| Testing | TBD | Likely Vitest |

## Key Conventions

- Use `bun` for everything: `bun install`, `bun add`, `bun run dev`, `bun run build`.
- Prefer functional components with hooks.
- Keep components small and focused.
- Colocate API calls in `src/api/` — components should not contain raw `fetch` calls.

## Logging

TBD. Use `console.warn` / `console.error` sparingly in dev. No logging framework planned yet.

## Caching & Storage

No persistent storage of server-side artifacts (session IDs, audio URLs, remix results). Remixes are ephemeral (3-hour TTL on the backend).

**Form input persistence is allowed.** `useFormPersistence` uses IndexedDB for uploaded `File` objects and sessionStorage for YouTube URL inputs so users don't lose their selections on page refresh. All stored data is cleared when a remix completes.

## API Integration

Backend runs at `http://localhost:8000` during development. CORS is already configured for `http://localhost:5173`.

### Endpoints

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| `POST` | `/api/remix` | Submit a remix job | Multipart form: `song_a` (file), `song_b` (file), `prompt` (text) | `{"session_id": "<uuid>"}` |
| `GET` | `/api/remix/{session_id}/audio` | Stream the finished MP3 | — | `audio/mpeg` |
| `GET` | `/api/remix/{session_id}/progress` | SSE progress events (Day 2+) | — | Server-Sent Events |
| `GET` | `/health` | Health check | — | `{"status": "ok"}` |

### Notes

- No auth — single-user proof of concept.
- File uploads use `multipart/form-data`, not JSON.
- The `prompt` field is accepted by the API on Day 1 but ignored until Day 2+.
- SSE progress endpoint arrives on Day 2.

## Testing

TBD. Will likely use Vitest with React Testing Library once the repo is scaffolded.

## Environment Setup

```bash
cd frontend
bun install
bun run dev    # Starts Vite dev server on http://localhost:5173
```

Requires the backend running on `http://localhost:8000`.

## Common Gotchas

- **Package manager:** `bun` only. See parent CLAUDE.md for the full rule.
- **Day 1 has no frontend repo.** The static HTML page lives at `backend/static/index.html`. Do not look for frontend code here on Day 1.
- **CORS:** Backend allows `http://localhost:5173`. If you change the Vite port, update the backend CORS config.
- **File size:** No client-side file size validation yet. Backend may reject large files — check backend constraints before uploading.

## Lessons Learned

_(Add entries here as the frontend is built)_
