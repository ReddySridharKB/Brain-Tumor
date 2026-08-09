from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.schemas import PatientCreate, PatientResponse, PatientWithScans
from app.services import patient_service
from app.routes.auth import get_current_user_data, require_roles

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.post("/create", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    return patient_service.create_patient(db=db, patient=patient)

@router.get("/", response_model=List[PatientResponse])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    return patient_service.get_patients(db=db, skip=skip, limit=limit)

@router.get("/deleted", response_model=List[PatientResponse])
def get_deleted_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    return patient_service.get_deleted_patients(db=db, skip=skip, limit=limit)

@router.get("/{id}", response_model=PatientWithScans)
def get_patient(id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    # Patient role can only access their own patient ID
    if current_user.get("role") == "patient" and current_user.get("patient_id") != id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only view your own records.")
        
    db_patient = patient_service.get_patient(db=db, patient_id=id, include_deleted=(current_user.get("role") == "admin"))
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient_route(id: int, patient: PatientCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    updated = patient_service.update_patient(db=db, patient_id=id, patient_update=patient)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated

@router.post("/{id}/restore", response_model=PatientResponse)
def restore_patient_route(id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    restored = patient_service.restore_patient(db=db, patient_id=id)
    if not restored:
        raise HTTPException(status_code=404, detail="Patient not found in recycle bin")
    return restored

@router.delete("/{id}")
def delete_patient_route(id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    success = patient_service.delete_patient(db=db, patient_id=id, permanent=False)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success", "message": "Patient soft deleted successfully"}

@router.delete("/{id}/permanent")
def permanent_delete_patient_route(id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    success = patient_service.delete_patient(db=db, patient_id=id, permanent=True)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success", "message": "Patient permanently deleted"}
