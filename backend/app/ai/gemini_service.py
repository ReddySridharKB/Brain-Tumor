import google.generativeai as genai
import json
import logging
import base64
import os
from app.config.settings import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

reasoning_model = genai.GenerativeModel('gemini-2.5-flash-lite')


def analyze_and_summarize(image_path: str) -> dict:
    """
    Send the original MRI image to Gemini 2.5 Flash Lite for full analysis.
    Handles tumor classification, probability, severity, and detailed summary
    all in one call. No token limit — generate rich, paragraph-aligned output.

    Returns a dict with:
        - "tumor_type": str
        - "tumor_location": str
        - "tumor_risk": str
        - "probability": float
        - "severity": str
        - "ai_summary": str (at least 2 detailed paragraphs)
        - "confidence_score": float
        - "medical_disclaimer": str
    """
    try:
        # Read image bytes for Gemini vision input
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        ext = os.path.splitext(image_path)[1].lower()
        mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
        mime_type = mime_map.get(ext, "image/png")

        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }

        prompt = """You are an expert AI neuroradiologist. Analyze the provided brain MRI image thoroughly.

Examine the image for:
- Abnormal mass-like regions or lesions
- Asymmetry between brain hemispheres
- Signs of edema (swelling), perilesional swelling, or midline shift
- Ring enhancement patterns, calcification, irregular borders
- Tumor margins (well-defined vs infiltrative)
- Location relative to meninges, sella turcica, posterior fossa, cranial nerves

Classify the tumor using ONLY these WHO-recognized CNS tumor types:
- "Glioma": Infiltrative, irregular borders, edema, frontal/temporal/parietal lobes
- "Meningioma": Well-defined, dural-based, extra-axial, often calcified
- "Pituitary Tumor": Located in sella turcica or suprasellar region
- "Schwannoma": Near cranial nerves, commonly cerebellopontine angle
- "Medulloblastoma": Posterior fossa, cerebellum, commonly midline
- "None Detected": No tumor found

Staging (WHO CNS Grade):
- "Stage I": Benign, slow-growing, well-defined, low mitosis
- "Stage II": Low-grade, minimal infiltration
- "Stage III": Anaplastic, active mitosis, moderate invasion
- "Stage IV": Highly malignant, necrosis, rapid growth (GBM-like)

Based on your complete analysis, return a structured JSON object with ALL of the following keys:

- "tumor_type": One of: "Glioma", "Meningioma", "Pituitary Tumor", "Schwannoma", "Medulloblastoma", "Unknown", or "None Detected"
- "tumor_location": Specific anatomical location (e.g. "Right Frontal Lobe", "Left Temporal Lobe", "Sella Turcica", "Cerebellopontine Angle", "Cerebellar Vermis", or "N/A")
- "tumor_risk": Overall risk ("High", "Medium", or "Low")
- "probability": Float 0.0-1.0 representing probability of tumor presence
- "severity": WHO stage ("Stage I", "Stage II", "Stage III", "Stage IV", or "N/A")
- "confidence_score": Float 0.0-1.0 representing confidence in this analysis
- "ai_summary": Comprehensive interpretation as at least two well-formed paragraphs. First paragraph: imaging findings — what was observed, characteristics of any detected mass, location, size estimation, relationship to surrounding structures. Second paragraph: clinical significance — what the tumor type means, potential symptoms, recommended next steps (biopsy, contrast-enhanced MRI, PET, surgical consultation), and any notes about image preprocessing for treatment planning.
- "medical_disclaimer": "This is an AI-generated analysis and should not replace professional medical diagnosis or treatment decisions. Always consult a qualified healthcare provider."

CRITICAL: Output ONLY valid JSON. No markdown formatting, no code fences, no extra text."""

        response = reasoning_model.generate_content([prompt, image_part])
        text_response = response.text.strip()

        # Clean markdown formatting if present
        if text_response.startswith("```json"):
            text_response = text_response.replace("```json", "", 1).replace("```", "").strip()
        elif text_response.startswith("```"):
            text_response = text_response.replace("```", "", 2).strip()

        return json.loads(text_response)

    except Exception as e:
        logger.error(f"Error in Gemini analysis: {str(e)}")
        raise e


def compare_scans(previous_scan_summary: str, current_scan_summary: str) -> dict:
    """
    Compare two brain MRI scan AI summaries for progression tracking.
    """
    try:
        prompt = f"""
        Compare the following two brain MRI scan AI summaries for a patient.

        Previous Scan Summary: {previous_scan_summary}
        Current Scan Summary: {current_scan_summary}

        Provide a structured JSON output with the following keys:
        - "comparison_result": (One of: "increased", "reduced", "unchanged")
        - "growth_percentage": (A float indicating estimated growth percentage. Negative if reduced, 0 if unchanged)
        - "progression_summary": (A clear paragraph describing the comparison, tumor changes, and clinical significance)

        ONLY output valid JSON. Do not include markdown formatting.
        """
        response = reasoning_model.generate_content(prompt)
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response.replace("```json", "", 1).replace("```", "").strip()
        elif text_response.startswith("```"):
            text_response = text_response.replace("```", "", 2).strip()

        return json.loads(text_response)
    except Exception as e:
        logger.error(f"Error comparing scans: {str(e)}")
        raise e
