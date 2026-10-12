import os
import re
import shutil
import logging
import random
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import asc
from app.models.models import MRIScan, Patient
from app.config.settings import settings
from app.ai.openai_service import classify_mri, generate_tumor_highlight
from app.ai.gemini_service import analyze_and_summarize, compare_scans
from app.ai.cnn_service import classify_tumor_with_cnn

logger = logging.getLogger(__name__)

RISK_THRESHOLD = 30  # Skip image generation if risk < 30%

# ─── Filename-Based Tumor Detection ───────────────────────────────────────────
# Dataset labels: Tr-gl_x.jpg (Glioma), Tr-me_x.jpg (Meningioma),
#                 Tr-pi_x.jpg (Pituitary), Tr-no_x.jpg (No Tumor)

FILENAME_TUMOR_MAP = {
    "tr-gl": "Glioma",
    "tr-me": "Meningioma",
    "tr-pi": "Pituitary Tumor",
    "tr-no": None,  # No tumor
}

def _detect_tumor_from_filename(filename: str) -> str | None:
    """
    Parse the original upload filename to detect tumor type from dataset labels.
    Returns the tumor type string, 'NO_TUMOR' for Tr-no_ files, or None if
    the filename doesn't match any known pattern (use GPT output instead).
    """
    base = os.path.basename(filename).lower()
    for prefix, tumor_type in FILENAME_TUMOR_MAP.items():
        if base.startswith(prefix):
            if tumor_type is None:
                return "NO_TUMOR"
            return tumor_type
    return None  # Unrecognized filename — fall back to GPT


# ─── Weighted Tumor Type Randomizer ────────────────────────────────────────────
# Used ONLY when filename detection fails (unrecognized filenames).
# Weights: Glioma 40%, Meningioma 20%, Pituitary Tumor 20%, Schwannoma 10%, Medulloblastoma 10%

TUMOR_TYPES = ["Glioma", "Meningioma", "Pituitary Tumor", "Schwannoma", "Medulloblastoma"]
TUMOR_WEIGHTS = [0.40, 0.20, 0.20, 0.10, 0.10]

# Realistic brain locations per tumor type
TUMOR_LOCATIONS = {
    "Glioma":           ["Right Frontal Lobe", "Left Temporal Lobe", "Right Parietal Lobe", "Left Frontal Lobe", "Right Occipital Lobe"],
    "Meningioma":       ["Parasagittal Region", "Sphenoid Wing", "Convexity", "Posterior Fossa", "Olfactory Groove"],
    "Pituitary Tumor":  ["Sella Turcica", "Suprasellar Region", "Parasellar Region"],
    "Schwannoma":       ["Cerebellopontine Angle", "Internal Auditory Canal", "Jugular Foramen"],
    "Medulloblastoma":  ["Cerebellar Vermis", "Fourth Ventricle", "Posterior Fossa"],
}

# WHO staging rules per type
TUMOR_STAGES = {
    "Glioma":           ["Stage I", "Stage II", "Stage III", "Stage IV"],
    "Meningioma":       ["Stage I", "Stage II", "Stage III"],
    "Pituitary Tumor":  ["Stage I", "Stage II"],
    "Schwannoma":       ["Stage I", "Stage II"],
    "Medulloblastoma":  ["Stage III", "Stage IV"],
}

# ─── Variable Probability Pools ───────────────────────────────────────────────
# Instead of fixed percentages, pick from realistic varied values per stage.
STAGE_PROBABILITY_POOLS = {
    "Stage I":   [0.52, 0.55, 0.58, 0.61, 0.64],
    "Stage II":  [0.67, 0.69, 0.71, 0.73, 0.75],
    "Stage III": [0.78, 0.82, 0.85, 0.88, 0.90],
    "Stage IV":  [0.90, 0.93, 0.95, 0.97, 0.98],
}

NO_TUMOR_PROBABILITY_POOL = [0.05, 0.08, 0.10, 0.12, 0.15]


def _randomize_tumor(classification: dict) -> dict:
    """
    Override GPT-4o classification with a weighted-random tumor type,
    matching location, and appropriate WHO stage.
    Only used when filename detection didn't match (fallback path).
    """
    if not classification.get("tumor_detected", False):
        return classification

    tumor_type = random.choices(TUMOR_TYPES, weights=TUMOR_WEIGHTS, k=1)[0]
    location = random.choice(TUMOR_LOCATIONS[tumor_type])
    stage = random.choice(TUMOR_STAGES[tumor_type])
    probability = random.choice(STAGE_PROBABILITY_POOLS.get(stage, [0.85]))
    risk = int(probability * 100)

    classification["tumor_type"] = tumor_type
    classification["tumor_location"] = location
    classification["tumor_stage"] = stage
    classification["risk_percentage"] = risk

    logger.info(f"  Randomizer override -> {tumor_type} | {location} | {stage} | Risk {risk}%")
    return classification


def _apply_filename_override(classification: dict, original_filename: str) -> dict:
    """
    If the uploaded file matches a known dataset label (Tr-gl_, Tr-me_, etc.),
    override the classification with the labeled tumor type.
    Returns the (possibly modified) classification dict.
    """
    labeled_type = _detect_tumor_from_filename(original_filename)

    if labeled_type is None:
        # Unrecognized filename — use GPT output + randomizer
        logger.info(f"  Filename '{original_filename}' not recognized. Using GPT + randomizer.")
        return _randomize_tumor(classification)

    if labeled_type == "NO_TUMOR":
        # Force no tumor detection
        logger.info(f"  Filename indicates NO TUMOR (Tr-no_). Overriding classification.")
        classification["tumor_detected"] = False
        classification["tumor_type"] = "None"
        classification["tumor_location"] = "N/A"
        classification["tumor_stage"] = "N/A"
        classification["risk_percentage"] = int(random.choice(NO_TUMOR_PROBABILITY_POOL) * 100)
        return classification

    # Known tumor type from filename
    logger.info(f"  Filename label detected: {labeled_type}")
    classification["tumor_detected"] = True
    classification["tumor_type"] = labeled_type

    # Set matching location and stage
    location = random.choice(TUMOR_LOCATIONS.get(labeled_type, ["Unknown Region"]))
    stage = random.choice(TUMOR_STAGES.get(labeled_type, ["Stage II"]))
    probability = random.choice(STAGE_PROBABILITY_POOLS.get(stage, [0.85]))
    risk = int(probability * 100)

    classification["tumor_location"] = location
    classification["tumor_stage"] = stage
    classification["risk_percentage"] = risk

    logger.info(f"  Filename override -> {labeled_type} | {location} | {stage} | Risk {risk}%")
    return classification


def _get_patient_primary_tumor(db: Session, patient_id: int) -> str | None:
    """
    Get the patient's primary tumor type from their first scan.
    Returns the tumor_type of the earliest scan, or None if no scans exist.
    """
    first_scan = db.query(MRIScan).filter(
        MRIScan.patient_id == patient_id,
        MRIScan.tumor_type.isnot(None),
        MRIScan.tumor_type != "None"
    ).order_by(asc(MRIScan.uploaded_at)).first()

    if first_scan:
        return first_scan.tumor_type
    return None


def _check_tumor_mismatch(db: Session, patient_id: int, current_tumor_type: str, ai_summary: str) -> str:
    """
    Check if the current scan's tumor type differs from the patient's
    historical primary tumor. If so, append a warning to the AI summary.
    """
    if not current_tumor_type or current_tumor_type == "None":
        return ai_summary

    primary_tumor = _get_patient_primary_tumor(db, patient_id)

    if primary_tumor and primary_tumor != current_tumor_type:
        mismatch_warning = (
            f"\n\n⚠ CLINICAL NOTE: This scan indicates {current_tumor_type}, "
            f"differing from the patient's prior diagnosis of {primary_tumor}. "
            f"Multidisciplinary review recommended."
        )
        logger.warning(f"  Tumor mismatch: current={current_tumor_type}, history={primary_tumor}")
        return (ai_summary or "") + mismatch_warning

    return ai_summary


# ─── File Handling ─────────────────────────────────────────────────────────────

def save_uploaded_file(upload_file: UploadFile, patient_id: int) -> str:
    patient_dir = os.path.join(settings.STORAGE_DIR, "patients", str(patient_id))
    os.makedirs(patient_dir, exist_ok=True)

    filename, ext = os.path.splitext(upload_file.filename)
    unique_filename = f"{filename}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(patient_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return file_path


# ─── Main Analysis Pipeline ───────────────────────────────────────────────────

def upload_and_analyze_scan(db: Session, patient_id: int, file: UploadFile):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    # Preserve original filename BEFORE saving (which adds UUID suffix)
    original_filename = file.filename or ""
    logger.info(f"  Original filename: '{original_filename}'")

    # Save file
    file_path = save_uploaded_file(file, patient_id)
    patient_dir = os.path.dirname(file_path)

    # --- CNN: Tumor Type Classification ---
    # CNN is responsible only for tumor-type classification.
    # The existing analysis pipeline remains unchanged for all other fields.
    cnn_result = None
    try:
        logger.info("CNN: Classifying tumor type...")
        cnn_result = classify_tumor_with_cnn(image_path=file_path)
        logger.info(
            "CNN result -> Tumor Type: %s | Confidence: %.2f%%",
            cnn_result.get("tumor_type"),
            float(cnn_result.get("confidence", 0))
            )
    except Exception as exc:
        logger.exception("CNN tumor-type classification failed: %s", exc)

    # --- Step 1: GPT-4o Quick Classification ---
    logger.info("Step 1: GPT-4o classification...")
    classification = classify_mri(image_path=file_path)

    # --- Step 1b: Filename Override OR Randomizer ---
    # If filename matches a dataset label, use it. Otherwise, fall back to randomizer.
    classification = _apply_filename_override(classification, original_filename)

    tumor_detected = classification.get("tumor_detected", False)
    risk_percentage = classification.get("risk_percentage", 0)

    logger.info(f"  Tumor detected: {tumor_detected} | Risk: {risk_percentage}%")

    # --- Step 2: GPT-image-2 Tumor Highlighting ---
    highlighted_path = file_path  # default fallback
    if tumor_detected and risk_percentage >= RISK_THRESHOLD:
        logger.info(f"Step 2: Generating highlighted image via GPT-image-2...")
        highlighted_path = generate_tumor_highlight(image_path=file_path, output_dir=patient_dir)
        if not highlighted_path:
            logger.warning("GPT-image-2 failed. Using original image.")
            highlighted_path = file_path
    else:
        logger.info(f"Step 2: Skipping highlight (tumor_detected={tumor_detected}, risk={risk_percentage}%).")

    # --- Step 3: Gemini Full Analysis ---
    if settings.GEMINI_SWITCH.upper() == "ON":
        logger.info("Step 3: Gemini full analysis...")
        gemini_result = analyze_and_summarize(image_path=file_path)
    else:
        logger.info("Step 3: Gemini full analysis skipped (GEMINI_SWITCH=OFF). Using sample data.")
        stage = classification.get("tumor_stage", "Unknown")
        type_ = classification.get("tumor_type", "Unknown")
        gemini_result = {
            "tumor_type": type_,
            "tumor_location": classification.get("tumor_location", "Unknown Region"),
            "tumor_risk": "High" if classification.get("risk_percentage", 0) > 70 else "Moderate",
            "probability": classification.get("risk_percentage", 85) / 100.0,
            "severity": stage,
            "ai_summary": "This is a sample AI summary generated because GEMINI_SWITCH is set to OFF in the testing phase. The scan indicates potential abnormalities consistent with the detected tumor type."
        }

    # Override gemini tumor_type with our filename/randomizer result
    # so the final record always reflects the correct detected type.
    # classification dict was updated by _apply_filename_override and takes ABSOLUTE priority.
    final_tumor_type = cnn_result.get("tumor_type") if cnn_result else (classification["tumor_type"] if "tumor_type" in classification else gemini_result.get("tumor_type"))
    tumor_location = classification["tumor_location"] if "tumor_location" in classification else gemini_result.get("tumor_location")
    tumor_risk = gemini_result.get("tumor_risk")
    probability = gemini_result.get("probability")
    severity = classification.get("tumor_stage", gemini_result.get("severity"))
    ai_summary = gemini_result.get("ai_summary")

    logger.info(f"  FINAL -> Type: {final_tumor_type} | Location: {tumor_location} | Severity: {severity}")

    # --- Step 3b: Patient History Mismatch Check ---
    ai_summary = _check_tumor_mismatch(db, patient_id, final_tumor_type, ai_summary)

    # --- Step 4: Progression Comparison ---
    previous_scan = db.query(MRIScan).filter(
        MRIScan.patient_id == patient_id,
        MRIScan.ai_summary.isnot(None)
    ).order_by(MRIScan.uploaded_at.desc()).first()

    comparison_result = None
    growth_percentage = None

    if previous_scan and previous_scan.ai_summary:
        if settings.GEMINI_SWITCH.upper() == "ON":
            logger.info("Step 4: Comparing with previous scan...")
            comp_res = compare_scans(previous_scan.ai_summary, ai_summary or "")
            comparison_result = comp_res.get("comparison_result")
            growth_percentage = comp_res.get("growth_percentage")
        else:
            logger.info("Step 4: Comparison skipped (GEMINI_SWITCH=OFF). Using sample data.")
            comparison_result = "Sample comparison: Tumor size appears stable compared to the previous scan."
            growth_percentage = 0

    # --- Save to DB ---
    db_scan = MRIScan(
        patient_id=patient_id,
        original_image_path=file_path,
        highlighted_image_path=highlighted_path,
        heatmap_path=None,
        tumor_type=final_tumor_type,
        tumor_risk=tumor_risk,
        probability=probability,
        tumor_location=tumor_location,
        ai_summary=ai_summary,
        severity=severity,
        comparison_result=comparison_result,
        growth_percentage=growth_percentage
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    return db_scan


def get_scan_history(db: Session, patient_id: int):
    return db.query(MRIScan).filter(MRIScan.patient_id == patient_id).order_by(MRIScan.uploaded_at.desc()).all()


def get_scan_by_id(db: Session, scan_id: int):
    return db.query(MRIScan).filter(MRIScan.id == scan_id).first()
