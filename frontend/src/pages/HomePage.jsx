import { Link } from 'react-router-dom'
import './HomePage.css'

const ESPECIALIDADES = [
  { nombre: 'Medicina General', icono: '🩺', desc: 'Atención primaria y control general' },
  { nombre: 'Cardiología', icono: '❤️', desc: 'Salud del corazón' },
  { nombre: 'Neurología', icono: '🧠', desc: 'Sistema nervioso' },
  { nombre: 'Pediatría', icono: '👶', desc: 'Salud infantil y adolescente' },
  { nombre: 'Psicología', icono: '💬', desc: 'Bienestar emocional' },
  { nombre: 'Kinesiología', icono: '🏃', desc: 'Rehabilitación física' },
  { nombre: 'Nutrición', icono: '🥗', desc: 'Planes alimentarios personalizados' },
  { nombre: 'Dermatología', icono: '✨', desc: 'Piel, cabello y uñas' },
  { nombre: 'Traumatología', icono: '🦴', desc: 'Lesiones musculoesqueléticas' },
  { nombre: 'Oftalmología', icono: '👁️', desc: 'Salud visual' },
  { nombre: 'Ginecología', icono: '🌸', desc: 'Salud reproductiva femenina' },
  { nombre: 'Psiquiatría', icono: '🧩', desc: 'Trastornos mentales' },
]

export default function HomePage() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">Sistema de Reservas Médicas</span>
            <h1>Tu salud, <span className="accent">sin complicaciones</span></h1>
            <p>Reserva tu hora con el especialista que necesitas de forma rápida, sencilla y segura.</p>
            <div className="hero-actions">
              <Link to="/reservar" className="btn btn-primary">Reservar hora ahora</Link>
              <Link to="/admin" className="btn btn-secondary">Panel de administración</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="stat-card">
              <span className="stat-num">12</span>
              <span className="stat-label">Especialidades</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">24h</span>
              <span className="stat-label">Confirmación por email</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">100%</span>
              <span className="stat-label">Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="especialidades-section">
        <div className="container">
          <h2>Nuestras especialidades</h2>
          <p className="section-sub">Contamos con profesionales de la salud en todas las áreas que necesitas</p>
          <div className="especialidades-grid">
            {ESPECIALIDADES.map((esp) => (
              <div key={esp.nombre} className="esp-card">
                <span className="esp-icono">{esp.icono}</span>
                <strong>{esp.nombre}</strong>
                <p>{esp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>¿Necesitas una hora?</h2>
          <p>Reserva en minutos y recibe confirmación inmediata en tu correo.</p>
          <Link to="/reservar" className="btn btn-primary">Comenzar ahora →</Link>
        </div>
      </section>
    </div>
  )
}
