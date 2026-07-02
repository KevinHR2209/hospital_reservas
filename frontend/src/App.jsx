import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ReservarPage from './pages/ReservarPage'
import AdminPage from './pages/AdminPage'
import CancelarPage from './pages/CancelarPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reservar" element={<ReservarPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/cancelar/:token" element={<CancelarPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
