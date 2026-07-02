import { useState, useEffect, useCallback } from 'react'
import { reservasAPI } from '../api/api'
import './AdminPage.css'

const ESTADO_LABELS = { reservada: 'Reservada', completada: 'Completada', cancelada: 'Cancelada' }
const ESTADO_NEXT = { reservada: 'completada', completada: null, cancelada: null }

export default function AdminPage() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [loadingId, setLoadingId] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await reservasAPI.listar()
      setReservas(data)
    } catch (e) {
      setError('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id, nuevoEstado) => {
    setLoadingId(id)
    try {
      await reservasAPI.cambiarEstado(id, nuevoEstado)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r))
    } catch (e) {
      alert('Error al cambiar estado')
    } finally {
      setLoadingId(null)
    }
  }

  const filtradas = reservas.filter(r => {
    const matchEstado = filtroEstado === 'todas' || r.estado === filtroEstado
    const q = filtroBusqueda.toLowerCase()
    const matchBusqueda = !q ||
      `${r.paciente?.nombre} ${r.paciente?.apellido}`.toLowerCase().includes(q) ||
      r.paciente?.rut?.toLowerCase().includes(q) ||
      r.medico?.apellido?.toLowerCase().includes(q) ||
      r.especialidad?.nombre?.toLowerCase().includes(q)
    return matchEstado && matchBusqueda
  })

  const stats = {
    total: reservas.length,
    reservadas: reservas.filter(r => r.estado === 'reservada').length,
    completadas: reservas.filter(r => r.estado === 'completada').length,
    canceladas: reservas.filter(r => r.estado === 'cancelada').length,
  }

  return (
    <div className="container admin-page">
      <div className="admin-header">
        <div>
          <h1>Panel de Administración</h1>
          <p>Gestión de reservas médicas</p>
        </div>
        <button className="btn btn-secondary" onClick={cargar}>🔄 Actualizar</button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[['Total', stats.total, '#0284c7'], ['Reservadas', stats.reservadas, '#1d4ed8'], ['Completadas', stats.completadas, '#15803d'], ['Canceladas', stats.canceladas, '#dc2626']].map(([label, val, color]) => (
          <div className="stat-item" key={label}>
            <span className="stat-value" style={{ color }}>{val}</span>
            <span className="stat-name">{label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="admin-filters">
        <input
          className="form-control" placeholder="Buscar por paciente, RUT, médico o especialidad..."
          value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
          style={{ maxWidth: 380 }}
        />
        <div className="filter-tabs">
          {['todas', 'reservada', 'completada', 'cancelada'].map(e => (
            <button key={e} className={`filter-tab ${filtroEstado === e ? 'active' : ''}`}
              onClick={() => setFiltroEstado(e)}>
              {e === 'todas' ? 'Todas' : ESTADO_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : filtradas.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📋</div>
          <h3>Sin reservas</h3>
          <p>{filtroBusqueda || filtroEstado !== 'todas' ? 'No hay reservas que coincidan con el filtro.' : 'Aún no hay reservas registradas.'}</p>
        </div>
      ) : (
        <div className="table-wrapper card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Box</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.fecha}</strong>
                    <br /><span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{r.hora_inicio?.slice(0,5)} - {r.hora_fin?.slice(0,5)}</span>
                  </td>
                  <td>
                    <strong>{r.paciente?.nombre} {r.paciente?.apellido}</strong>
                    <br /><span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{r.paciente?.rut}</span>
                  </td>
                  <td>Dr(a). {r.medico?.nombre} {r.medico?.apellido}</td>
                  <td>{r.especialidad?.nombre}</td>
                  <td>{r.box ? `Box ${r.box.numero}` : '—'}</td>
                  <td><span className={`badge badge-${r.estado}`}>{ESTADO_LABELS[r.estado]}</span></td>
                  <td>
                    {ESTADO_NEXT[r.estado] ? (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        disabled={loadingId === r.id}
                        onClick={() => cambiarEstado(r.id, ESTADO_NEXT[r.estado])}
                      >
                        {loadingId === r.id ? '...' : ESTADO_NEXT[r.estado] === 'completada' ? '✅ Completar' : 'Cancelar'}
                      </button>
                    ) : r.estado === 'reservada' ? (
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 13 }}
                        disabled={loadingId === r.id}
                        onClick={() => cambiarEstado(r.id, 'cancelada')}>
                        {loadingId === r.id ? '...' : '❌ Cancelar'}
                      </button>
                    ) : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
