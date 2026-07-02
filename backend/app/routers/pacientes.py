from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.paciente import Paciente
from app.schemas.paciente import PacienteCreate, PacienteUpdate, PacienteOut

router = APIRouter()


@router.get("/", response_model=List[PacienteOut])
def listar_pacientes(solo_activos: bool = True, db: Session = Depends(get_db)):
    q = db.query(Paciente)
    if solo_activos:
        q = q.filter(Paciente.activo == True)
    return q.order_by(Paciente.apellido, Paciente.nombre).all()


@router.get("/buscar", response_model=List[PacienteOut])
def buscar_paciente(rut: str = None, email: str = None, db: Session = Depends(get_db)):
    if not rut and not email:
        raise HTTPException(status_code=400, detail="Debe proporcionar rut o email para buscar")
    q = db.query(Paciente).filter(Paciente.activo == True)
    if rut:
        q = q.filter(Paciente.rut == rut)
    if email:
        q = q.filter(Paciente.email == email)
    return q.all()


@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener_paciente(paciente_id: UUID, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente


@router.post("/", response_model=PacienteOut, status_code=201)
def crear_paciente(data: PacienteCreate, db: Session = Depends(get_db)):
    if db.query(Paciente).filter(Paciente.rut == data.rut).first():
        raise HTTPException(status_code=409, detail="Ya existe un paciente con ese RUT")
    if db.query(Paciente).filter(Paciente.email == data.email).first():
        raise HTTPException(status_code=409, detail="Ya existe un paciente con ese correo")
    paciente = Paciente(**data.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.patch("/{paciente_id}", response_model=PacienteOut)
def actualizar_paciente(paciente_id: UUID, data: PacienteUpdate, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(paciente, campo, valor)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=204)
def desactivar_paciente(paciente_id: UUID, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    paciente.activo = False
    db.commit()
