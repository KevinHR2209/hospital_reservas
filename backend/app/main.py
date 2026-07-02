from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import especialidades, medicos, horarios, pacientes, boxes, reservas

# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hospital Reservas API",
    description="Sistema de reservas médicas: pacientes, médicos, especialidades y horarios.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(especialidades.router, prefix="/api/especialidades", tags=["Especialidades"])
app.include_router(medicos.router, prefix="/api/medicos", tags=["Médicos"])
app.include_router(horarios.router, prefix="/api/horarios", tags=["Horarios"])
app.include_router(pacientes.router, prefix="/api/pacientes", tags=["Pacientes"])
app.include_router(boxes.router, prefix="/api/boxes", tags=["Boxes"])
app.include_router(reservas.router, prefix="/api/reservas", tags=["Reservas"])


@app.get("/")
def root():
    return {"message": "Hospital Reservas API funcionando 🏥"}
