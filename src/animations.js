import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { S, setUI, select } from './store'
import { CUTS } from './scenes'
gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(0) // keep tween timing real-time on slow devices

// Single master timeline (0..100). Scroll scrubs it; it is the ONLY writer of S.E / S.cam / S.spin.
// Buttons write S.manual / S.override instead, so the two never fight over the same property.
export function buildMasterTimeline(trigger) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let last = 0
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : 1,
      onUpdate: (self) => {
        const p = self.progress * 100, sc = CUTS.filter((c) => p >= c).length
        if (sc !== S.scene) { S.scene = sc; setUI({ scene: sc }); if (S.selected) select(null) }
        if (S.override > 0 && Math.abs(self.progress - last) > 0.002) releaseOverride()
        last = self.progress
      } },
  })
  const seg = (t0, t1, vars, target = S, ease = 'power2.inOut') => tl.to(target, { ...vars, duration: t1 - t0, ease }, t0)
  const cam = (t0, t1, c) => seg(t0, t1, c, S.cam)
  tl.set(S, { E: 0 }, 0)
  cam(0, 12, { z: 7 });              seg(0, 12, { spin: 0.4 })
  cam(12, 22, { z: 6.2, y: 0.3 });   seg(12, 22, { spin: 1.0 })
  cam(22, 38, { z: 9.4, y: 0.6, ty: 0.6 }); seg(22, 38, { E: 0.55, spin: 0.5 })
  cam(38, 52, { x: -1.3, y: -0.4, z: 5.6, tx: -1.3, ty: -0.7 }); seg(38, 52, { E: 0.8, spin: 0.3 })
  cam(52, 68, { x: -1.4, y: 0.3, z: 6.4, tx: -1.6, ty: 0.1 });   seg(52, 68, { E: 0.95, spin: 0.5 })
  cam(68, 82, { x: 0, y: 0.4, z: 11, tx: 0, ty: 0.5 });           seg(68, 82, { E: 1, spin: 0.2 })
  cam(82, 90, { z: 10.6 });          seg(82, 90, { E: 1 })
  cam(90, 100, { x: 0, tx: 0, y: 0.2, ty: 0, z: 7 }); seg(90, 100, { E: 0, spin: Math.PI * 4 })
  return tl
}
export const releaseOverride = () => { gsap.to(S, { override: 0, duration: 0.6, overwrite: 'auto' }); setUI({ override: false }) }
export function setExplode(to) {
  S.manual = gsap.utils.interpolate(S.E, S.manual, S.override) // start from what is currently shown
  gsap.to(S, { manual: to, override: 1, duration: 1.6, ease: 'power3.inOut', overwrite: 'auto' })
  setUI({ override: true })
}
export function resetView() {
  select(null)
  gsap.to(S, { userY: 0, duration: 0.9, ease: 'power2.inOut' })
  releaseOverride()
}
export function intro() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  gsap.to(S, { intro: 1, duration: reduce ? 0.01 : 2.4, ease: 'power3.out' })
  gsap.fromTo('.stage', { opacity: 0 }, { opacity: 1, duration: reduce ? 0.01 : 1.8, ease: 'power2.out' })
  gsap.from('.hud-text > *', { y: 30, opacity: 0, duration: reduce ? 0.01 : 1, stagger: 0.2, delay: reduce ? 0 : 0.8, ease: 'power3.out' })
}
