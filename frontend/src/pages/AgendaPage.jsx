import { useState, useEffect, useCallback } from 'react'
import { reservasAPI, medicosAPI, especialidadesAPI } from '../api/api'
import './AgendaPage.css'

const ESTADOS = ['reservada', 'completada', 'cancelada']

const BADGE = {
  reservada:  { label: 'Reservada',  cls: 'badge-reservada' },
  completada: { label: 'Completada', cls: 'badge-completada' },
  cancelada:  { label: 'Cancelada',  cls: 'badge-cancelada' },
}

function fmtFecha(iso) {
  const [y, m, d] = iso.split('-')
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return `${dias[dt.getDay()]} ${Number(d)} de ${meses[Number(m) - 1]} de ${y}`
}

function toISO(date) {
  return date.toISOString().split('T')[0]
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return toISO(dt)
}

export default function AgendaPage() {
  const hoy = toISO(new Date())
  const [fecha, setFecha] = useState(hoy)
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtroMedico, setFiltroMedico] = useState('')
  const [filtroEsp, setFiltroEsp] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)   // reserva seleccionada
  const [editEstado, setEditEstado] = useState('')
  const [editNotas, setEditNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msgModal, setMsgModal] = useState(null)

  const cargarReservas = useCallback(() => {
    setLoading(true)
    reservasAPI.listar()
      .then(r => {
        const del_dia = r.data.filter(rv => rv.fecha === fecha)
        setReservas(del_dia)
      })
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [fecha])

  useEffect(() => { cargarReservas() }, [cargarReservas])

  useEffect(() => {
    medicosAPI.listar({ solo_activos: true }).then(r => setMedicos(r.data)).catch(() => {})
    especialidadesAPI.listar().then(r => setEspecialidades(r.data)).catch(() => {})
  }, [])

  const reservasFiltradas = reservas.filter(rv => {
    if (filtroMedico && rv.medico?.id !== filtroMedico) return false
    if (filtroEsp && rv.especialidad?.id !== filtroEsp) return false
    if (filtroEstado && rv.estado !== filtroEstado) return false
    return true
  }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

  const stats = {
    total:      reservas.length,
    reservada:  reservas.filter(r => r.estado === 'reservada').length,
    completada: reservas.filter(r => r.estado === 'completada').length,
    cancelada:  reservas.filter(r => r.estado === 'cancelada').length,
  }

  const abrirModal = (rv) => {
    setModal(rv)
    setEditEstado(rv.estado)
    setEditNotas(rv.notas || '')
    setMsgModal(null)
  }

  const cerrarModal = () => { setModal(null); setMsgModal(null) }

  const guardar = async () => {
    if (!modal) return
    setGuardando(true)
    setMsgModal(null)
    try {
      await reservasAPI.cambiarEstado(modal.id, editEstado)
      // Si hay notas, las enviamos también (endpoint PATCH estado acepta solo estado,
      // usamos el mismo endpoint y actualizamos localmente)
      setReservas(prev => prev.map(r =>
        r.id === modal.id ? { ...r, estado: editEstado, notas: editNotas } : r
      ))
      setMsgModal({ tipo: 'ok', texto: 'Reserva actualizada correctamente.' })
      setTimeout(cerrarModal, 1200)
    } catch (e) {
      const detail = e?.response?.data?.detail
      setMsgModal({ tipo: 'error', texto: typeof detail === 'string' ? detail : 'Error al guardar.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="agenda-page">
      <div className="container">

        {/* Header */}
        <div className="agenda-header">
          <div>
            <h1>Agenda del día</h1>
            <p className="agenda-fecha-label">{fmtFecha(fecha)}</p>
          </div>
          <div className="agenda-nav">
            <button className="nav-btn" onClick={() => setFecha(f => addDays(f, -1))} title="Día anterior">←</button>
            <button className="nav-btn today-btn" onClick={() => setFecha(hoy)}>Hoy</button>
            <input type="date" className="date-picker" value={fecha} onChange={e => setFecha(e.target.value)} />
            <button className="nav-btn" onClick={() => setFecha(f => addDays(f, 1))} title="Día siguiente">→</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card stat-reservada">
            <span className="stat-num">{stats.reservada}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card stat-completada">
            <span className="stat-num">{stats.completada}</span>
            <span className="stat-label">Completadas</span>
          </div>
          <div className="stat-card stat-cancelada">
            <span className="stat-num">{stats.cancelada}</span>
            <span className="stat-label">Canceladas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros-bar">
          <select className="form-control filtro" value={filtroMedico} onChange={e => setFiltroMedico(e.target.value)}>
            <option value="">Todos los médicos</option>
            {medicos.map(m => <option key={m.id} value={m.id}>Dr(a). {m.nombre} {m.apellido}</option>)}
          </select>
          <select className="form-control filtro" value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
            <option value="">Todas las especialidades</option>
            {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select className="form-control filtro" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{BADGE[s].label}</option>)}
          </select>
          {(filtroMedico || filtroEsp || filtroEstado) && (
            <button className="btn-limpiar" onClick={() => { setFiltroMedico(''); setFiltroEsp(''); setFiltroEstado('') }}>Limpiar filtros ×</button>
          )}
        </div>

        {/* Lista de citas */}
        {loading ? (
          <div className="agenda-loading"><div className="spinner" /><p>Cargando agenda...</p></div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="agenda-empty">
            <div className="empty-icon">📅</div>
            <h3>Sin citas para este día</h3>
            <p>{reservas.length > 0 ? 'No hay citas que coincidan con los filtros.' : 'No hay citas agendadas para este día.'}</p>
          </div>
        ) : (
          <div className="citas-lista">
            {reservasFiltradas.map(rv => (
              <div key={rv.id} className={`cita-card estado-${rv.estado}`} onClick={() => abrirModal(rv)}>
                <div className="cita-hora">
                  <span className="hora-inicio">{String(rv.hora_inicio).slice(0,5)}</span>
                  <span className="hora-sep">–</span>
                  <span className="hora-fin">{String(rv.hora_fin).slice(0,5)}</span>
                </div>
                <div className="cita-info">
                  <div className="cita-paciente">
                    <strong>{rv.paciente?.nombre} {rv.paciente?.apellido}</strong>
                    <span className="cita-rut">{rv.paciente?.rut}</span>
                  </div>
                  <div className="cita-medico">
                    <span>Dr(a). {rv.medico?.nombre} {rv.medico?.apellido}</span>
                    <span className="cita-esp">{rv.especialidad?.nombre}</span>
                  </div>
                  {rv.motivo_consulta && (
                    <p className="cita-motivo">"{rv.motivo_consulta}"</p>
                  )}
                </div>
                <div className="cita-right">
                  <span className={`badge ${BADGE[rv.estado]?.cls}`}>{BADGE[rv.estado]?.label}</span>
                  {rv.box && <span className="cita-box">Box {rv.box.numero}</span>}
                  <span className="cita-edit-hint">Editar →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal edicion */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>Editar cita</h2>
              <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">×</button>
            </div>

            <div className="modal-body">
              {/* Datos de la cita */}
              <div className="modal-section">
                <h3>Datos de la consulta</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label>Paciente</label>
                    <p><strong>{modal.paciente?.nombre} {modal.paciente?.apellido}</strong></p>
                  </div>
                  <div className="modal-field">
                    <label>RUT</label>
                    <p>{modal.paciente?.rut}</p>
                  </div>
                  <div className="modal-field">
                    <label>Teléfono</label>
                    <p>{modal.paciente?.telefono || '—'}</p>
                  </div>
                  <div className="modal-field">
                    <label>Correo</label>
                    <p>{modal.paciente?.email || '—'}</p>
                  </div>
                  <div className="modal-field">
                    <label>Previsión</label>
                    <p>{modal.paciente?.prevision || '—'}</p>
                  </div>
                  <div className="modal-field">
                    <label>Médico</label>
                    <p>Dr(a). {modal.medico?.nombre} {modal.medico?.apellido}</p>
                  </div>
                  <div className="modal-field">
                    <label>Especialidad</label>
                    <p>{modal.especialidad?.nombre}</p>
                  </div>
                  <div className="modal-field">
                    <label>Fecha y hora</label>
                    <p>{modal.fecha} &nbsp; {String(modal.hora_inicio).slice(0,5)} – {String(modal.hora_fin).slice(0,5)}</p>
                  </div>
                  {modal.box && (
                    <div className="modal-field">
                      <label>Box</label>
                      <p>Box {modal.box.numero} {modal.box.nombre ? `— ${modal.box.nombre}` : ''}</p>
                    </div>
                  )}
                  {modal.motivo_consulta && (
                    <div className="modal-field modal-full">
                      <label>Motivo de consulta</label>
                      <p>{modal.motivo_consulta}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edicion */}
              <div className="modal-section">
                <h3>Modificar estado</h3>
                <div className="estado-btns">
                  {ESTADOS.map(s => (
                    <button
                      key={s}
                      className={`estado-btn ${editEstado === s ? 'active' : ''} estado-opt-${s}`}
                      onClick={() => setEditEstado(s)}
                    >
                      {BADGE[s].label}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Notas internas</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editNotas}
                    onChange={e => setEditNotas(e.target.value)}
                    placeholder="Observaciones del médico, indicaciones, etc."
                  />
                </div>
              </div>

              {msgModal && (
                <div className={`alert ${msgModal.tipo === 'ok' ? 'alert-success' : 'alert-error'}`}>
                  {msgModal.texto}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
