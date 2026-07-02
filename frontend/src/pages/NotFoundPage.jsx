import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏥</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 12 }}>Página no encontrada</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>La dirección que buscas no existe.</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  )
}
