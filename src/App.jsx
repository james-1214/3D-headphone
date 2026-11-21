import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Stage from './three/Stage.jsx'
import { Loading, Boundary, Navbar, Hud, Controls, PartsList, InfoPanel } from './components.jsx'
import { buildMasterTimeline, intro } from './animations'
import { S, select } from './store'
import { useProgress } from '@react-three/drei'

export default function App() {
  const story = useRef(), { active, progress } = useProgress(), started = useRef(false)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => { buildMasterTimeline(story.current) })
    return () => ctx.revert() // kills the timeline and its ScrollTrigger (safe under StrictMode)
  }, [])
  useEffect(() => { if (!active && progress >= 100 && !started.current) { started.current = true; intro() } }, [active, progress])
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && select(null)
    addEventListener('keydown', esc); return () => removeEventListener('keydown', esc)
  }, [])
  // pointer drag = rotate the model (vertical touch gestures still scroll the page)
  const drag = useRef(null)
  const down = (e) => { drag.current = e.clientX; S.moved = false }
  const move = (e) => { if (drag.current == null) return; const dx = e.clientX - drag.current; if (Math.abs(dx) > 3) { S.dragging = true; S.moved = true } if (S.dragging) { S.userY += dx * 0.008; drag.current = e.clientX } }
  const up = () => { drag.current = null; S.dragging = false; setTimeout(() => { S.moved = false }, 0) }
  return (
    <div id="top">
      <Loading /><Navbar />
      <div className="stage-wrap" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
        <Boundary><Stage /></Boundary>
      </div>
      <Hud /><Controls /><PartsList /><InfoPanel />
      <main>
        <div ref={story} className="story"><span id="story-engineering" style={{ top: '35%' }} /><span id="story-explore" style={{ top: '70%' }} /></div>
        <section id="final" className="final">
          <div className="final-in">
            <div className="mono kicker">Final showcase</div>
            <h2>EVERY COMPONENT. ONE EXPERIENCE.</h2>
            <p>Drag the product above to turn it a full 360°. Use Explode to take it apart again at any time.</p>
            <ul className="facts mono"><li><b>17</b> modelled parts</li><li><b>≈39.9k</b> triangles</li><li><b>2</b> PBR textures</li><li><b>Real-time</b> WebGL</li></ul>
            <button className="cta" onClick={() => document.getElementById('top').scrollIntoView({ behavior: 'smooth' })}>Explore again</button>
            <p className="credit mono">3D model “Headset” by <a href="https://sketchfab.com/3d-models/headset-dc79d4543a634103a12c556998de8b43" rel="noopener">kilianM</a>, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>. Modified: split into parts, re-pivoted, textures resized.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
