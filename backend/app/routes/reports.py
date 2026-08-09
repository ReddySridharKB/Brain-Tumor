from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import MRIScan, Patient
from app.reports.pdf_generator import generate_pdf_report
from app.routes.auth import get_current_user_data, require_roles

router = APIRouter(prefix="/report", tags=["Reports"])

@router.get("/pdf/{scan_id}")
def get_pdf_report(scan_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    scan = db.query(MRIScan).filter(MRIScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    patient = db.query(Patient).filter(Patient.id == scan.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Patient role can only view their own reports
    if current_user.get("role") == "patient" and current_user.get("patient_id") != patient.id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only access your own reports.")
        
    pdf_path = generate_pdf_report(scan, patient)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"report_scan_{scan.id}.pdf")

@router.get("/comparison/pdf/{scan1_id}/{scan2_id}")
def get_comparison_pdf_report(scan1_id: int, scan2_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    scan1 = db.query(MRIScan).filter(MRIScan.id == scan1_id).first()
    scan2 = db.query(MRIScan).filter(MRIScan.id == scan2_id).first()
    
    if not scan1 or not scan2:
        raise HTTPException(status_code=404, detail="One or more scans not found")
        
    if scan1.patient_id != scan2.patient_id:
        raise HTTPException(status_code=400, detail="Scans belong to different patients")
        
    patient = db.query(Patient).filter(Patient.id == scan1.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    from app.reports.pdf_generator import generate_comparison_pdf_report
    pdf_path = generate_comparison_pdf_report(scan1, scan2, patient)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"comparison_report_{scan1.id}_vs_{scan2.id}.pdf")
