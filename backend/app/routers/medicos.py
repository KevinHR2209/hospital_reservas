from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.medico import Medico
from app.models.especialidad import Especialidad
from app.schemas.medico import MedicoCreate, MedicoUpdate, MedicoOut

router = APIRouter()


@router.get("/", response_model=List[MedicoOut])
def listar_medicos(
    especialidad_id: Optional[UUID] = None,
    solo_activos: bool = True,
    db: Session = Depends(get_db)
):
    q = db.query(Medico).options(joinedload(Medico.especialidad))
    if solo_activos:
        q = q.filter(Medico.activo == True)
    if especialidad_id:
        q = q.filter(Medico.especialidad_id == especialidad_id)
    return q.order_by(Medico.apellido, Medico.nombre).all()


@router.get("/{medico_id}", response_model=MedicoOut)
def obtener_medico(medico_id: UUID, db: Session = Depends(get_db)):
    medico = db.query(Medico).options(joinedload(Medico.especialidad)).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    return medico


@router.post("/", response_model=MedicoOut, status_code=201)
def crear_medico(data: MedicoCreate, db: Session = Depends(get_db)):
    especialidad = db.query(Especialidad).filter(Especialidad.id == data.especialidad_id, Especialidad.activa == True).first()
    if not especialidad:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada o inactiva")
    existente = db.query(Medico).filter(Medico.email == data.email).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe un médico con ese correo")
    medico = Medico(**data.model_dump())
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return db.query(Medico).options(joinedload(Medico.especialidad)).filter(Medico.id == medico.id).first()


@router.patch("/{medico_id}", response_model=MedicoOut)
def actualizar_medico(medico_id: UUID, data: MedicoUpdate, db: Session = Depends(get_db)):
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    if data.especialidad_id:
        esp = db.query(Especialidad).filter(Especialidad.id == data.especialidad_id).first()
        if not esp:
            raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(medico, campo, valor)
    db.commit()
    db.refresh(medico)
    return db.query(Medico).options(joinedload(Medico.especialidad)).filter(Medico.id == medico.id).first()


@router.delete("/{medico_id}", status_code=204)
def desactivar_medico(medico_id: UUID, db: Session = Depends(get_db)):
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    medico.activo = False
    db.commit()
