from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, desc

from app.database.database import get_db
from app.models.models import MRIScan, Analytics, Patient
from app.analytics.chart_generator import generate_probability_chart

from app.routes.auth import get_current_user_data, require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    total_patients = db.query(Patient).filter(Patient.is_deleted == False).count()
    
    # Only count scans belonging to active (non-deleted) patients
    total_scans = db.query(MRIScan).join(Patient, MRIScan.patient_id == Patient.id).filter(Patient.is_deleted == False).count()
    
    # AI Detections (where tumor was found or risk > threshold, let's say probability > 0.5)
    ai_detections = db.query(MRIScan).join(Patient, MRIScan.patient_id == Patient.id).filter(Patient.is_deleted == False, MRIScan.probability > 0.5).count()
    
    # Critical Cases (severity is high or critical)
    critical_cases = db.query(MRIScan).join(Patient, MRIScan.patient_id == Patient.id).filter(
        Patient.is_deleted == False
    ).filter(
        (MRIScan.severity.ilike('%high%')) | 
        (MRIScan.severity.ilike('%critical%')) | 
        (MRIScan.tumor_risk.ilike('%high%'))
    ).count()

    # Weekly chart data — real counts from last 7 days
    today = datetime.now(timezone.utc).date()
    start_of_week = today - timedelta(days=6)

    # Total scans per day for active patients
    daily_scans = db.query(
        func.date(MRIScan.uploaded_at).label('date'),
        func.count(MRIScan.id).label('scans')
    ).join(Patient, MRIScan.patient_id == Patient.id).filter(
        Patient.is_deleted == False,
        MRIScan.uploaded_at >= str(start_of_week)
    ).group_by('date').all()

    # Positive detections per day (probability > 0.4) for active patients
    daily_positives = db.query(
        func.date(MRIScan.uploaded_at).label('date'),
        func.count(MRIScan.id).label('positive')
    ).join(Patient, MRIScan.patient_id == Patient.id).filter(
        Patient.is_deleted == False,
        MRIScan.uploaded_at >= str(start_of_week),
        MRIScan.probability > 0.4
    ).group_by('date').all()

    # Build lookup dicts
    scan_map = {str(row.date): row.scans for row in daily_scans}
    pos_map = {str(row.date): row.positive for row in daily_positives}

    # Build the 7-day array (today going back 6 days)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    chart_data = []
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        ds = str(d)
        chart_data.append({
            "name": day_names[d.weekday()],
            "scans": scan_map.get(ds, 0),
            "positive": pos_map.get(ds, 0),
        })

    return {
        "totalScans": total_scans,
        "activePatients": total_patients,
        "aiDetections": ai_detections,
        "criticalCases": critical_cases,
        "chartData": chart_data,
    }


@router.get("/recent-alerts")
def get_recent_alerts(db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "doctor"]))):
    """
    Returns the most recent AI-detected positive scans as dashboard alerts.
    Joins patient name and formats time-ago strings.
    """
    scans = (
        db.query(MRIScan, Patient.name)
        .join(Patient, MRIScan.patient_id == Patient.id)
        .filter(Patient.is_deleted == False)
        .filter(MRIScan.probability > 0.4)
        .order_by(desc(MRIScan.uploaded_at))
        .limit(5)
        .all()
    )

    alerts = []
    now = datetime.now(timezone.utc)

    for scan, patient_name in scans:
        # Calculate time-ago
        uploaded = scan.uploaded_at
        if uploaded.tzinfo is None:
            uploaded = uploaded.replace(tzinfo=timezone.utc)
        diff = now - uploaded
        total_seconds = int(diff.total_seconds())
        if total_seconds < 3600:
            time_ago = f"{total_seconds // 60}m ago"
        elif total_seconds < 86400:
            time_ago = f"{total_seconds // 3600}h ago"
        else:
            time_ago = f"{total_seconds // 86400}d ago"

        # Confidence from probability
        conf = f"{round((scan.probability or 0) * 100, 1)}%"

        # Tumor type display (short label)
        tumor_type = scan.tumor_type or "Unknown"
        # Strip stage info for display label, keep it clean
        display_type = tumor_type.split(" - ")[0].strip() if " - " in tumor_type else tumor_type

        # Severity-based color coding
        severity = (scan.severity or "").lower()
        if any(kw in severity for kw in ["critical", "high", "stage iv", "stage iii", "stage 4", "stage 3"]):
            color = "red"
        elif any(kw in severity for kw in ["moderate", "medium", "stage ii", "stage 2"]):
            color = "orange"
        else:
            color = "yellow"

        alerts.append({
            "patient_name": patient_name,
            "patient_uid": f"P-{scan.patient_id:04d}",
            "scan_uid": scan.scan_uid or f"SCN-{scan.id:04d}",
            "tumor_type": display_type,
            "confidence": conf,
            "time_ago": time_ago,
            "severity_color": color,
            "scan_id": scan.id,
        })

    return {"alerts": alerts}


@router.get("/{scan_id}")
def get_analytics(scan_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    scan = db.query(MRIScan).filter(MRIScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    # Patient role can only view their own scan analytics
    if current_user.get("role") == "patient" and current_user.get("patient_id") != scan.patient_id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only view your own scan analytics.")
        
    # Check if analytics already exist
    analytics = db.query(Analytics).filter(Analytics.scan_id == scan_id).first()
    if analytics and analytics.chart_path:
        return FileResponse(analytics.chart_path)
        
    if scan.probability is None:
        raise HTTPException(status_code=400, detail="Scan probability not available for chart generation")
        
    chart_path = generate_probability_chart(scan.probability, scan.id)
    
    # Save to db
    new_analytics = Analytics(scan_id=scan.id, chart_path=chart_path)
    db.add(new_analytics)
    db.commit()
    
    return FileResponse(chart_path)

