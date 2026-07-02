import secrets
from datetime import datetime, timedelta, date as date_type
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.reserva import Reserva
from app.models.medico import Medico
from app.models.paciente import Paciente
from app.models.especialidad import Especialidad
from app.models.horario_medico import HorarioMedico
from app.schemas.reserva import ReservaCreate
from app.services.email_service import enviar_confirmacion_reserva


MIN_ANTICIPACION_HORAS = 2  # No se puede reservar con menos de 2 horas de antelación


def crear_reserva(db: Session, data: ReservaCreate) -> Reserva:
    # 1. Validar que la fecha no sea en el pasado
    ahora = datetime.now()
    fecha_hora_reserva = datetime.combine(data.fecha, data.hora_inicio)
    if fecha_hora_reserva <= ahora:
        raise HTTPException(status_code=400, detail="No se pueden crear reservas en el pasado")

    # 2. Validar anticipación mínima de 2 horas
    if fecha_hora_reserva < ahora + timedelta(hours=MIN_ANTICIPACION_HORAS):
        raise HTTPException(
            status_code=400,
            detail=f"La reserva debe realizarse con al menos {MIN_ANTICIPACION_HORAS} horas de anticipación"
        )

    # 3. Validar médico activo
    medico = db.query(Medico).filter(Medico.id == data.medico_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado o inactivo")

    # 4. Validar que la especialidad del médico coincide con la especialidad solicitada
    if str(medico.especialidad_id) != str(data.especialidad_id):
        raise HTTPException(
            status_code=400,
            detail="La especialidad seleccionada no corresponde a la especialidad del médico"
        )

    # 5. Validar especialidad activa
    especialidad = db.query(Especialidad).filter(
        Especialidad.id == data.especialidad_id,
        Especialidad.activa == True
    ).first()
    if not especialidad:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada o inactiva")

    # 6. Validar paciente
    paciente = db.query(Paciente).filter(Paciente.id == data.paciente_id, Paciente.activo == True).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 7. Validar que el médico atiende ese día de la semana
    dia_semana = data.fecha.weekday()
    horario = db.query(HorarioMedico).filter(
        HorarioMedico.medico_id == data.medico_id,
        HorarioMedico.dia_semana == dia_semana,
        HorarioMedico.activo == True,
    ).first()
    if not horario:
        raise HTTPException(status_code=400, detail="El médico no atiende ese día")

    # 8. Calcular hora_fin según duración de la especialidad
    hora_inicio = data.hora_inicio
    hora_fin = (datetime.combine(data.fecha, hora_inicio) + timedelta(minutes=especialidad.duracion_consulta_minutos)).time()

    # 9. Validar que la hora esté dentro del horario del médico
    if hora_inicio < horario.hora_inicio or hora_fin > horario.hora_fin:
        raise HTTPException(
            status_code=400,
            detail=f"La hora solicitada está fuera del horario del médico ({horario.hora_inicio.strftime('%H:%M')} - {horario.hora_fin.strftime('%H:%M')})"
        )

    # 10. Verificar conflicto de horario (solapamiento)
    conflicto = db.query(Reserva).filter(
        Reserva.medico_id == data.medico_id,
        Reserva.fecha == data.fecha,
        Reserva.estado != "cancelada",
        Reserva.hora_inicio < hora_fin,
        Reserva.hora_fin > hora_inicio,
    ).first()
    if conflicto:
        raise HTTPException(status_code=409, detail="El médico ya tiene una reserva en ese horario")

    # 11. Validar que el paciente no tenga ya 2 reservas activas el mismo día
    reservas_paciente_dia = db.query(Reserva).filter(
        Reserva.paciente_id == data.paciente_id,
        Reserva.fecha == data.fecha,
        Reserva.estado != "cancelada",
    ).count()
    if reservas_paciente_dia >= 2:
        raise HTTPException(
            status_code=409,
            detail="El paciente ya tiene 2 reservas activas para ese día"
        )

    # 12. Asignar box del médico
    cancel_token = secrets.token_urlsafe(32)

    reserva = Reserva(
        paciente_id=data.paciente_id,
        medico_id=data.medico_id,
        especialidad_id=data.especialidad_id,
        box_id=medico.box_id,
        fecha=data.fecha,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        motivo_consulta=data.motivo_consulta,
        notas=data.notas,
        cancel_token=cancel_token,
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    # 13. Enviar email de confirmación
    try:
        if paciente.email:
            enviar_confirmacion_reserva(paciente.email, {
                "paciente_nombre": paciente.nombre,
                "paciente_apellido": paciente.apellido,
                "medico": f"Dr(a). {medico.nombre} {medico.apellido}",
                "especialidad": especialidad.nombre,
                "fecha": str(data.fecha),
                "hora": str(hora_inicio)[:5],
                "duracion": especialidad.duracion_consulta_minutos,
                "motivo": data.motivo_consulta or "",
                "cancel_token": cancel_token,
            })
    except Exception as e:
        print(f"[EMAIL] Error al enviar confirmación: {e}")

    return reserva
