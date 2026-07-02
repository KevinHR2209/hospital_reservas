import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Hospital Reservas">
            <rect width="28" height="28" rx="8" fill="var(--color-primary)"/>
            <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span>Hospital Reservas</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}><span>Inicio</span></Link>
          <Link to="/reservar" className={isActive('/reservar')}><span>Reservar hora</span></Link>
          <Link to="/agenda" className={isActive('/agenda')}><span>Agenda del día</span></Link>
          <Link to="/admin" className={isActive('/admin')}><span>Administración</span></Link>
        </div>
      </div>
    </nav>
  )
}
