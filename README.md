# VANTA — Headphone 3D Experience

Real-time, scroll-driven exploded-view product site. React + Vite + Three.js (React Three Fiber, drei) + GSAP ScrollTrigger.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/ (Vercel-ready, static)
```
Add `?debug` to the URL to expose `window.__S` (animation state) and `window.__REG` (component registry) in the console.

## What it is
8 scroll-scrubbed scenes + final showcase: hero, form, major explosion, ear-cup layers, mounting/hinges, full exploded view, inspection, reassembly, final.
Controls: Explode / Assemble / Pause spin / Reset view / Back to scroll, drag or touch to rotate, click a part or pick it from the list to inspect it (Esc to return).

## Important honesty notes
- The supplied `headset.glb` is "Headset" by **kilianM** (CC BY 4.0), a single fused mesh, not the Sketchfab models named in the original prompts. Attribution is included in the page footer. Keep it.
- It contains **exterior surfaces only**. There are no drivers, battery, PCB, microphone or wiring, and none were invented. The "internal technology" scene was replaced by a "mounting & hinges" scene.
- Part names (Earcup, Frame ring, Side panel, Yoke, Hinge pin, Pivot stub …) are **inferred from geometry and position**; the source has no labels. Rename them in `scripts/prepare_model.py` if you know better.
- No audio/battery/price specifications are shown because none exist in the source.

## Asset pipeline (`npm run prepare-model`)
`scripts/prepare_model.py` (Python 3, numpy, scipy, Pillow) reads `public/models/headset.glb` and:
1. bakes the node transform chain, centres and scales the model to 3.2 units tall;
2. welds vertices by position (index-based splitting gives 115 UV-seam shards; position-welding gives the real 17 parts);
3. re-pivots every part to its own centre and writes `public/models/headset-prepared.glb` (2.3 MB, textures 4096→2048);
4. writes `src/partsManifest.json`: assembled + exploded transform per part.
Original file kept at `public/models/headset.glb`. No Blender needed.

## Animation architecture
- `src/store.js` holds a plain mutable object `S`; Three.js reads it every frame (no React re-renders during animation).
- `src/animations.js`: ONE master GSAP timeline (0–100) scrubbed by ScrollTrigger. It is the only writer of `S.E` (explode), `S.cam`, `S.spin`.
- Buttons write `S.manual` / `S.override` instead, blended with the scroll value, so scroll and buttons never fight. Scrolling releases the override.
- `src/three/Headphone.jsx`: registry stores each part's original transform; per-role stagger windows turn the single explode value into independent part motion. At E = 0 positions equal the stored originals exactly (measured error 0).
- Cleanup: `gsap.context().revert()` on unmount; StrictMode-safe.

## Structure
`src/three/` model, stage, lighting, camera rig · `src/animations.js` timeline · `src/components.jsx` UI · `src/scenes.js` copy · `src/styles/global.css`.

## Performance
2.3 MB GLB, 2048 textures, one persistent canvas, DPR capped (1.25 mobile / 1.75 desktop), no shadows, procedural environment (no HDR download). Ideas not done: Draco/Meshopt, KTX2 textures.

## Testing performed (headless Chromium, software WebGL)
Production build; no page errors; each scene rendered; reverse scroll to top returns to assembled; Explode/Assemble buttons; part selection + info panel; mobile viewport renders. **Not tested:** real GPUs, real phones, Safari/Firefox, frame rates.

## Known limitations
Google Fonts load from CDN (system fallback otherwise). Mobile layout is functional but least polished. Camera framing was tuned at 1280×760 and 390×780 only.
