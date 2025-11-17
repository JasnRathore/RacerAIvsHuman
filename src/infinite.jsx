import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RacingGame from './InfinteRacingGame'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RacingGame />
  </StrictMode>,
)
