import json
import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# The CNN uses its own virtual environment so TensorFlow does not alter
# the existing FastAPI/Gemini/OpenAI environment.
CNN_PYTHON = os.getenv("CNN_PYTHON", r"C:\cnn_venv\Scripts\python.exe")
CNN_BRIDGE = Path(__file__).resolve().parent / "cnn_model" / "predict_bridge.py"


def classify_tumor_with_cnn(image_path: str) -> dict:
    """
    Run the trained CNN in the isolated CNN Python environment.

    Returns:
        {
            "tumor_type": "Glioma" | "Meningioma" | "Pituitary Tumor" | "None",
            "confidence": float,
            "probabilities": dict
        }
    """
    if not os.path.exists(CNN_PYTHON):
        raise FileNotFoundError(
            f"CNN Python interpreter not found: {CNN_PYTHON}. "
            "Set the CNN_PYTHON environment variable to the CNN virtualenv Python."
        )

    if not CNN_BRIDGE.exists():
        raise FileNotFoundError(f"CNN bridge not found: {CNN_BRIDGE}")

    result = subprocess.run(
        [CNN_PYTHON, str(CNN_BRIDGE), image_path],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "CNN prediction failed.\n"
            f"stdout: {result.stdout.strip()}\n"
            f"stderr: {result.stderr.strip()}"
        )

    try:
        prediction = json.loads(result.stdout.strip())
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"CNN returned invalid JSON: {result.stdout.strip()}"
        ) from exc

    raw_type = str(prediction.get("tumor_type", "")).strip().lower()

    type_map = {
        "glioma": "Glioma",
        "meningioma": "Meningioma",
        "pituitary": "Pituitary Tumor",
        "pituitary tumor": "Pituitary Tumor",
        "notumor": "None",
        "no_tumor": "None",
        "no tumor": "None",
        "none": "None",
        "none detected": "None",
    }

    prediction["tumor_type"] = type_map.get(raw_type, prediction.get("tumor_type"))

    logger.info(
        "CNN tumor-type prediction: %s (confidence=%s%%)",
        prediction.get("tumor_type"),
        prediction.get("confidence"),
    )

    return prediction
