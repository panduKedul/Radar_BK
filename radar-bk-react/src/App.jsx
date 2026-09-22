import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/AdminLayout.jsx'
import Landing from './pages/Landing.jsx'
import Radar from './pages/Radar.jsx'
import Siswa from './pages/Siswa.jsx'
import Tren from './pages/Tren.jsx'
import Kasus from './pages/Kasus.jsx'
import Sosiometri from './pages/Sosiometri.jsx'
import DataPage from './pages/DataPage.jsx'
import Tanya from './pages/Tanya.jsx'
import Prospek from './pages/Prospek.jsx'
import NotFound from './pages/NotFound.jsx'

export const routes = [
  { path: '/', label: 'Beranda' },
  { path: '/radar', label: 'Radar' },
  { path: '/siswa/:id', label: 'Siswa' },
  { path: '/tren', label: 'Tren' },
  { path: '/kasus', label: 'Kasus' },
  { path: '/sosiometri', label: 'Sosiometri' },
  { path: '/data', label: 'Data' },
  { path: '/tanya', label: 'Tanya' },
  { path: '/prospek', label: 'Prospek' },
]

export default function App() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/radar" element={<Radar />} />
        <Route path="/siswa/:id" element={<Siswa />} />
        <Route path="/tren" element={<Tren />} />
        <Route path="/kasus" element={<Kasus />} />
        <Route path="/sosiometri" element={<Sosiometri />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/tanya" element={<Tanya />} />
        <Route path="/prospek" element={<Prospek />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminLayout>
  )
}
