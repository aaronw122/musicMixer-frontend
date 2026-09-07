# Contributing — musicMixer Frontend

## PR description structure

Every non-trivial PR uses this structure. Keep **What** and **Why** to ~150 words each — concrete changes and reasoning only. No commit SHAs, ticket IDs, or rollout history in the description; those belong in commits.

### What

What this PR does. Describe concrete behavior and UI changes, not a list of files.

### Why

Why this change exists and why this approach over alternatives. If other approaches were considered, name them and say why this one wins (fewer changes, simpler state, no backend churn, etc.). For bug fixes, identify the root cause — don't just describe the patch.

### Before / After

This is a UI. **Any change a user can see MUST include before/after visual evidence** — screenshots or a short video, desktop + mobile where layout differs. A "small" CSS/layout tweak is exactly the kind of change that needs a clip. Non-visual changes (build config, API client refactor) get a one-line note of what to verify instead.

### Test results

List the commands you ran and their outcome (e.g. `bun run build`, manual smoke test against `http://localhost:8000`). No screenshots of passing output required.

## Checklist

- [ ] What / Why each ≤150 words
- [ ] Before/after visual evidence for any user-visible change
- [ ] `bun run build` passes
- [ ] Manual smoke test against a running backend
- [ ] Follows existing patterns in `frontend/CLAUDE.md`
