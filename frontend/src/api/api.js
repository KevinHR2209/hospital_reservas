import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const especialidadesAPI = {
  listar: () => api.get('/especialidades/'),
}

export const medicosAPI = {
  listar: (params) => api.get('/medicos/', { params }),
}

export const horariosAPI = {
  porMedico: (medicoId) => api.get(`/horarios/medico/${medicoId}`),
}

export const disponibilidadAPI = {
  obtener: (medicoId, fecha) => api.get(`/reservas/disponibilidad/${medicoId}/${fecha}`),
}

export const pacientesAPI = {
  buscar: (params) => api.get('/pacientes/buscar', { params }),
  crear: (data) => api.post('/pacientes/', data),
  actualizar: (id, data) => api.patch(`/pacientes/${id}`, data),
}

export const reservasAPI = {
  listar: () => api.get('/reservas/'),
  porMedico: (medicoId) => api.get(`/reservas/medico/${medicoId}`),
  porPaciente: (pacienteId) => api.get(`/reservas/paciente/${pacienteId}`),
  crear: (data) => api.post('/reservas/', data),
  cambiarEstado: (id, estado) => api.patch(`/reservas/${id}/estado`, { estado }),
}

export default api
