import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def _enviar_email(destinatario: str, asunto: str, html: str):
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL] Simulando envío a {destinatario}: {asunto}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = f"Hospital Reservas <{SMTP_USER}>"
    msg["To"] = destinatario
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())


def enviar_confirmacion_reserva(email: str, datos: Dict[str, Any]):
    cancel_url = f"{BACKEND_URL}/api/reservas/cancelar/{datos.get('cancel_token', '')}"
    html = f"""
    <!DOCTYPE html><html lang="es">
    <head><meta charset="UTF-8">
    <style>
      body{{font-family:Arial,sans-serif;background:#f0f7ff;padding:24px;color:#1e293b}}
      .container{{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,64,128,.10)}}
      .header{{background:linear-gradient(135deg,#0284c7,#0ea5e9);padding:32px 28px;text-align:center;color:#fff}}
      .header h1{{margin:0 0 6px;font-size:22px}}
      .body{{padding:28px}}
      .detail{{background:#f8faff;border-radius:12px;padding:18px 20px;margin:18px 0;border:1px solid #e0eeff}}
      .detail table{{width:100%}}
      .detail td{{padding:6px 0;font-size:14px}}
      .detail td:first-child{{font-weight:bold;width:130px;color:#64748b}}
      .btn{{display:inline-block;padding:12px 28px;border-radius:10px;font-weight:bold;font-size:14px;text-decoration:none;margin-top:8px}}
      .btn-cancel{{background:#fee2e2;color:#dc2626}}
      .footer{{text-align:center;padding:16px;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9}}
    </style></head>
    <body><div class="container">
      <div class="header">
        <h1>🏥 Confirmación de Reserva Médica</h1>
        <p>Tu hora ha sido reservada exitosamente</p>
      </div>
      <div class="body">
        <p>Hola <strong>{datos.get('paciente_nombre')} {datos.get('paciente_apellido')}</strong>,</p>
        <p>Tu hora médica ha sido confirmada con los siguientes datos:</p>
        <div class="detail">
          <table>
            <tr><td>👨‍⚕️ Médico</td><td>{datos.get('medico')}</td></tr>
            <tr><td>🦳 Especialidad</td><td>{datos.get('especialidad')}</td></tr>
            <tr><td>📅 Fecha</td><td>{datos.get('fecha')}</td></tr>
            <tr><td>⏰ Hora</td><td>{datos.get('hora')}</td></tr>
            <tr><td>⏱️ Duración</td><td>{datos.get('duracion')} minutos</td></tr>
            {f"<tr><td>&#128203; Motivo</td><td>{datos.get('motivo')}</td></tr>" if datos.get('motivo') else ''}
          </table>
        </div>
        <p>Si necesitas cancelar tu hora, haz clic en el siguiente enlace. Este enlace es de un solo uso.</p>
        <a href="{cancel_url}" class="btn btn-cancel">❌ Cancelar mi hora</a>
      </div>
      <div class="footer">Hospital Reservas — Cuida tu salud</div>
    </div></body></html>
    """
    _enviar_email(email, f"⏰ Confirmación de hora — {datos.get('especialidad')}", html)
