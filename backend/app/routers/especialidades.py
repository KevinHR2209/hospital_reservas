from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.especialidad import Especialidad
from app.schemas.especialidad import EspecialidadCreate, EspecialidadUpdate, EspecialidadOut

router = APIRouter()


@router.get("/", response_model=List[EspecialidadOut])
def listar_especialidades(solo_activas: bool = True, db: Session = Depends(get_db)):
    q = db.query(Especialidad)
    if solo_activas:
        q = q.filter(Especialidad.activa == True)
    return q.order_by(Especialidad.nombre).all()


@router.get("/{especialidad_id}", response_model=EspecialidadOut)
def obtener_especialidad(especialidad_id: UUID, db: Session = Depends(get_db)):
    esp = db.query(Especialidad).filter(Especialidad.id == especialidad_id).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    return esp


@router.post("/", response_model=EspecialidadOut, status_code=201)
def crear_especialidad(data: EspecialidadCreate, db: Session = Depends(get_db)):
    existente = db.query(Especialidad).filter(Especialidad.nombre == data.nombre).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe una especialidad con ese nombre")
    esp = Especialidad(**data.model_dump())
    db.add(esp)
    db.commit()
    db.refresh(esp)
    return esp


@router.patch("/{especialidad_id}", response_model=EspecialidadOut)
def actualizar_especialidad(especialidad_id: UUID, data: EspecialidadUpdate, db: Session = Depends(get_db)):
    esp = db.query(Especialidad).filter(Especialidad.id == especialidad_id).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(esp, campo, valor)
    db.commit()
    db.refresh(esp)
    return esp


@router.delete("/{especialidad_id}", status_code=204)
def eliminar_especialidad(especialidad_id: UUID, db: Session = Depends(get_db)):
    esp = db.query(Especialidad).filter(Especialidad.id == especialidad_id).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    esp.activa = False
    db.commit()
