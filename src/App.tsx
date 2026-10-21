import { Navigate, Route, Routes } from 'react-router-dom'
import KindStart from './schermen/KindStart.tsx'
import OuderStart from './schermen/OuderStart.tsx'
import WieSpeelt from './schermen/WieSpeelt.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WieSpeelt />} />
      <Route path="/kind/:id" element={<KindStart />} />
      <Route path="/ouder" element={<OuderStart />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
