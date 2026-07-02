from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.horario_medico import HorarioMedico
from app.models.medico import Medico
from app.schemas.horario import HorarioMedicoCreate, HorarioMedicoUpdate, HorarioMedicoOut

router = APIRouter()

DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


@router.get("/medico/{medico_id}", response_model=List[HorarioMedicoOut])
def horarios_por_medico(medico_id: UUID, db: Session = Depends(get_db)):
    return db.query(HorarioMedico).filter(
        HorarioMedico.medico_id == medico_id
    ).order_by(HorarioMedico.dia_semana).all()


@router.post("/", response_model=HorarioMedicoOut, status_code=201)
def crear_horario(data: HorarioMedicoCreate, db: Session = Depends(get_db)):
    medico = db.query(Medico).filter(Medico.id == data.medico_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado o inactivo")
    if data.hora_fin <= data.hora_inicio:
        raise HTTPException(status_code=400, detail="hora_fin debe ser posterior a hora_inicio")
    # Upsert: si ya existe el horario para ese día, lo actualiza en vez de lanzar 409
    existente = db.query(HorarioMedico).filter(
        HorarioMedico.medico_id == data.medico_id,
        HorarioMedico.dia_semana == data.dia_semana
    ).first()
    if existente:
        existente.hora_inicio = data.hora_inicio
        existente.hora_fin = data.hora_fin
        existente.activo = True
        db.commit()
        db.refresh(existente)
        return existente
    horario = HorarioMedico(**data.model_dump())
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.patch("/{horario_id}", response_model=HorarioMedicoOut)
def actualizar_horario(horario_id: UUID, data: HorarioMedicoUpdate, db: Session = Depends(get_db)):
    horario = db.query(HorarioMedico).filter(HorarioMedico.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    payload = data.model_dump(exclude_unset=True)
    hi = payload.get("hora_inicio", horario.hora_inicio)
    hf = payload.get("hora_fin", horario.hora_fin)
    if hf <= hi:
        raise HTTPException(status_code=400, detail="hora_fin debe ser posterior a hora_inicio")
    for campo, valor in payload.items():
        setattr(horario, campo, valor)
    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{horario_id}", status_code=204)
def eliminar_horario(horario_id: UUID, db: Session = Depends(get_db)):
    horario = db.query(HorarioMedico).filter(HorarioMedico.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(horario)
    db.commit()
