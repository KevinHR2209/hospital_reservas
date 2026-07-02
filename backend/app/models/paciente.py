import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


# Previsiones de salud disponibles en Chile
PREVISIONES = ["FONASA A", "FONASA B", "FONASA C", "FONASA D", "ISAPRE", "Particular", "Otro"]


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    rut = Column(String(15), unique=True, nullable=False)         # Ej: 12.345.678-9
    email = Column(String(200), unique=True, nullable=False)
    telefono = Column(String(20), nullable=False)                  # Requerido para contacto
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(String(20), nullable=True)                     # Masculino, Femenino, Otro, Prefiero no decir
    prevision = Column(String(30), nullable=False, default="Particular")  # FONASA/ISAPRE/Particular
    comuna = Column(String(100), nullable=False)                   # Comuna de residencia
    region = Column(String(100), nullable=True)                    # Región
    direccion = Column(String(300), nullable=True)                 # Dirección completa
    contacto_emergencia_nombre = Column(String(200), nullable=True)
    contacto_emergencia_telefono = Column(String(20), nullable=True)
    notas_medicas = Column(Text, nullable=True)                    # Alergias, condiciones previas
    activo = Column(Boolean, server_default='true', default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
