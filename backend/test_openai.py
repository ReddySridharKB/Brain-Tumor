import os
import sys
from dotenv import load_dotenv

# Load env before importing app modules
load_dotenv()

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from app.ai.openai_service import classify_mri

import logging
logging.basicConfig(level=logging.INFO)

from app.ai.opencv_service import generate_highlighted_image

if __name__ == "__main__":
    img_path = r"f:\Projects\Brain Tumor 2.0\storage\patients\1\Brain MRI Scan 2.png"
    try:
        res = classify_mri(img_path)
        print("RESULT:", res)
        bounding_box = res.get("tumor_bounding_box", [])
        print("BBOX:", bounding_box)
        output_dir = r"f:\Projects\Brain Tumor 2.0\storage\patients\1"
        out_path = generate_highlighted_image(img_path, output_dir, bounding_box)
        print("HIGHLIGHTED AT:", out_path)
    except Exception as e:
        print("EXCEPTION:", e)

