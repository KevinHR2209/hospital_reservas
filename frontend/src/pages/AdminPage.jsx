import { useState, useEffect } from 'react'
import { especialidadesAPI, medicosAPI, horariosAPI } from '../api/api'
import './AdminPage.css'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

// ─── Helpers ────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function Badge({ activo }) {
  return <span className={`badge ${activo ? 'badge-activo' : 'badge-inactivo'}`}>{activo ? 'Activo' : 'Inactivo'}</span>
}

// ─── Tab: Especialidades ────────────────────────────────────
function TabEspecialidades() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null) // null | 'crear' | objeto
  const [form, setForm] = useState({ nombre: '', descripcion: '', duracion_consulta_minutos: 30 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const cargar = () => especialidadesAPI.listar().then(r => setLista(r.data))
  useEffect(() => { cargar() }, [])

  const abrirCrear = () => {
    setForm({ nombre: '', descripcion: '', duracion_consulta_minutos: 30 })
    setError('')
    setModal('crear')
  }

  const abrirEditar = (esp) => {
    setForm({ nombre: esp.nombre, descripcion: esp.descripcion || '', duracion_consulta_minutos: esp.duracion_consulta_minutos })
    setError('')
    setModal(esp)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError('')
    try {
      if (modal === 'crear') {
        await especialidadesAPI.crear(form)
      } else {
        await especialidadesAPI.actualizar(modal.id, form)
      }
      await cargar()
      setModal(null)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggleActiva = async (esp) => {
    try {
      await especialidadesAPI.actualizar(esp.id, { activa: !esp.activa })
      await cargar()
    } catch {}
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2>Especialidades <span className="count">{lista.length}</span></h2>
        <button className="btn btn-primary" onClick={abrirCrear}>+ Nueva especialidad</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>Descripción</th><th>Duración (min)</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.map(esp => (
              <tr key={esp.id}>
                <td><strong>{esp.nombre}</strong></td>
                <td className="text-muted">{esp.descripcion || '—'}</td>
                <td>{esp.duracion_consulta_minutos} min</td>
                <td><Badge activo={esp.activa} /></td>
                <td>
                  <button className="btn-link" onClick={() => abrirEditar(esp)}>Editar</button>
                  <button className="btn-link danger" onClick={() => toggleActiva(esp)}>
                    {esp.activa ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === 'crear' ? 'Nueva especialidad' : 'Editar especialidad'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Nombre *</label>
            <input className="form-control" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input className="form-control" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Duración consulta (minutos) *</label>
            <input type="number" className="form-control" min={10} max={120} value={form.duracion_consulta_minutos}
              onChange={e => setForm(f => ({ ...f, duracion_consulta_minutos: parseInt(e.target.value) }))} />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving} onClick={guardar}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab: Médicos ───────────────────────────────────────────
function TabMedicos() {
  const [lista, setLista] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [modal, setModal] = useState(null)
  const [modalHorarios, setModalHorarios] = useState(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', especialidad_id: '', numero_registro: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const cargar = () =>
    medicosAPI.listar({ solo_activos: false })
      .then(r => setLista(r.data))

  useEffect(() => {
    cargar()
    especialidadesAPI.listar().then(r => setEspecialidades(r.data))
  }, [])

  const abrirCrear = () => {
    setForm({ nombre: '', apellido: '', email: '', telefono: '', especialidad_id: '', numero_registro: '' })
    setError('')
    setModal('crear')
  }

  const abrirEditar = (m) => {
    setForm({
      nombre: m.nombre, apellido: m.apellido, email: m.email,
      telefono: m.telefono || '', especialidad_id: m.especialidad?.id || '',
      numero_registro: m.numero_registro || ''
    })
    setError('')
    setModal(m)
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son requeridos'); return }
    if (!form.email.trim()) { setError('El correo es requerido'); return }
    if (!form.especialidad_id) { setError('Debes seleccionar una especialidad'); return }
    setSaving(true); setError('')
    try {
      if (modal === 'crear') {
        await medicosAPI.crear(form)
      } else {
        await medicosAPI.actualizar(modal.id, form)
      }
      await cargar()
      setModal(null)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (m) => {
    try {
      if (m.activo) {
        await medicosAPI.desactivar(m.id)
      } else {
        await medicosAPI.actualizar(m.id, { activo: true })
      }
      await cargar()
    } catch {}
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2>Médicos <span className="count">{lista.length}</span></h2>
        <button className="btn btn-primary" onClick={abrirCrear}>+ Nuevo médico</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>Especialidad</th><th>Correo</th><th>Teléfono</th><th>N° Registro</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.map(m => (
              <tr key={m.id}>
                <td><strong>Dr(a). {m.nombre} {m.apellido}</strong></td>
                <td>{m.especialidad?.nombre || '—'}</td>
                <td className="text-muted">{m.email}</td>
                <td>{m.telefono || '—'}</td>
                <td>{m.numero_registro || '—'}</td>
                <td><Badge activo={m.activo} /></td>
                <td>
                  <button className="btn-link" onClick={() => abrirEditar(m)}>Editar</button>
                  <button className="btn-link" onClick={() => setModalHorarios(m)}>Horarios</button>
                  <button className="btn-link danger" onClick={() => toggleActivo(m)}>
                    {m.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'crear' ? 'Nuevo médico' : `Editar: Dr(a). ${modal.nombre} ${modal.apellido}`} onClose={() => setModal(null)}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre *</label>
              <input className="form-control" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Apellido *</label>
              <input className="form-control" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Correo *</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input className="form-control" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Especialidad *</label>
              <select className="form-control" value={form.especialidad_id} onChange={e => setForm(f => ({ ...f, especialidad_id: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>N° Registro</label>
              <input className="form-control" value={form.numero_registro} onChange={e => setForm(f => ({ ...f, numero_registro: e.target.value }))} />
            </div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving} onClick={guardar}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </Modal>
      )}

      {modalHorarios && (
        <ModalHorarios medico={modalHorarios} onClose={() => { setModalHorarios(null); cargar() }} />
      )}
    </div>
  )
}

// ─── Modal Horarios ─────────────────────────────────────────
function ModalHorarios({ medico, onClose }) {
  const [horarios, setHorarios] = useState([])
  const [form, setForm] = useState({ dia_semana: 0, hora_inicio: '08:00', hora_fin: '17:00' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const cargar = () => horariosAPI.porMedico(medico.id).then(r => setHorarios(r.data))
  useEffect(() => { cargar() }, [medico.id])

  const diasOcupados = horarios.map(h => h.dia_semana)

  const agregarHorario = async () => {
    if (form.hora_fin <= form.hora_inicio) { setError('La hora de fin debe ser posterior a la de inicio'); return }
    setSaving(true); setError('')
    try {
      await horariosAPI.crear({ medico_id: medico.id, ...form })
      await cargar()
      setForm({ dia_semana: 0, hora_inicio: '08:00', hora_fin: '17:00' })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const actualizarHorario = async (id, campo, valor) => {
    try {
      const h = horarios.find(x => x.id === id)
      const update = { hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, [campo]: valor }
      if (update.hora_fin <= update.hora_inicio) return
      await horariosAPI.actualizar(id, update)
      await cargar()
    } catch {}
  }

  const eliminar = async (id) => {
    try {
      await horariosAPI.eliminar(id)
      await cargar()
    } catch {}
  }

  return (
    <Modal title={`Horarios — Dr(a). ${medico.nombre} ${medico.apellido}`} onClose={onClose}>
      <div className="horarios-lista">
        {horarios.length === 0 && <p className="text-muted">Sin horarios configurados.</p>}
        {horarios.map(h => (
          <div key={h.id} className="horario-row">
            <span className="horario-dia">{DIAS[h.dia_semana]}</span>
            <input type="time" className="form-control time-input" value={h.hora_inicio.slice(0,5)}
              onChange={e => actualizarHorario(h.id, 'hora_inicio', e.target.value + ':00')} />
            <span>—</span>
            <input type="time" className="form-control time-input" value={h.hora_fin.slice(0,5)}
              onChange={e => actualizarHorario(h.id, 'hora_fin', e.target.value + ':00')} />
            <button className="btn-icon danger" onClick={() => eliminar(h.id)} title="Eliminar">🗑</button>
          </div>
        ))}
      </div>

      <div className="horario-add">
        <h4>Agregar horario</h4>
        <div className="horario-row">
          <select className="form-control" value={form.dia_semana}
            onChange={e => setForm(f => ({ ...f, dia_semana: parseInt(e.target.value) }))}>
            {DIAS.map((d, i) => (
              <option key={i} value={i} disabled={diasOcupados.includes(i)}>
                {d}{diasOcupados.includes(i) ? ' ✓' : ''}
              </option>
            ))}
          </select>
          <input type="time" className="form-control time-input" value={form.hora_inicio}
            onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
          <span>—</span>
          <input type="time" className="form-control time-input" value={form.hora_fin}
            onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
          <button className="btn btn-primary" disabled={saving} onClick={agregarHorario}>
            {saving ? '...' : 'Agregar'}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{marginTop:8}}>{error}</div>}
      </div>
    </Modal>
  )
}

// ─── Page principal ─────────────────────────────────────────
const TABS = [
  { id: 'especialidades', label: '🏥 Especialidades' },
  { id: 'medicos', label: '👨‍⚕️ Médicos' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('especialidades')

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Panel de administración</h1>
          <p>Gestiona especialidades, médicos y sus horarios de atención</p>
        </div>
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="admin-content">
          {tab === 'especialidades' && <TabEspecialidades />}
          {tab === 'medicos' && <TabMedicos />}
        </div>
      </div>
    </div>
  )
}
