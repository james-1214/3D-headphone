import { useSyncExternalStore } from 'react'
// Mutable animation state: written by GSAP / interaction, read every frame by Three.js (no React re-renders).
export const S = {
  cam: { x: 0, y: 0.15, z: 8.2, tx: 0, ty: 0, tz: 0 },
  E: 0,          // explode value driven by the scroll timeline (0 = assembled, 1 = fully exploded)
  manual: 0,     // explode value driven by the Explode / Assemble buttons
  override: 0,   // 0 = scroll owns explode, 1 = buttons own it (blended by GSAP)
  spin: 0,       // scroll-driven rotation
  userY: 0,      // pointer/touch-driven rotation
  auto: 0,       // idle auto-rotation accumulator
  intro: 0, dragging: false, moved: false,
  scene: 0, selected: null, paused: false,
}
let ui = { scene: 0, selected: null, paused: false, override: false }
const subs = new Set()
export const setUI = (p) => { ui = { ...ui, ...p }; subs.forEach((f) => f()) }
export const useUI = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => ui)
export const select = (key) => { S.selected = key; setUI({ selected: key }) }
