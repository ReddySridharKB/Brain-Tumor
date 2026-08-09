from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.config.settings import settings
from app.routes import patients, scans, analytics, reports, auth, eeg
from sqlalchemy import text, inspect
from app.routes.auth import hash_password
from app.models.models import User

import logging

logging.basicConfig(level=logging.INFO)

# Dynamic Database Migration on Startup
inspector = inspect(engine)
if "patients" in inspector.get_table_names():
    columns = [col["name"] for col in inspector.get_columns("patients")]
    if "is_deleted" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE patients ADD COLUMN is_deleted BOOLEAN DEFAULT 0"))
    if "deleted_at" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE patients ADD COLUMN deleted_at DATETIME"))

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default clinical staff accounts if they don't exist
from app.database.database import SessionLocal
db = SessionLocal()
try:
    admin_exists = db.query(User).filter(User.username == "admin").first()
    if not admin_exists:
        admin_user = User(
            username="admin",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        db.add(admin_user)
        logging.info("Seeded default admin account: admin/admin123")
    
    doctor_exists = db.query(User).filter(User.username == "doctor").first()
    if not doctor_exists:
        doctor_user = User(
            username="doctor",
            password_hash=hash_password("doctor123"),
            role="doctor"
        )
        db.add(doctor_user)
        logging.info("Seeded default doctor account: doctor/doctor123")
    db.commit()
except Exception as e:
    db.rollback()
    logging.error(f"Error seeding default users: {e}")
finally:
    db.close()

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(scans.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(eeg.router, prefix=settings.API_V1_STR)

from fastapi.responses import FileResponse
import os

@app.get(f"{settings.API_V1_STR}/static/{{file_path:path}}")
def get_static_file(file_path: str):
    # Depending on how the frontend passes it, it might be URL encoded.
    # FastAPI path parameters are automatically url-decoded.
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    return FileResponse(file_path)

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API"}
