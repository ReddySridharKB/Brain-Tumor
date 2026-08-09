from sqlalchemy.orm import Session
from app.models.models import Patient
from app.schemas.schemas import PatientCreate
from datetime import datetime, timezone

def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient(db: Session, patient_id: int, include_deleted: bool = False):
    query = db.query(Patient).filter(Patient.id == patient_id)
    if not include_deleted:
        query = query.filter(Patient.is_deleted == False)
    return query.first()

def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).filter(Patient.is_deleted == False).offset(skip).limit(limit).all()

def get_deleted_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).filter(Patient.is_deleted == True).offset(skip).limit(limit).all()

def delete_patient(db: Session, patient_id: int, permanent: bool = False):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        if permanent:
            db.delete(patient)
        else:
            patient.is_deleted = True
            patient.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False

def restore_patient(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        patient.is_deleted = False
        patient.deleted_at = None
        db.commit()
        db.refresh(patient)
        return patient
    return None

def update_patient(db: Session, patient_id: int, patient_update: PatientCreate):
    db_patient = get_patient(db, patient_id)
    if db_patient:
        update_data = patient_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_patient, key, value)
        db.commit()
        db.refresh(db_patient)
    return db_patient
