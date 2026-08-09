from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta, timezone

from app.database.database import get_db
from app.models.models import User, Patient

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = "neuroai_super_secret_jwt_replacement_key_2026"

# --- Models ---
class LoginRequest(BaseModel):
    username_or_id: str
    password: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# --- Security Helpers ---
def hash_password(password: str) -> str:
    salt = "neuroai_secure_salt_static"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire.isoformat()})
    
    payload_str = json.dumps(to_encode)
    payload_b64 = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip("=")
    
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            return None
            
        padding = 4 - (len(payload_b64) % 4)
        if padding < 4:
            payload_b64 += "=" * padding
        payload_str = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        data = json.loads(payload_str)
        
        exp_str = data.get("exp")
        if exp_str:
            exp_time = datetime.fromisoformat(exp_str)
            if datetime.now(timezone.utc) > exp_time:
                return None
        return data
    except Exception:
        return None

# --- Dependencies ---
def get_current_user_data(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access denied. Missing or invalid Authorization header.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")
    return payload

def require_roles(allowed_roles: List[str]):
    def dependency(user: dict = Depends(get_current_user_data)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permission denied. Insufficient privileges.")
        return user
    return dependency

# --- Routes ---
@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username_clean = req.username_or_id.strip()
    
    # 1. Try Patient Login (if ID matches BT-... format or is just numeric)
    is_patient_format = username_clean.upper().startswith("BT-") or username_clean.isdigit()
    
    if is_patient_format:
        # Extract integer ID from format like BT-26-003 or use pure digits
        patient_id = None
        if username_clean.isdigit():
            patient_id = int(username_clean)
        else:
            try:
                # E.g. BT-26-003 -> splits by "-" -> third part "003" -> 3
                parts = username_clean.split("-")
                patient_id = int(parts[-1])
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid Patient ID format. Use BT-YY-ID or raw number.")
        
        # Verify patient exists and is active
        patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_deleted == False).first()
        if not patient:
            raise HTTPException(status_code=404, detail=f"No active patient found with ID: {req.username_or_id}")
            
        token_data = {
            "sub": f"patient_{patient.id}",
            "username": patient.name,
            "role": "patient",
            "patient_id": patient.id
        }
        token = create_access_token(token_data)
        return {
            "token": token,
            "role": "patient",
            "username": patient.name,
            "patient_id": patient.id
        }
        
    # 2. Try Clinical Staff Login (admin or doctor)
    user = db.query(User).filter(User.username == username_clean).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
        
    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required for clinical staff login.")
        
    hashed = hash_password(req.password)
    if user.password_hash != hashed:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
        
    token_data = {
        "sub": user.username,
        "username": user.username,
        "role": user.role
    }
    token = create_access_token(token_data)
    return {
        "token": token,
        "role": user.role,
        "username": user.username,
        "patient_id": None
    }

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_data)):
    role = current_user.get("role")
    if role == "patient":
        raise HTTPException(status_code=400, detail="Patients cannot change passphrases via credentials endpoint.")
        
    username = current_user.get("username")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    # Verify old password
    if user.password_hash != hash_password(req.old_password):
        raise HTTPException(status_code=400, detail="Incorrect old password.")
        
    # Set new password
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}

class CreateDoctorRequest(BaseModel):
    username: str
    password: str

@router.post("/create-doctor")
def create_doctor(req: CreateDoctorRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    username_clean = req.username.strip()
    if not username_clean:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
        
    # Check if user already exists
    exists = db.query(User).filter(User.username == username_clean).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    new_user = User(
        username=username_clean,
        password_hash=hash_password(req.password),
        role="doctor"
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "message": f"Doctor account '{username_clean}' created successfully"}
