import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Hospital Reservas">
            <rect width="28" height="28" rx="8" fill="var(--color-primary)" />
            <path d="M14 6v16M6 14h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>Hospital</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Inicio</Link>
          <Link to="/reservar" className={pathname === '/reservar' ? 'active' : ''}>Reservar hora</Link>
          <Link to="/admin" className={pathname === '/admin' ? 'active' : ''}>Administración</Link>
        </div>
      </div>
    </nav>
  )
}
