import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Box(Base):
    __tablename__ = "boxes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero = Column(Integer, unique=True, nullable=False)
    descripcion = Column(String(200), nullable=True)  # ej: "Box Neurología - Piso 2"
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
