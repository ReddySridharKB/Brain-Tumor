from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.schemas import MRIScanResponse
from app.services import scan_service
from app.ai.gemini_service import compare_scans
from pydantic import BaseModel
from app.routes.auth import get_current_user_data, require_roles

router = APIRouter(prefix="/scans", tags=["MRI Scans"])

class CompareResponse(BaseModel):
    comparison_result: str
    growth_percentage: float
    progression_summary: str


@router.post("/upload/{patient_id}", response_model=MRIScanResponse)
def upload_scan(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    scan = scan_service.upload_and_analyze_scan(db=db, patient_id=patient_id, file=file)
    if not scan:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return scan

@router.get("/history/{patient_id}", response_model=List[MRIScanResponse])
def get_scan_history(patient_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    if current_user.get("role") == "patient" and current_user.get("patient_id") != patient_id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only view your own scan history.")
        
    scans = scan_service.get_scan_history(db=db, patient_id=patient_id)
    return scans

@router.get("/{scan_id}", response_model=MRIScanResponse)
def get_scan(scan_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    scan = scan_service.get_scan_by_id(db=db, scan_id=scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    if current_user.get("role") == "patient" and current_user.get("patient_id") != scan.patient_id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only access your own scans.")
        
    return scan

@router.get("/compare/{scan1_id}/{scan2_id}", response_model=CompareResponse)
def compare_two_scans(scan1_id: int, scan2_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    scan1 = scan_service.get_scan_by_id(db=db, scan_id=scan1_id)
    scan2 = scan_service.get_scan_by_id(db=db, scan_id=scan2_id)
    if not scan1 or not scan2:
        raise HTTPException(status_code=404, detail="One or both scans not found")
    
    # Use gemini service to compare
    comp_res = compare_scans(scan1.ai_summary or "", scan2.ai_summary or "")
    
    return CompareResponse(
        comparison_result=comp_res.get("comparison_result", "unknown"),
        growth_percentage=comp_res.get("growth_percentage", 0.0),
        progression_summary=comp_res.get("progression_summary", "")
    )
