import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { EngineProvider } from './engine/context'
import Window from './components/window'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <EngineProvider>
    <Window/>
  </EngineProvider>
)
