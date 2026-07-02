from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.box import Box
from app.schemas.box import BoxCreate, BoxOut

router = APIRouter()


@router.get("/", response_model=List[BoxOut])
def listar_boxes(db: Session = Depends(get_db)):
    return db.query(Box).order_by(Box.numero).all()


@router.get("/{box_id}", response_model=BoxOut)
def obtener_box(box_id: UUID, db: Session = Depends(get_db)):
    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box no encontrado")
    return box


@router.post("/", response_model=BoxOut, status_code=201)
def crear_box(data: BoxCreate, db: Session = Depends(get_db)):
    existente = db.query(Box).filter(Box.numero == data.numero).first()
    if existente:
        raise HTTPException(status_code=409, detail=f"Ya existe el Box N°{data.numero}")
    box = Box(**data.model_dump())
    db.add(box)
    db.commit()
    db.refresh(box)
    return box


@router.patch("/{box_id}/toggle", response_model=BoxOut)
def toggle_box(box_id: UUID, db: Session = Depends(get_db)):
    box = db.query(Box).filter(Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box no encontrado")
    box.activo = not box.activo
    db.commit()
    db.refresh(box)
    return box
