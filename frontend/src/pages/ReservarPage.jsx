import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { especialidadesAPI, medicosAPI, disponibilidadAPI, pacientesAPI, reservasAPI } from '../api/api'
import './ReservarPage.css'

const PREVISIONS = ['FONASA A', 'FONASA B', 'FONASA C', 'FONASA D', 'ISAPRE', 'Particular']
const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
]

function validarRut(rut) {
  if (!rut) return false
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return false
  const dv = clean.slice(-1).toUpperCase()
  const num = parseInt(clean.slice(0, -1), 10)
  let sum = 0, mul = 2, tmp = num
  while (tmp > 0) {
    sum += (tmp % 10) * mul
    tmp = Math.floor(tmp / 10)
    mul = mul === 7 ? 2 : mul + 1
  }
  const expected = 11 - (sum % 11)
  const dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected)
  return dv === dvCalc
}

function formatRut(val) {
  const clean = val.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const bodyFmt = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  return `${bodyFmt}-${dv}`
}

// Extrae un mensaje legible de cualquier error de axios/FastAPI
function extraerMensajeError(e) {
  const data = e?.response?.data
  if (!data) return 'Error de conexión. Intenta nuevamente.'
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map(d => d?.msg || JSON.stringify(d)).join(' | ')
  }
  if (typeof data === 'string') return data
  return 'Error inesperado. Intenta nuevamente.'
}

const STEPS = ['Especialidad', 'Médico y Hora', 'Tus datos', 'Confirmación']

function StepBar({ current }) {
  return (
    <div className="step-bar">
      {STEPS.map((s, i) => (
        <div key={s} className={`step-item ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
          <div className="step-circle">{i < current ? '✓' : i + 1}</div>
          <span>{s}</span>
          {i < STEPS.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  )
}

export default function ReservarPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [especialidades, setEspecialidades] = useState([])
  const [espSeleccionada, setEspSeleccionada] = useState(null)

  const [medicos, setMedicos] = useState([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  const [medicoSel, setMedicoSel] = useState(null)
  const [fecha, setFecha] = useState('')
  const [bloques, setBloques] = useState([])
  const [horaSel, setHoraSel] = useState(null)
  const [loadingBloques, setLoadingBloques] = useState(false)

  const [paciente, setPaciente] = useState({
    nombre: '', apellido: '', rut: '', email: '', telefono: '',
    fecha_nacimiento: '', prevision: '', region: '', comuna: '',
    direccion: '', motivo_consulta: '', contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: ''
  })
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [reservaCreada, setReservaCreada] = useState(null)
  const [errorEnvio, setErrorEnvio] = useState(null)

  useEffect(() => {
    especialidadesAPI.listar().then(r => setEspecialidades(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (espSeleccionada) {
      setLoadingMedicos(true)
      setMedicos([])
      setMedicoSel(null)
      medicosAPI.listar({ especialidad_id: espSeleccionada.id, solo_activos: true })
        .then(r => setMedicos(r.data))
        .catch(() => setMedicos([]))
        .finally(() => setLoadingMedicos(false))
    }
  }, [espSeleccionada])

  useEffect(() => {
    if (medicoSel && fecha) {
      setLoadingBloques(true)
      setHoraSel(null)
      disponibilidadAPI.obtener(medicoSel.id, fecha)
        .then(r => setBloques(r.data.bloques || []))
        .catch(() => setBloques([]))
        .finally(() => setLoadingBloques(false))
    } else {
      setBloques([])
      setHoraSel(null)
    }
  }, [medicoSel, fecha])

  const hoy = new Date().toISOString().split('T')[0]

  const validarPaciente = () => {
    const e = {}
    if (!paciente.nombre.trim()) e.nombre = 'Requerido'
    if (!paciente.apellido.trim()) e.apellido = 'Requerido'
    if (!paciente.rut.trim()) e.rut = 'Requerido'
    else if (!validarRut(paciente.rut)) e.rut = 'RUT inválido'
    if (!paciente.email.trim()) e.email = 'Requerido'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(paciente.email)) e.email = 'Email inválido'
    if (!paciente.telefono.trim()) e.telefono = 'Requerido'
    if (!paciente.fecha_nacimiento) e.fecha_nacimiento = 'Requerido'
    if (!paciente.prevision) e.prevision = 'Requerido'
    if (!paciente.region) e.region = 'Requerido'
    if (!paciente.comuna.trim()) e.comuna = 'Requerido'
    if (!paciente.motivo_consulta.trim()) e.motivo_consulta = 'Requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handlePacienteChange = (field, value) => {
    setPaciente(prev => ({ ...prev, [field]: value }))
    if (errores[field]) setErrores(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const confirmarReserva = async () => {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      // 1. Buscar paciente por RUT
      let pacienteId = null
      try {
        const busqueda = await pacientesAPI.buscar({ rut: paciente.rut })
        const lista = busqueda.data
        if (Array.isArray(lista) && lista.length > 0) {
          pacienteId = lista[0].id
          // Actualizar datos del paciente existente
          await pacientesAPI.actualizar(pacienteId, {
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            email: paciente.email,
            telefono: paciente.telefono,
            fecha_nacimiento: paciente.fecha_nacimiento,
            prevision: paciente.prevision,
            region: paciente.region,
            comuna: paciente.comuna,
            direccion: paciente.direccion,
            contacto_emergencia_nombre: paciente.contacto_emergencia_nombre,
            contacto_emergencia_telefono: paciente.contacto_emergencia_telefono,
          })
        }
      } catch {
        // Si falla la búsqueda, continuar e intentar crear
      }

      // 2. Si no existe, crear paciente nuevo
      if (!pacienteId) {
        const creado = await pacientesAPI.crear({ ...paciente })
        pacienteId = creado.data.id
      }

      // 3. Crear la reserva
      const payload = {
        paciente_id: pacienteId,
        medico_id: medicoSel.id,
        especialidad_id: espSeleccionada.id,
        fecha: fecha,
        hora_inicio: horaSel.length === 5 ? horaSel + ':00' : horaSel,
        motivo_consulta: paciente.motivo_consulta,
      }
      const result = await reservasAPI.crear(payload)
      setReservaCreada(result.data)
      setStep(3)
    } catch (e) {
      setErrorEnvio(extraerMensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const nextStep = () => {
    if (step === 2 && !validarPaciente()) return
    if (step === 2) { confirmarReserva(); return }
    setStep(s => s + 1)
  }

  const canNext = () => {
    if (step === 0) return !!espSeleccionada
    if (step === 1) return !!medicoSel && !!fecha && !!horaSel
    if (step === 2) return true
    return false
  }

  const resetForm = () => {
    setStep(0); setEspSeleccionada(null); setMedicoSel(null)
    setFecha(''); setHoraSel(null); setReservaCreada(null); setErrorEnvio(null)
    setPaciente({
      nombre: '', apellido: '', rut: '', email: '', telefono: '',
      fecha_nacimiento: '', prevision: '', region: '', comuna: '',
      direccion: '', motivo_consulta: '', contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: ''
    })
  }

  return (
    <div className="reservar-page">
      <div className="container">
        <div className="reservar-header">
          <h1>Reservar hora médica</h1>
          <p>Completa los pasos para agendar tu consulta</p>
        </div>
        <StepBar current={step} />
        <div className="reservar-card card">

          {step === 0 && (
            <div className="step-content">
              <h2>¿Qué especialidad necesitas?</h2>
              <p className="step-desc">Selecciona la especialidad médica para tu consulta</p>
              <div className="esp-grid">
                {especialidades.map(esp => (
                  <button key={esp.id}
                    className={`esp-btn ${espSeleccionada?.id === esp.id ? 'selected' : ''}`}
                    onClick={() => setEspSeleccionada(esp)}>
                    <span className="esp-nombre">{esp.nombre}</span>
                    {esp.descripcion && <span className="esp-desc">{esp.descripcion}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-content">
              <h2>Elige médico, fecha y hora</h2>
              <p className="step-desc">Especialidad: <strong>{espSeleccionada?.nombre}</strong></p>
              <div className="medicos-lista">
                {loadingMedicos ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
                ) : medicos.length === 0 ? (
                  <div className="empty-state"><p>No hay médicos disponibles para esta especialidad.</p></div>
                ) : medicos.map(m => (
                  <button key={m.id}
                    className={`medico-btn ${medicoSel?.id === m.id ? 'selected' : ''}`}
                    onClick={() => { setMedicoSel(m); setFecha(''); setHoraSel(null) }}>
                    <div className="medico-avatar">{m.nombre[0]}{m.apellido[0]}</div>
                    <div className="medico-info">
                      <strong>Dr(a). {m.nombre} {m.apellido}</strong>
                      <span>{m.especialidad?.nombre}</span>
                    </div>
                  </button>
                ))}
              </div>
              {medicoSel && (
                <div className="fecha-row">
                  <div className="form-group">
                    <label>Fecha de la consulta</label>
                    <input type="date" className="form-control" min={hoy} value={fecha}
                      onChange={e => setFecha(e.target.value)} />
                  </div>
                </div>
              )}
              {medicoSel && fecha && (
                <div className="bloques-wrapper">
                  <h3>Horarios disponibles</h3>
                  {loadingBloques ? (
                    <div className="loading-bloques"><div className="spinner" /></div>
                  ) : bloques.length === 0 ? (
                    <p className="no-bloques">El médico no atiende ese día o no tiene horarios configurados.</p>
                  ) : (
                    <div className="bloques-grid">
                      {bloques.map(b => (
                        <button key={b.hora}
                          disabled={b.ocupado}
                          className={`bloque-btn ${b.ocupado ? 'ocupado' : ''} ${horaSel === b.hora ? 'selected' : ''}`}
                          onClick={() => !b.ocupado && setHoraSel(b.hora)}>
                          {b.hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Tus datos personales</h2>
              <p className="step-desc">Esta información es necesaria para confirmar tu reserva</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre <span className="req">*</span></label>
                  <input className={`form-control ${errores.nombre ? 'error' : ''}`} value={paciente.nombre}
                    onChange={e => handlePacienteChange('nombre', e.target.value)} placeholder="Ej: María" />
                  {errores.nombre && <span className="error-msg">{errores.nombre}</span>}
                </div>
                <div className="form-group">
                  <label>Apellido <span className="req">*</span></label>
                  <input className={`form-control ${errores.apellido ? 'error' : ''}`} value={paciente.apellido}
                    onChange={e => handlePacienteChange('apellido', e.target.value)} placeholder="Ej: González" />
                  {errores.apellido && <span className="error-msg">{errores.apellido}</span>}
                </div>
                <div className="form-group">
                  <label>RUT <span className="req">*</span></label>
                  <input className={`form-control ${errores.rut ? 'error' : ''}`} value={paciente.rut}
                    onChange={e => handlePacienteChange('rut', formatRut(e.target.value))}
                    placeholder="Ej: 12.345.678-9" maxLength={12} />
                  {errores.rut && <span className="error-msg">{errores.rut}</span>}
                </div>
                <div className="form-group">
                  <label>Correo electrónico <span className="req">*</span></label>
                  <input type="email" className={`form-control ${errores.email ? 'error' : ''}`} value={paciente.email}
                    onChange={e => handlePacienteChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
                  {errores.email && <span className="error-msg">{errores.email}</span>}
                </div>
                <div className="form-group">
                  <label>Teléfono <span className="req">*</span></label>
                  <input className={`form-control ${errores.telefono ? 'error' : ''}`} value={paciente.telefono}
                    onChange={e => handlePacienteChange('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
                  {errores.telefono && <span className="error-msg">{errores.telefono}</span>}
                </div>
                <div className="form-group">
                  <label>Fecha de nacimiento <span className="req">*</span></label>
                  <input type="date" className={`form-control ${errores.fecha_nacimiento ? 'error' : ''}`}
                    value={paciente.fecha_nacimiento}
                    onChange={e => handlePacienteChange('fecha_nacimiento', e.target.value)} />
                  {errores.fecha_nacimiento && <span className="error-msg">{errores.fecha_nacimiento}</span>}
                </div>
                <div className="form-group">
                  <label>Previsión de salud <span className="req">*</span></label>
                  <select className={`form-control ${errores.prevision ? 'error' : ''}`} value={paciente.prevision}
                    onChange={e => handlePacienteChange('prevision', e.target.value)}>
                    <option value="">Selecciona previsión</option>
                    {PREVISIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errores.prevision && <span className="error-msg">{errores.prevision}</span>}
                </div>
                <div className="form-group">
                  <label>Región <span className="req">*</span></label>
                  <select className={`form-control ${errores.region ? 'error' : ''}`} value={paciente.region}
                    onChange={e => handlePacienteChange('region', e.target.value)}>
                    <option value="">Selecciona región</option>
                    {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errores.region && <span className="error-msg">{errores.region}</span>}
                </div>
                <div className="form-group">
                  <label>Comuna <span className="req">*</span></label>
                  <input className={`form-control ${errores.comuna ? 'error' : ''}`} value={paciente.comuna}
                    onChange={e => handlePacienteChange('comuna', e.target.value)} placeholder="Ej: Valparaíso" />
                  {errores.comuna && <span className="error-msg">{errores.comuna}</span>}
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input className="form-control" value={paciente.direccion}
                    onChange={e => handlePacienteChange('direccion', e.target.value)} placeholder="Calle, número, depto" />
                </div>
                <div className="form-group form-full">
                  <label>Motivo de consulta <span className="req">*</span></label>
                  <textarea className={`form-control ${errores.motivo_consulta ? 'error' : ''}`} rows={3}
                    value={paciente.motivo_consulta}
                    onChange={e => handlePacienteChange('motivo_consulta', e.target.value)}
                    placeholder="Describe brevemente el motivo de tu consulta..." />
                  {errores.motivo_consulta && <span className="error-msg">{errores.motivo_consulta}</span>}
                </div>
                <div className="form-group">
                  <label>Contacto de emergencia (nombre)</label>
                  <input className="form-control" value={paciente.contacto_emergencia_nombre}
                    onChange={e => handlePacienteChange('contacto_emergencia_nombre', e.target.value)}
                    placeholder="Nombre del contacto" />
                </div>
                <div className="form-group">
                  <label>Contacto de emergencia (teléfono)</label>
                  <input className="form-control" value={paciente.contacto_emergencia_telefono}
                    onChange={e => handlePacienteChange('contacto_emergencia_telefono', e.target.value)}
                    placeholder="+56 9 8765 4321" />
                </div>
              </div>
              <div className="resumen-box">
                <h3>Resumen de tu reserva</h3>
                <div className="resumen-grid">
                  <span>Especialidad:</span><strong>{espSeleccionada?.nombre}</strong>
                  <span>Médico:</span><strong>Dr(a). {medicoSel?.nombre} {medicoSel?.apellido}</strong>
                  <span>Fecha:</span><strong>{fecha}</strong>
                  <span>Hora:</span><strong>{horaSel}</strong>
                </div>
              </div>
              {errorEnvio && <div className="alert alert-error">{String(errorEnvio)}</div>}
            </div>
          )}

          {step === 3 && reservaCreada && (
            <div className="step-content confirmacion">
              <div className="confirm-icon">✅</div>
              <h2>¡Reserva confirmada!</h2>
              <p>Hemos enviado los detalles a tu correo electrónico.</p>
              <div className="confirm-card">
                <div className="confirm-row"><span>Especialidad</span><strong>{reservaCreada.especialidad?.nombre}</strong></div>
                <div className="confirm-row"><span>Médico</span><strong>Dr(a). {reservaCreada.medico?.nombre} {reservaCreada.medico?.apellido}</strong></div>
                <div className="confirm-row"><span>Fecha</span><strong>{reservaCreada.fecha}</strong></div>
                <div className="confirm-row"><span>Hora</span><strong>{String(reservaCreada.hora_inicio).slice(0,5)} – {String(reservaCreada.hora_fin).slice(0,5)}</strong></div>
                <div className="confirm-row"><span>Estado</span><strong className="badge badge-reservada">Reservada</strong></div>
              </div>
              <div className="confirm-actions">
                <button className="btn btn-primary" onClick={resetForm}>Hacer otra reserva</button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>Volver al inicio</button>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="step-nav">
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={enviando}>← Atrás</button>
              )}
              <button className="btn btn-primary" disabled={!canNext() || enviando} onClick={nextStep}>
                {enviando ? 'Enviando...' : step === 2 ? 'Confirmar reserva →' : 'Siguiente →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
