import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import manifest from '../partsManifest.json'
import { S, select, setUI } from '../store'

export const MODEL_URL = `${import.meta.env.BASE_URL}models/headset-prepared.glb`
// Per-role explode windows inside E in [0,1] -> staggered, deterministic, fully reversible.
const WIN = { Headband: [0, .35], Yoke: [.1, .45], 'Hinge pin': [.15, .5], 'Frame ring': [.3, .65], Earcup: [.3, .6], 'Side panel': [.4, .8], 'Ear cushion': [.4, .8], 'Pivot stub': [.6, 1] }
const FOCUS = { 3: ['Ear cushion', 'Earcup', 'Frame ring', 'Side panel'], 4: ['Yoke', 'Hinge pin', 'Pivot stub', 'Headband'] }
const sm = (t) => t * t * (3 - 2 * t)
const clamp = (v) => Math.min(1, Math.max(0, v))
const key = (n) => n.replace(/ /g, '_') // GLTFLoader sanitises whitespace in node names
export const REG = {} // component registry: key -> { obj, orig, exp, role, info, mat }
export const PARTS = manifest.parts.map((p) => ({ ...p, key: key(p.name) }))
const LABELLED = PARTS.filter((p) => p.side !== 'R' && p.name !== 'Pivot stub L back')

export default function Headphone() {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef(), labels = useRef({})
  useLayoutEffect(() => {
    PARTS.forEach((info) => {
      const obj = scene.getObjectByName(info.key)
      if (!obj) { console.error('Missing part in GLB:', info.key); return }
      const mat = obj.material.clone(); mat.envMapIntensity = 1.5; obj.material = mat
      REG[info.key] = { obj, info, role: info.role, mat, op: 1, em: 0,
        orig: obj.position.clone(), origRot: obj.quaternion.clone(), origScale: obj.scale.clone(),
        exp: new THREE.Vector3(...info.exploded) }
    })
    return () => { Object.keys(REG).forEach((k) => delete REG[k]) }
  }, [scene])

  useFrame((state, dt) => {
    const E = THREE.MathUtils.lerp(S.E, S.manual, S.override)
    const focus = FOCUS[S.scene]
    for (const k in REG) {
      const r = REG[k], [a, b] = WIN[r.role]
      r.obj.position.lerpVectors(r.orig, r.exp, sm(clamp((E - a) / (b - a))))
      let op = 1
      if (S.selected) op = k === S.selected ? 1 : 0.1
      else if (focus) op = focus.includes(r.role) ? 1 : 0.2
      r.op = THREE.MathUtils.damp(r.op, op, 6, dt)
      r.mat.opacity = r.op
      const tr = r.op < 0.995
      if (r.mat.transparent !== tr) { r.mat.transparent = tr; r.mat.needsUpdate = true }
      r.em = THREE.MathUtils.damp(r.em, k === S.selected ? 0.12 + 0.05 * Math.sin(state.clock.elapsedTime * 3) : 0, 8, dt)
      r.mat.emissive.setRGB(0.1 * r.em, 0.45 * r.em, 1 * r.em)
      const l = labels.current[k]
      if (l && l.g && l.el) { l.g.position.copy(r.obj.position); l.el.style.opacity = S.selected ? 0 : clamp((E - 0.75) * 4) }
    }
    // idle spin only in hero/final; elsewhere it eases to the nearest full turn so scroll framing stays deterministic
    if ((S.scene === 0 || S.scene === 7) && !S.paused && !S.dragging && !S.selected) S.auto += dt * 0.22
    else S.auto = THREE.MathUtils.damp(S.auto, Math.round(S.auto / (Math.PI * 2)) * Math.PI * 2, 3, dt)
    const g = group.current
    g.rotation.y = S.spin + S.userY + S.auto
    g.scale.setScalar(0.8 + 0.2 * sm(S.intro))
  })

  return (
    <group ref={group}>
      <primitive object={scene}
        onClick={(e) => { e.stopPropagation(); if (!S.moved && REG[e.object.name]) { select(e.object.name); setUI({ paused: S.paused }) } }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }} />
      {LABELLED.map((p) => (
        <group key={p.key} ref={(g) => { if (g) labels.current[p.key] = { ...(labels.current[p.key] || {}), g } }}>
          <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="plabel" ref={(el) => { if (el) labels.current[p.key] = { ...(labels.current[p.key] || {}), el } }}>{p.role}</div>
          </Html>
        </group>
      ))}
    </group>
  )
}
useGLTF.preload(MODEL_URL)
