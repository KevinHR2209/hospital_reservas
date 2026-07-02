import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Medico(Base):
    __tablename__ = "medicos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    telefono = Column(String(20), nullable=True)
    rut = Column(String(15), unique=True, nullable=True)  # RUT médico
    registro_superintendencia = Column(String(50), nullable=True)  # Número de registro profesional
    especialidad_id = Column(UUID(as_uuid=True), ForeignKey("especialidades.id"), nullable=False)
    box_id = Column(UUID(as_uuid=True), ForeignKey("boxes.id"), nullable=True)
    foto_url = Column(String(300), nullable=True)
    biografia = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    especialidad = relationship("Especialidad", back_populates="medicos")
    box = relationship("Box")
    horarios = relationship("HorarioMedico", back_populates="medico", cascade="all, delete")
    reservas = relationship("Reserva", back_populates="medico")
