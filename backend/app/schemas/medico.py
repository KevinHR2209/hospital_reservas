from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from app.schemas.especialidad import EspecialidadOut


class MedicoBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: Optional[str] = None
    especialidad_id: UUID
    numero_registro: Optional[str] = None
    foto_url: Optional[str] = None


class MedicoCreate(MedicoBase):
    pass


class MedicoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    especialidad_id: Optional[UUID] = None
    numero_registro: Optional[str] = None
    foto_url: Optional[str] = None
    activo: Optional[bool] = None


class MedicoOut(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    numero_registro: Optional[str] = None
    foto_url: Optional[str] = None
    activo: bool
    especialidad: Optional[EspecialidadOut] = None

    class Config:
        from_attributes = True
