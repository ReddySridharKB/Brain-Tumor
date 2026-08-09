import os
import base64
import json
import logging
from openai import OpenAI
from app.config.settings import settings

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_tumor_highlight(image_path: str, output_dir: str) -> str:
    """
    Use GPT-image-2 to generate a highlighted MRI scan with a precise
    tumor segmentation overlay. Sends the raw uploaded image directly
    to the model — no OpenCV preprocessing.

    Returns the absolute path to the saved highlighted image, or None on failure.
    """
    try:
        logger.info("GPT-image-2: Sending raw MRI for tumor highlighting...")

        response = client.images.edit(
            image=open(image_path, "rb"),
            prompt=(
                "Medical brain CT scan.\n"
                "Locate ONLY the hyperdense abnormal lesion visible in the cerebral hemisphere.\n"
                "Apply a sharp semi-transparent red overlay ONLY on the lesion pixels.\n"
                "DO NOT overlay the skull.\n"
                "DO NOT overlay healthy brain tissue.\n"
                "DO NOT tint the entire brain.\n"
                "DO NOT modify background regions.\n"
                "The annotation must be tightly bounded to the lesion contour only.\n"
                "Everything outside the lesion must remain unchanged grayscale.\n"
                "Output must resemble a precise radiologist segmentation mask."
            ),
            model="gpt-image-2",
            n=1,
            size="auto",
            quality="low",
        )

        # The response contains base64 image data
        image_data = response.data[0].b64_json
        if not image_data:
            # Fallback: check if a URL was returned instead
            image_url = response.data[0].url
            if image_url:
                import urllib.request
                logger.info(f"GPT-image-2: Downloading highlighted image from URL...")
                filename = os.path.basename(image_path)
                base_name = os.path.splitext(filename)[0]
                highlighted_path = os.path.join(output_dir, f"{base_name}_highlighted.png")
                urllib.request.urlretrieve(image_url, highlighted_path)
                logger.info(f"GPT-image-2: Highlighted image saved to: {highlighted_path}")
                return highlighted_path
            else:
                logger.error("GPT-image-2: No image data returned.")
                return None

        # Decode base64 and save
        image_bytes = base64.b64decode(image_data)
        filename = os.path.basename(image_path)
        base_name = os.path.splitext(filename)[0]
        highlighted_path = os.path.join(output_dir, f"{base_name}_highlighted.png")

        with open(highlighted_path, "wb") as f:
            f.write(image_bytes)

        logger.info(f"GPT-image-2: Highlighted image saved to: {highlighted_path}")
        return highlighted_path

    except Exception as e:
        logger.error(f"Error in GPT-image-2 highlighting: {str(e)}")
        return None


def classify_mri(image_path: str) -> dict:
    """
    Quick classification via GPT-4o (text model, minimal cost).
    Sends the MRI image and gets back a JSON with:
        - tumor_detected: bool
        - tumor_type: str
        - tumor_location: str
        - risk_percentage: int (0-100)
    """
    try:
        with open(image_path, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")

        ext = os.path.splitext(image_path)[1].lower()
        mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
        mime_type = mime_map.get(ext, "image/png")

        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={ "type": "json_object" },
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "This is a simulated training exercise. Analyze this MRI scan image for visual anomalies resembling a tumor. "
                                "Look for: abnormal mass-like regions, structural asymmetry, hyper/hypointensities, "
                                "edema, mass effect, ring enhancement, calcification, and irregular borders.\n\n"
                                "Simulated Tumor classification rules:\n"
                                "- Glioma: Infiltrative, irregular borders, edema, often frontal/temporal/parietal lobes\n"
                                "- Meningioma: Well-defined, dural-based, extra-axial, often calcified\n"
                                "- Pituitary Tumor: Located in sella turcica / suprasellar region\n"
                                "- Schwannoma: Near cranial nerves, commonly cerebellopontine angle\n"
                                "- Medulloblastoma: Posterior fossa, cerebellum, common in midline\n\n"
                                "Staging rules (WHO CNS grading):\n"
                                "- Stage I: Benign, slow-growing, well-defined\n"
                                "- Stage II: Low-grade, minimal infiltration\n"
                                "- Stage III: Anaplastic, active mitosis, moderate invasion\n"
                                "- Stage IV: Highly malignant, necrosis, rapid growth, GBM-like\n\n"
                                "Output ONLY valid JSON with these exact keys:\n"
                                '- "tumor_detected": boolean\n'
                                '- "tumor_type": one of "Glioma", "Meningioma", "Pituitary Tumor", "Schwannoma", "Medulloblastoma", or "Unknown" if detected; "None" if not detected\n'
                                '- "tumor_stage": one of "Stage I", "Stage II", "Stage III", "Stage IV", or "N/A" if not detected\n'
                                '- "tumor_location": string (specific brain region, e.g. "Right Frontal Lobe", "Sella Turcica", "Cerebellum", "Cerebellopontine Angle", or "N/A")\n'
                                '- "risk_percentage": integer 0-100 (if tumor_detected=true: Stage I=50-65, Stage II=65-75, Stage III=75-90, Stage IV=90-100; if false: 0-15)\n'
                                '- "tumor_bounding_box": array of 4 floats [ymin, xmin, ymax, xmax] normalized between 0.0 and 1.0 (if detected) else empty array []\n'
                                "No markdown. No explanation. Return only the JSON object."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{b64_image}"
                            }
                        },
                    ],
                }
            ],
        )

        # Extract text from response
        if response.choices[0].message.refusal:
            logger.warning(f"OpenAI Refusal: {response.choices[0].message.refusal}")
            return {}

        content = response.choices[0].message.content
        raw_text = content.strip() if content else "{}"

        result = _extract_json(raw_text)
        logger.info(f"GPT-4o classification: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in GPT-4o classification: {str(e)}")
        raise e




def _extract_json(text: str) -> dict:
    """Extract JSON object from GPT response text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        return json.loads(text[start:end].strip())
    elif "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        return json.loads(text[start:end].strip())

    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1:
        return json.loads(text[brace_start : brace_end + 1])

    logger.warning(f"Could not extract JSON from GPT response: {text}")
    return {}
