---
title: "Two-Page Routing"
author: "human:aaron + claude"
version: 1
created: 2026-05-08
---

# Two-Page Routing

Split the app into two pages so the browser back button works naturally: song selection on home, processing/playback on a separate route.

## Routes

| Route | What renders | Current phases |
|---|---|---|
| `/` | Home — DJBoard with InputDecks + MixButton | `idle`, `uploading`, `submitting` |
| `/remix/:sessionId` | Processing + Playback — MergeTransition then RemixPlayer | `processing`, `ready`, `error` |

## How it works

1. **Add `react-router-dom`** — lightest standard option, handles history/params/guards
2. **Home (`/`)** — Song selection lives here. When the user hits Mix and gets back a `sessionId`, navigate to `/remix/:sessionId`
3. **Remix page (`/remix/:sessionId`)** — Reads sessionId from URL, connects SSE, shows MergeTransition during processing, RemixPlayer when done. If someone lands here directly (shared link), it checks status and shows the right view
4. **`?listen=<id>` links** — Redirect to `/remix/:id` (backwards compat, then remove the old hook)
5. **Back button** — From remix page, back returns to home with songs still populated (form persistence already handles this via IndexedDB/sessionStorage)
6. **State split** — Song selection state stays in the home page component. Remix page only needs the sessionId (from URL) + song data (for thumbnails in the meld animation, passed via route state or re-read from persistence)

## What changes

| File | Change |
|---|---|
| `App.tsx` | Add `BrowserRouter` + route definitions |
| `RemixSession.tsx` | Split into two: home logic stays, processing/ready moves to new component |
| New: `RemixPage.tsx` | Processing + ready + error phases, reads `sessionId` from URL params |
| `useListenMode.ts` | Remove — replaced by `/remix/:id` route |
| `useRemixReducer.ts` | Simplify — home page only needs idle/uploading/submitting states |
| Backend | Add catch-all `/*` → `index.html` for SPA routing (if not already there) |

## What stays the same

- `DJBoard`, `InputDeck`, `MixButton` — unchanged
- `MergeTransition`, `VinylSplitMeld`, `RemixPlayer` — unchanged
- `useRemixProgress` SSE hook — unchanged, just used by `RemixPage` instead
- Form persistence — unchanged, still saves/restores songs on home page
