import uuid
from sqlalchemy import Column, String, Date, Time, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False)
    medico_id = Column(UUID(as_uuid=True), ForeignKey("medicos.id", ondelete="CASCADE"), nullable=False)
    especialidad_id = Column(UUID(as_uuid=True), ForeignKey("especialidades.id", ondelete="CASCADE"), nullable=False)
    box_id = Column(UUID(as_uuid=True), ForeignKey("boxes.id", ondelete="SET NULL"), nullable=True)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(String(20), nullable=False, default="reservada")  # reservada | completada | cancelada
    motivo_consulta = Column(Text, nullable=True)                      # Campo exclusivo del hospital
    notas = Column(Text, nullable=True)
    cancel_token = Column(String(64), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    paciente = relationship("Paciente")
    medico = relationship("Medico", back_populates="reservas")
    especialidad = relationship("Especialidad")
    box = relationship("Box")
