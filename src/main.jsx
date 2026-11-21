import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import { S } from './store'
import { REG } from './three/Headphone.jsx'
if ((import.meta.env.DEV || location.search.includes("debug"))) { window.__S = S; window.__REG = REG }
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
