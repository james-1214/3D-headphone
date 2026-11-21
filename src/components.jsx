import { Component } from 'react'
import { useProgress } from '@react-three/drei'
import { useUI, S, select, setUI } from './store'
import { SCENES } from './scenes'
import { PARTS } from './three/Headphone.jsx'
import { setExplode, resetView, releaseOverride } from './animations'

export function Loading() {
  const { progress, active } = useProgress(), { error } = useUI()
  return <div className={'loading' + ((!active && progress >= 100) || error ? ' done' : '')} role="status" aria-live="polite">
    <div className="brand">VANTA</div><div className="bar"><i style={{ width: progress + '%' }} /></div><div className="mono">{Math.round(progress)}%</div></div>
}
export class Boundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch() { setUI({ error: true }) }
  render() {
    return this.state.err ? <div className="fallback" role="alert"><h2>3D could not start</h2>
      <p>Your browser or device could not load the 3D scene ({String(this.state.err.message || this.state.err)}). Try a current version of Chrome, Safari or Firefox with WebGL enabled.</p></div> : this.props.children
  }
}
export function Navbar() {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return <header className="nav"><a className="brand" href="#top">VANTA</a>
    <nav aria-label="Primary"><button onClick={() => go('top')}>Product</button><button onClick={() => go('story-engineering')}>Engineering</button><button onClick={() => go('story-explore')}>Explore</button><button onClick={() => go('final')}>Details</button></nav></header>
}
export function Hud() {
  const { scene } = useUI(), s = SCENES[scene]
  return <div className="hud" aria-live="polite"><div className="hud-text" key={scene}>
    <div className="mono kicker">{s.n} / {String(SCENES.length).padStart(2, '0')} — {s.k}</div>
    {scene === 0 ? <h1>{s.h}</h1> : <h2>{s.h}</h2>}<p>{s.p}</p></div>
    {scene === 0 && <div className="scroll-ind mono" aria-hidden="true"><i />Scroll</div>}
    <ol className="dots" aria-hidden="true">{SCENES.map((_, i) => <li key={i} className={i === scene ? 'on' : ''} />)}</ol></div>
}
export function Controls() {
  const { paused, override, scene } = useUI()
  return <div className="controls" role="group" aria-label="Model controls">
    <button onClick={() => setExplode(1)}>Explode</button>
    <button onClick={() => setExplode(0)}>Assemble</button>
    <button onClick={() => { S.paused = !S.paused; setUI({ paused: S.paused }) }} aria-pressed={paused}>{paused ? 'Resume spin' : 'Pause spin'}</button>
    <button onClick={resetView}>Reset view</button>
    {override && <button className="accent" onClick={releaseOverride}>Back to scroll</button>}
    {scene >= 5 && scene <= 6 && <span className="mono hint">Drag to rotate</span>}
  </div>
}
export function PartsList() {
  const { scene, selected } = useUI()
  const items = PARTS.filter((p) => p.side !== 'R' && p.name !== 'Pivot stub L back')
  if (scene < 5 || scene > 6) return null
  return <aside className="parts" aria-label="Parts list"><div className="mono kicker">Parts</div>
    {items.map((p) => <button key={p.key} aria-pressed={selected === p.key} onClick={() => select(selected === p.key ? null : p.key)}>{p.role}</button>)}</aside>
}
export function InfoPanel() {
  const { selected } = useUI(), p = PARTS.find((x) => x.key === selected)
  if (!p) return null
  return <aside className="info" aria-label="Component information"><div className="mono kicker">Selected part</div>
    <h3>{p.name}</h3><p>{p.description}</p>
    <dl className="mono"><dt>Triangles</dt><dd>{p.triangles.toLocaleString()}</dd><dt>Mirrored</dt><dd>{p.side ? 'Yes (L/R pair)' : 'No'}</dd></dl>
    <p className="note">Part names are inferred from geometry and position; the source file has no part labels.</p>
    <button onClick={() => select(null)}>Back to full view</button></aside>
}
