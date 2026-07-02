from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hospital Reservas API",
    description="API REST para gestión de reservas médicas, especialistas y horarios",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Hospital Reservas API"}
