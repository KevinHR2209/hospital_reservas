from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import date, datetime
import re


PREVISIONES_VALIDAS = ["FONASA A", "FONASA B", "FONASA C", "FONASA D", "ISAPRE", "Particular", "Otro"]


def validar_rut_chileno(rut: str) -> str:
    """Valida formato y dígito verificador del RUT chileno."""
    rut = rut.strip().upper()
    if not re.match(r'^\d{1,2}\.\d{3}\.\d{3}-[\dK]$', rut):
        raise ValueError("Formato de RUT inválido. Use XX.XXX.XXX-X (ej: 12.345.678-9)")
    cuerpo = rut.replace(".", "").replace("-", "")[:-1]
    dv = rut[-1]
    suma = 0
    multiplicador = 2
    for digito in reversed(cuerpo):
        suma += int(digito) * multiplicador
        multiplicador = multiplicador + 1 if multiplicador < 7 else 2
    resto = 11 - (suma % 11)
    dv_calculado = "K" if resto == 10 else ("0" if resto == 11 else str(resto))
    if dv != dv_calculado:
        raise ValueError(f"Dígito verificador incorrecto para el RUT ingresado")
    return rut


class PacienteBase(BaseModel):
    nombre: str
    apellido: str
    rut: str
    email: EmailStr
    telefono: str
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    prevision: str = "Particular"
    comuna: str
    region: Optional[str] = None
    direccion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    notas_medicas: Optional[str] = None

    @field_validator("rut")
    @classmethod
    def rut_valido(cls, v):
        return validar_rut_chileno(v)

    @field_validator("prevision")
    @classmethod
    def prevision_valida(cls, v):
        if v not in PREVISIONES_VALIDAS:
            raise ValueError(f"Previsión inválida. Opciones: {PREVISIONES_VALIDAS}")
        return v

    @field_validator("telefono")
    @classmethod
    def telefono_valido(cls, v):
        limpio = re.sub(r'[\s\-\(\)\+]', '', v)
        if not limpio.isdigit() or len(limpio) < 8:
            raise ValueError("Teléfono inválido. Ingrese al menos 8 dígitos.")
        return v


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    prevision: Optional[str] = None
    comuna: Optional[str] = None
    region: Optional[str] = None
    direccion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    notas_medicas: Optional[str] = None
    activo: Optional[bool] = None


class PacienteOut(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    rut: str
    email: str
    telefono: str
    fecha_nacimiento: Optional[date]
    genero: Optional[str]
    prevision: str
    comuna: str
    region: Optional[str]
    direccion: Optional[str]
    contacto_emergencia_nombre: Optional[str]
    contacto_emergencia_telefono: Optional[str]
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True
