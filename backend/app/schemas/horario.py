from pydantic import BaseModel, model_validator
from typing import Optional
from uuid import UUID
from datetime import time


class HorarioMedicoBase(BaseModel):
    medico_id: UUID
    dia_semana: int  # 0=Lunes ... 6=Domingo
    hora_inicio: time
    hora_fin: time

    @model_validator(mode="after")
    def validar_horas(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValueError("hora_fin debe ser posterior a hora_inicio")
        if not (0 <= self.dia_semana <= 6):
            raise ValueError("dia_semana debe ser entre 0 (Lunes) y 6 (Domingo)")
        return self


class HorarioMedicoCreate(HorarioMedicoBase):
    pass


class HorarioMedicoUpdate(BaseModel):
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    activo: Optional[bool] = None


class HorarioMedicoOut(BaseModel):
    id: UUID
    medico_id: UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    activo: bool

    class Config:
        from_attributes = True
