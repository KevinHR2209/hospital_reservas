"""Seed de datos iniciales: especialidades, boxes y médicos de prueba."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.especialidad import Especialidad
from app.models.medico import Medico
from app.models.box import Box
from app.models.horario_medico import HorarioMedico
from datetime import time

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ---- Especialidades ----
especialidades_data = [
    {"nombre": "Neurología", "descripcion": "Diagnóstico y tratamiento de enfermedades del sistema nervioso", "duracion_consulta_minutos": 40},
    {"nombre": "Kinesiología", "descripcion": "Rehabilitación física y motora", "duracion_consulta_minutos": 50},
    {"nombre": "Medicina General", "descripcion": "Atención primaria y control general", "duracion_consulta_minutos": 20},
    {"nombre": "Nutrición", "descripcion": "Evaluación nutricional y planes alimentarios", "duracion_consulta_minutos": 30},
    {"nombre": "Psicología", "descripcion": "Salud mental y bienestar emocional", "duracion_consulta_minutos": 50},
    {"nombre": "Psiquiatría", "descripcion": "Diagnóstico y tratamiento de trastornos mentales", "duracion_consulta_minutos": 40},
    {"nombre": "Cardiología", "descripcion": "Diagnóstico y tratamiento de enfermedades del corazón", "duracion_consulta_minutos": 40},
    {"nombre": "Dermatología", "descripcion": "Enfermedades de la piel, cabello y uñas", "duracion_consulta_minutos": 30},
    {"nombre": "Traumatología", "descripcion": "Lesiones musculoesqueléticas y traumatismos", "duracion_consulta_minutos": 30},
    {"nombre": "Oftalmología", "descripcion": "Salud visual y enfermedades oculares", "duracion_consulta_minutos": 30},
    {"nombre": "Pediatría", "descripcion": "Atención médica para niños y adolescentes", "duracion_consulta_minutos": 30},
    {"nombre": "Ginecología", "descripcion": "Salud reproductiva femenina", "duracion_consulta_minutos": 30},
]

if db.query(Especialidad).count() == 0:
    esp_objs = [Especialidad(**e) for e in especialidades_data]
    db.add_all(esp_objs)
    db.commit()
    print(f"[SEED] {len(esp_objs)} especialidades creadas")
else:
    print("[SEED] Especialidades ya existen, omitiendo.")

# ---- Boxes ----
if db.query(Box).count() == 0:
    boxes = [Box(numero=i, descripcion=f"Box de atención N°{i}") for i in range(1, 13)]
    db.add_all(boxes)
    db.commit()
    print(f"[SEED] {len(boxes)} boxes creados")

# ---- Médicos ----
if db.query(Medico).count() == 0:
    especialidades = {e.nombre: e for e in db.query(Especialidad).all()}
    boxes = db.query(Box).order_by(Box.numero).all()
    medicos_data = [
        {"nombre": "Carlos", "apellido": "Meza", "email": "carlos.meza@hospital.cl", "especialidad": "Neurología", "box_idx": 0},
        {"nombre": "Ana", "apellido": "Torres", "email": "ana.torres@hospital.cl", "especialidad": "Kinesiología", "box_idx": 1},
        {"nombre": "Jorge", "apellido": "Fuentes", "email": "jorge.fuentes@hospital.cl", "especialidad": "Medicina General", "box_idx": 2},
        {"nombre": "María", "apellido": "Lagos", "email": "maria.lagos@hospital.cl", "especialidad": "Nutrición", "box_idx": 3},
        {"nombre": "Felipe", "apellido": "Rojas", "email": "felipe.rojas@hospital.cl", "especialidad": "Psicología", "box_idx": 4},
        {"nombre": "Valentina", "apellido": "Araya", "email": "valentina.araya@hospital.cl", "especialidad": "Psiquiatría", "box_idx": 5},
        {"nombre": "Ricardo", "apellido": "Contreras", "email": "ricardo.contreras@hospital.cl", "especialidad": "Cardiología", "box_idx": 6},
        {"nombre": "Camila", "apellido": "Muñoz", "email": "camila.munoz@hospital.cl", "especialidad": "Dermatología", "box_idx": 7},
        {"nombre": "Andrés", "apellido": "Vargas", "email": "andres.vargas@hospital.cl", "especialidad": "Traumatología", "box_idx": 8},
        {"nombre": "Ignacia", "apellido": "Soto", "email": "ignacia.soto@hospital.cl", "especialidad": "Oftalmología", "box_idx": 9},
        {"nombre": "Patricio", "apellido": "González", "email": "patricio.gonzalez@hospital.cl", "especialidad": "Pediatría", "box_idx": 10},
        {"nombre": "Gabriela", "apellido": "Pizarro", "email": "gabriela.pizarro@hospital.cl", "especialidad": "Ginecología", "box_idx": 11},
    ]
    medico_objs = []
    for m in medicos_data:
        esp = especialidades.get(m["especialidad"])
        if esp:
            medico_objs.append(Medico(
                nombre=m["nombre"], apellido=m["apellido"],
                email=m["email"],
                especialidad_id=esp.id,
                box_id=boxes[m["box_idx"]].id if m["box_idx"] < len(boxes) else None,
            ))
    db.add_all(medico_objs)
    db.commit()
    print(f"[SEED] {len(medico_objs)} médicos creados")

# ---- Horarios: siempre verificar y crear si faltan ----
medicos_sin_horario = [
    m for m in db.query(Medico).filter(Medico.activo == True).all()
    if db.query(HorarioMedico).filter(HorarioMedico.medico_id == m.id).count() == 0
]
if medicos_sin_horario:
    for medico in medicos_sin_horario:
        for dia in range(0, 5):  # Lunes a Viernes
            db.add(HorarioMedico(
                medico_id=medico.id,
                dia_semana=dia,
                hora_inicio=time(8, 0),
                hora_fin=time(17, 0),
            ))
    db.commit()
    print(f"[SEED] Horarios creados para {len(medicos_sin_horario)} médicos")
else:
    print("[SEED] Todos los médicos ya tienen horarios.")

db.close()
print("[SEED] Completado.")
