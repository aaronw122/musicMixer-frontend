---
title: "Vinyl Split-Meld Animation"
author: "human:aaron"
version: 1
created: 2026-05-05
---

# Vinyl Split-Meld Animation

Rework the merge animation so it shows one vinyl disc split down the middle — one half for each song's album art — that melts together like wax as the remix progresses.

## WANT

A single vinyl record displayed as a **50/50 split**:
- **Left half:** Song A's album art (instrumental source)
- **Right half:** Song B's album art (vocal source)

As remix progress goes from 0% → 100%, the vertical seam between the two halves **melts like wax** — thick, viscous, organic — until the two halves are fully unified into one record.

This replaces the current overlay/crossfade approach in `VinylMergeAnimation` and `AlbumMeldCanvas`.

## DON'T

- **No ghosting or transparency.** Both halves must always be fully opaque. You should never see one side through the other.
- **No overlay/crossfade.** The current approach (two records fading into each other, gooey blob merge, opacity-based blending) is explicitly what we're moving away from.
- **No separate moving objects.** This should always look like ONE disc from the start — not two records sliding together.

## LIKE

- **Split-color vinyl records** — real-world records that are half one color, half another. That's the starting visual.
- **Lava lamp / wax melt aesthetic** — thick, viscous, slow-moving. The seam should feel physical, like heated wax bleeding across a boundary. Not digital, not clean.

## FOR

- musicMixer frontend, React + TypeScript + Vite
- Plays during remix processing on the DJ board
- Driven by remix progress (0–100%), same timing integration as the current `VinylMergeAnimation`
- Must work with actual album art images (YouTube thumbnails or uploaded file previews)

## ENSURE

- **At 0% progress:** Clean 50/50 vertical split. Left half shows Song A's album art, right half shows Song B's album art. Crisp boundary.
- **At 100% progress:** Seam is completely gone. Disc looks like one unified record — a natural blend/marble of both album arts.
- **Mid-progress:** The wax-melt boundary is visible, organic, and clearly progressing. No sudden jumps.
- **No ghosting at any point.** At 30% progress, the left 30% should be clearly Song A, the right 70% clearly Song B, with only the boundary zone showing the meld.
- **Progress-driven:** Same integration pattern as current — component receives a `progress` prop (0–1).

## TRUST

- [autonomous] Implementation approach (SVG filters, WebGL shader, Canvas 2D, CSS — whatever works best)
- [autonomous] Exact timing curves and easing for the wax-melt effect
- [autonomous] How to handle the center label / spindle hole area
- [autonomous] How to achieve the "wax melt" boundary (turbulence displacement, noise-based masking, etc.)
- [autonomous] Whether to keep, modify, or replace `AlbumMeldCanvas` WebGL infrastructure
- [autonomous] Fallback behavior for browsers without WebGL
- [autonomous] How to crop/fit album art into the vinyl disc shape
