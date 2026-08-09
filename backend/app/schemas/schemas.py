from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# --- Patient Schemas ---
class PatientBase(BaseModel):
    name: str
    age: int
    sex: str
    dob: str
    blood_group: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    patient_uid: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- MRI Scan Schemas ---
class MRIScanBase(BaseModel):
    original_image_path: str

class MRIScanResponse(MRIScanBase):
    id: int
    scan_uid: str
    patient_id: int
    highlighted_image_path: Optional[str]
    heatmap_path: Optional[str]
    uploaded_at: datetime
    tumor_type: Optional[str]
    tumor_risk: Optional[str]
    probability: Optional[float]
    tumor_location: Optional[str]
    ai_summary: Optional[str]
    severity: Optional[str]
    comparison_result: Optional[str]
    growth_percentage: Optional[float]
    model_config = ConfigDict(from_attributes=True)


# --- AI Analysis Response Schema ---
class AIAnalysisResult(BaseModel):
    tumor_type: str
    tumor_risk: str
    probability: float
    tumor_location: str
    severity: str
    ai_summary: str
    confidence_score: float
    medical_disclaimer: str

# --- Patient with Scans ---
class PatientWithScans(PatientResponse):
    scans: List[MRIScanResponse] = []


# --- Analytics Schemas ---
class AnalyticsResponse(BaseModel):
    id: int
    scan_id: int
    chart_path: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
