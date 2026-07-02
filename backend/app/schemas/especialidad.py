from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class EspecialidadBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    duracion_consulta_minutos: int = 30


class EspecialidadCreate(EspecialidadBase):
    pass


class EspecialidadUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    duracion_consulta_minutos: Optional[int] = None
    activa: Optional[bool] = None


class EspecialidadOut(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str]
    duracion_consulta_minutos: int
    activa: bool

    class Config:
        from_attributes = True
