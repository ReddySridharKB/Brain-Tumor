from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # "admin" or "doctor"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True, index=True)
    patient_uid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    age = Column(Integer)
    sex = Column(String)
    dob = Column(String)
    blood_group = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)

    scans = relationship("MRIScan", back_populates="patient", cascade="all, delete-orphan")


class MRIScan(Base):
    __tablename__ = "mri_scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_uid = Column(String, unique=True, index=True, default=lambda: f"SCN-{uuid.uuid4().hex[:8].upper()}")
    patient_id = Column(Integer, ForeignKey("patients.id"))
    original_image_path = Column(String)
    highlighted_image_path = Column(String, nullable=True)
    heatmap_path = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # AI Analysis Results
    tumor_type = Column(String, nullable=True)
    tumor_risk = Column(String, nullable=True)
    probability = Column(Float, nullable=True)
    tumor_location = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    severity = Column(String, nullable=True)
    
    # Progression Tracking
    comparison_result = Column(String, nullable=True)
    growth_percentage = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="scans")
    analytics = relationship("Analytics", back_populates="scan", cascade="all, delete-orphan")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("mri_scans.id"))
    chart_path = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan = relationship("MRIScan", back_populates="analytics")
