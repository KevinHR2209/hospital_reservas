import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReservarPage from './pages/ReservarPage'
import AdminPage from './pages/AdminPage'
import CancelarPage from './pages/CancelarPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="reservar" element={<ReservarPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="cancelar/:token" element={<CancelarPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
