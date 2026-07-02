from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.reserva import Reserva
from app.models.medico import Medico
from app.models.horario_medico import HorarioMedico
from app.schemas.reserva import ReservaCreate, ReservaUpdateEstado, ReservaOut
from app.services.reserva_service import crear_reserva

router = APIRouter()


def _q(db: Session):
    return db.query(Reserva).options(
        joinedload(Reserva.paciente),
        joinedload(Reserva.medico).joinedload(Medico.especialidad),
        joinedload(Reserva.especialidad),
        joinedload(Reserva.box),
    )


@router.get("/", response_model=List[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    return _q(db).order_by(Reserva.fecha, Reserva.hora_inicio).all()


@router.get("/medico/{medico_id}", response_model=List[ReservaOut])
def reservas_por_medico(medico_id: UUID, db: Session = Depends(get_db)):
    return _q(db).filter(
        Reserva.medico_id == medico_id,
        Reserva.estado != "cancelada",
    ).order_by(Reserva.fecha, Reserva.hora_inicio).all()


@router.get("/paciente/{paciente_id}", response_model=List[ReservaOut])
def reservas_por_paciente(paciente_id: UUID, db: Session = Depends(get_db)):
    return _q(db).filter(
        Reserva.paciente_id == paciente_id,
    ).order_by(Reserva.fecha.desc(), Reserva.hora_inicio).all()


@router.get("/disponibilidad/{medico_id}/{fecha}")
def disponibilidad_medico(medico_id: UUID, fecha: date, db: Session = Depends(get_db)):
    from app.models.especialidad import Especialidad

    medico = db.query(Medico).filter(Medico.id == medico_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")

    especialidad = db.query(Especialidad).filter(Especialidad.id == medico.especialidad_id).first()
    duracion = int(especialidad.duracion_consulta_minutos) if especialidad else 30

    dia_semana = fecha.weekday()
    horario = db.query(HorarioMedico).filter(
        HorarioMedico.medico_id == medico_id,
        HorarioMedico.dia_semana == dia_semana,
        HorarioMedico.activo == True,
    ).first()

    if not horario:
        return {"atiende": False, "bloques": [], "medico": f"Dr(a). {medico.nombre} {medico.apellido}"}

    reservas_del_dia = db.query(Reserva).filter(
        Reserva.medico_id == medico_id,
        Reserva.fecha == fecha,
        Reserva.estado != "cancelada",
    ).all()

    bloques = []
    ahora = datetime.now()
    cursor = datetime.combine(fecha, horario.hora_inicio)
    fin_jornada = datetime.combine(fecha, horario.hora_fin)

    while cursor + timedelta(minutes=duracion) <= fin_jornada:
        hora_bloque = cursor.time()
        fin_bloque = (cursor + timedelta(minutes=duracion)).time()

        en_el_pasado = datetime.combine(fecha, hora_bloque) < ahora + timedelta(hours=2)

        ocupado = any(
            r.hora_inicio <= hora_bloque < r.hora_fin or
            r.hora_inicio < fin_bloque <= r.hora_fin
            for r in reservas_del_dia
        )

        bloques.append({
            "hora": str(hora_bloque)[:5],
            "hora_fin": str(fin_bloque)[:5],
            "ocupado": ocupado or en_el_pasado,
            "disponible": not ocupado and not en_el_pasado,
        })
        cursor += timedelta(minutes=duracion)

    return {
        "atiende": True,
        "medico": f"Dr(a). {medico.nombre} {medico.apellido}",
        "especialidad": especialidad.nombre if especialidad else "",
        "duracion_minutos": duracion,
        "bloques": bloques,
    }


@router.post("/", response_model=ReservaOut, status_code=201)
def nueva_reserva(data: ReservaCreate, db: Session = Depends(get_db)):
    reserva = crear_reserva(db, data)
    return _q(db).filter(Reserva.id == reserva.id).first()


@router.patch("/{reserva_id}/estado", response_model=ReservaOut)
def cambiar_estado_reserva(reserva_id: UUID, data: ReservaUpdateEstado, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    estados_validos = ["reservada", "completada", "cancelada"]
    if data.estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {estados_validos}")

    if reserva.estado == "completada" and data.estado == "cancelada":
        raise HTTPException(status_code=400, detail="No se puede cancelar una reserva ya completada")

    reserva.estado = data.estado
    if data.estado == "cancelada":
        reserva.cancel_token = None
    db.commit()
    return _q(db).filter(Reserva.id == reserva_id).first()


@router.get("/cancelar/{token}", response_class=HTMLResponse)
def cancelar_por_token(token: str, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).options(
        joinedload(Reserva.paciente),
        joinedload(Reserva.medico),
        joinedload(Reserva.especialidad),
    ).filter(Reserva.cancel_token == token).first()

    if not reserva:
        return HTMLResponse(_html_error("Token inválido", "Este enlace de cancelación no es válido o ya fue usado."), status_code=404)
    if reserva.estado == "cancelada":
        return HTMLResponse(_html_info("Ya cancelada", "Esta reserva ya estaba cancelada anteriormente."), status_code=200)
    if reserva.estado == "completada":
        return HTMLResponse(_html_error("No cancelable", "Esta reserva ya fue completada y no se puede cancelar."), status_code=400)

    reserva.estado = "cancelada"
    reserva.cancel_token = None
    db.commit()

    nombre = f"{reserva.paciente.nombre} {reserva.paciente.apellido}" if reserva.paciente else "Paciente"
    medico_str = f"Dr(a). {reserva.medico.nombre} {reserva.medico.apellido}" if reserva.medico else ""
    especialidad_str = reserva.especialidad.nombre if reserva.especialidad else ""
    return HTMLResponse(_html_ok(nombre, medico_str, especialidad_str, str(reserva.fecha), str(reserva.hora_inicio)[:5]))


@router.get("/{reserva_id}", response_model=ReservaOut)
def obtener_reserva(reserva_id: UUID, db: Session = Depends(get_db)):
    r = _q(db).filter(Reserva.id == reserva_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return r


def _base_html(titulo, icono, color, mensaje, detalle=""):
    return f"""<!DOCTYPE html><html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{titulo} — Hospital Reservas</title>
    <style>*{{box-sizing:border-box;margin:0;padding:0}}body{{font-family:Inter,Arial,sans-serif;background:#f0f7ff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}}.card{{background:#fff;border-radius:20px;padding:48px 40px;max-width:460px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,64,128,0.12)}}.icon{{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 24px}}h1{{font-size:24px;font-weight:900;color:#0f172a;margin-bottom:8px}}p{{color:#475569;font-size:15px;line-height:1.6;margin-bottom:8px}}.detail{{background:#f8faff;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:left;border:1px solid #e2e8f0}}.detail p{{font-size:14px;margin-bottom:6px;color:#334155}}.detail strong{{color:#0f172a}}.btn{{display:inline-block;margin-top:24px;background:#0284c7;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px}}.brand{{color:#94a3b8;font-size:13px;margin-top:24px}}</style></head>
    <body><div class="card"><div class="icon" style="background:{color}20"><span>{icono}</span></div><h1>{titulo}</h1><p>{mensaje}</p>{detalle}<p class="brand">🏥 Hospital Reservas</p></div></body></html>"""

def _html_ok(nombre, medico, especialidad, fecha, hora):
    det = f"<div class='detail'><p>Paciente: <strong>{nombre}</strong></p><p>Médico: <strong>{medico}</strong></p><p>Especialidad: <strong>{especialidad}</strong></p><p>Fecha: <strong>{fecha}</strong></p><p>Hora: <strong>{hora}</strong></p></div><a href='http://localhost:5173/reservar' class='btn'>Nueva reserva</a>"
    return _base_html("Reserva cancelada", "✅", "#22c55e", "Tu reserva ha sido cancelada exitosamente.", det)

def _html_error(titulo, mensaje):
    return _base_html(titulo, "❌", "#ef4444", mensaje)

def _html_info(titulo, mensaje):
    return _base_html(titulo, "ℹ️", "#3b82f6", mensaje)
