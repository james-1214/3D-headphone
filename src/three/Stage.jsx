import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import Headphone, { REG } from './Headphone.jsx'
import { S } from '../store'

const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches
const v = new THREE.Vector3(), look = new THREE.Vector3()

function Rig() {
  const { camera, size } = useThree()
  useFrame((_, dt) => {
    const asp = size.width / size.height, k = asp < 1 ? 1 + (1 - asp) * 1.7 : 1
    let { x, y, z, tx, ty, tz } = S.cam
    const eb = S.override * S.manual; z += 3.2 * eb; y += 0.3 * eb // pull back when buttons explode the model
    z *= k
    const sel = S.selected && REG[S.selected]
    if (sel) { sel.obj.getWorldPosition(v); tx = v.x; ty = v.y; tz = v.z; x = v.x * 0.6; y = v.y + 0.25; z = 4.2 * Math.min(k, 1.5) }
    const l = sel ? 3.5 : 2.2
    camera.position.set(THREE.MathUtils.damp(camera.position.x, x, l, dt), THREE.MathUtils.damp(camera.position.y, y, l, dt), THREE.MathUtils.damp(camera.position.z, z, l, dt))
    look.set(THREE.MathUtils.damp(look.x, tx, l, dt), THREE.MathUtils.damp(look.y, ty, l, dt), THREE.MathUtils.damp(look.z, tz, l, dt))
    camera.lookAt(look)
  })
  return null
}

export default function Stage() {
  return (
    <Canvas className="stage" dpr={mobile ? [1, 1.25] : [1, 1.75]} camera={{ fov: 35, position: [0, 0.15, 9], near: 0.1, far: 60 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15 }}>
      <Rig />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#dfe9ff" />
      <directionalLight position={[-5, 1, -4]} intensity={3} color="#2f7bff" />
      <directionalLight position={[5, -1, -4]} intensity={2} color="#5ee7ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} position={[0, 5, 3]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-6, 1, 2]} scale={[2, 8, 1]} color="#4d8dff" />
        <Lightformer form="rect" intensity={3} position={[6, 0, -3]} scale={[2, 8, 1]} color="#5ee7ff" />
        <Lightformer form="ring" intensity={2} position={[0, -3, -5]} scale={6} color="#ffffff" />
      </Environment>
      <Suspense fallback={null}><Headphone /></Suspense>
    </Canvas>
  )
}
