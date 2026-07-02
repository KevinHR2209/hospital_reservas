import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/api'
import './CancelarPage.css'

export default function CancelarPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando') // cargando | confirmando | exito | error
  const [reserva, setReserva] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!token) { setEstado('error'); setMensaje('Token no válido.'); return }
    api.get(`/reservas/cancelar/${token}`)
      .then(r => { setReserva(r.data); setEstado('confirmando') })
      .catch(e => {
        const msg = e?.response?.data?.detail || 'La reserva no existe o ya fue procesada.'
        setEstado('error')
        setMensaje(msg)
      })
  }, [token])

  const confirmarCancelacion = () => {
    setEstado('cargando')
    api.post(`/reservas/cancelar/${token}`)
      .then(() => setEstado('exito'))
      .catch(e => {
        const msg = e?.response?.data?.detail || 'No se pudo cancelar la reserva.'
        setEstado('error')
        setMensaje(msg)
      })
  }

  return (
    <div className="cancelar-page">
      <div className="cancelar-card card">

        {estado === 'cargando' && (
          <div className="cancelar-loading">
            <div className="spinner" />
            <p>Verificando reserva...</p>
          </div>
        )}

        {estado === 'confirmando' && reserva && (
          <>
            <div className="cancelar-icon">⚠️</div>
            <h1>Cancelar reserva</h1>
            <p className="cancelar-sub">¿Estás seguro que deseas cancelar esta reserva?</p>
            <div className="cancelar-detalle">
              <div className="detalle-row"><span>Especialidad</span><strong>{reserva.especialidad?.nombre}</strong></div>
              <div className="detalle-row"><span>Médico</span><strong>Dr(a). {reserva.medico?.nombre} {reserva.medico?.apellido}</strong></div>
              <div className="detalle-row"><span>Fecha</span><strong>{reserva.fecha}</strong></div>
              <div className="detalle-row"><span>Hora</span><strong>{reserva.hora_inicio?.slice(0,5)} – {reserva.hora_fin?.slice(0,5)}</strong></div>
              <div className="detalle-row"><span>Paciente</span><strong>{reserva.paciente?.nombre} {reserva.paciente?.apellido}</strong></div>
            </div>
            <div className="cancelar-actions">
              <button className="btn btn-danger" onClick={confirmarCancelacion}>
                Sí, cancelar reserva
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/')}>
                Volver al inicio
              </button>
            </div>
          </>
        )}

        {estado === 'exito' && (
          <>
            <div className="cancelar-icon">✅</div>
            <h1>Reserva cancelada</h1>
            <p className="cancelar-sub">Tu reserva ha sido cancelada exitosamente. Si necesitas una nueva hora, puedes agendar desde nuestro sitio.</p>
            <button className="btn btn-primary" onClick={() => navigate('/reservar')}>Reservar nueva hora</button>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="cancelar-icon">❌</div>
            <h1>No se pudo procesar</h1>
            <p className="cancelar-sub">{mensaje}</p>
            <div className="cancelar-actions">
              <button className="btn btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
