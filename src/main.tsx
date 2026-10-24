import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Lettertypes lokaal meeleveren (alleen Latijns schrift), zodat de app ook offline werkt.
import '@fontsource/baloo-2/latin-600.css'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import './styles/thema.css'
import App from './App.tsx'
import { SessieProvider } from './lib/sessie.tsx'
import { volgNieuweVersie } from './lib/nieuweversie.ts'

volgNieuweVersie()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessieProvider>
        <App />
      </SessieProvider>
    </BrowserRouter>
  </StrictMode>,
)
