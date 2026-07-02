import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center'
    }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text)' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Página no encontrada</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  )
}
