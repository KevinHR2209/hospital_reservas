from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class BoxBase(BaseModel):
    numero: int
    descripcion: Optional[str] = None


class BoxCreate(BoxBase):
    pass


class BoxOut(BaseModel):
    id: UUID
    numero: int
    descripcion: Optional[str]
    activo: bool

    class Config:
        from_attributes = True
