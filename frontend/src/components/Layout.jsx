import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="container header-inner">
          <NavLink to="/" className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Hospital Reservas">
              <rect width="32" height="32" rx="8" fill="#0284c7"/>
              <rect x="14" y="6" width="4" height="20" rx="2" fill="white"/>
              <rect x="6" y="14" width="20" height="4" rx="2" fill="white"/>
            </svg>
            <span>Hospital Reservas</span>
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>Inicio</NavLink>
            <NavLink to="/reservar">Reservar hora</NavLink>
            <NavLink to="/admin">Administración</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <p>© 2026 Hospital Reservas — Cuida tu salud</p>
        </div>
      </footer>
    </div>
  )
}
