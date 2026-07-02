from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, time, datetime
from app.schemas.paciente import PacienteOut
from app.schemas.medico import MedicoOut
from app.schemas.especialidad import EspecialidadOut
from app.schemas.box import BoxOut


class ReservaBase(BaseModel):
    paciente_id: UUID
    medico_id: UUID
    especialidad_id: UUID
    fecha: date
    hora_inicio: time
    motivo_consulta: Optional[str] = None
    notas: Optional[str] = None


class ReservaCreate(ReservaBase):
    pass


class ReservaUpdateEstado(BaseModel):
    estado: str  # reservada | completada | cancelada


class ReservaOut(BaseModel):
    id: UUID
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str
    motivo_consulta: Optional[str]
    notas: Optional[str]
    created_at: datetime
    paciente: PacienteOut
    medico: MedicoOut
    especialidad: EspecialidadOut
    box: Optional[BoxOut]

    class Config:
        from_attributes = True
