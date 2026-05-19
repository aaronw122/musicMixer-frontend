# Migrate DJ Board to WebGL (Three.js / React Three Fiber)

## Why

The DJ board currently uses CSS 3D transforms (`rotateX`, `preserve-3d`) for the tilted table perspective. This works visually but creates hit-testing problems — `filter`, `pointer-events: none`, and SVG elements all interact poorly with CSS 3D compositing, requiring workarounds like document-level click listeners with manual coordinate math.

WebGL (via React Three Fiber) renders 3D in a `<canvas>` with GPU-native raycasting for click detection. Filters, shadows, and post-processing are GPU operations that never touch CSS compositing, so they can't break interactivity.

## What it enables

- Draggable crossfader and EQ knobs
- Spinning vinyl records with physics
- Realistic lighting and shadows without CSS filter hacks
- Tonearm interaction (drag to seek)
- Click/hover on any 3D element works natively via raycasting

## Rough approach

1. **Replace `.stage` / `.console` / `.table` CSS 3D** with a React Three Fiber `<Canvas>` scene
2. **Model the DJ table** as a plane with wood texture, tilted in 3D
3. **Turntables and mixer** as 3D meshes (can start with flat planes with textures, upgrade to real geometry later)
4. **Interactive elements** (MIX button, knobs, faders, crossfader) use R3F's `onClick`, `onPointerOver` — raycasting handles hit-testing
5. **HTML overlays** (song titles, progress text) via R3F's `<Html>` component — renders DOM elements anchored to 3D positions

## Dependencies

- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Helpers (Html, OrbitControls, textures, etc.)
- `three` — Core 3D engine

## Priority

Low — current CSS approach works with the document-level listener workaround. Revisit when adding interactive controls (knobs, faders, crossfader) that need drag behavior.
