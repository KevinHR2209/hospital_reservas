# 🏥 Hospital Reservas

Sistema de reservas médicas para hospital. Permite agendar horas con especialistas de salud.

## Especialidades disponibles
- Neurología, Kinesiología, Medicina General, Nutrición
- Psicología, Psiquiatría, Cardiología, Dermatología
- Traumatología, Oftalmología, Pediatría, Ginecología

## Stack tecnológico
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + Vite
- **Infraestructura:** Docker + Docker Compose

## Levantar el proyecto

```bash
cp .env.example .env
docker-compose up --build
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

## Variables de entorno
Ver `.env.example` para la configuración necesaria.
