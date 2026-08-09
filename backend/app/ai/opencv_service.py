import cv2
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

def generate_highlighted_image(image_path: str, output_dir: str, bounding_box: list = None) -> str:
    """
    Generate a highlighted tumor image.
    Uses GPT-4o's normalized bounding box if provided, else falls back to OpenCV heuristics.
    """
    try:
        logger.info("Generating highlighted tumor image via OpenCV...")
        img = cv2.imread(image_path)
        if img is None:
            logger.error("Could not read image for OpenCV highlighting")
            return None
            
        highlighted_img = img.copy()

        # If GPT-4o returned a bounding box, use it directly
        if bounding_box and len(bounding_box) == 4:
            logger.info(f"Using GPT-4o bounding box for highlighting: {bounding_box}")
            h, w = img.shape[:2]
            ymin, xmin, ymax, xmax = bounding_box
            
            # Convert normalized coords to pixels
            x1 = int(xmin * w)
            y1 = int(ymin * h)
            x2 = int(xmax * w)
            y2 = int(ymax * h)
            
            # Ensure coordinates are within bounds
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            
            # Draw semi-transparent red overlay over the bounding box
            overlay = highlighted_img.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 255), thickness=cv2.FILLED)
            alpha = 0.4
            cv2.addWeighted(overlay, alpha, highlighted_img, 1 - alpha, 0, highlighted_img)
            
            # Draw bounding box outline
            cv2.rectangle(highlighted_img, (x1, y1), (x2, y2), (0, 0, 255), 2)
        else:
            logger.info("No GPT-4o bounding box provided, falling back to OpenCV contour detection.")
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Apply higher threshold to isolate the hyperintense tumor mass better
            _, thresh = cv2.threshold(gray, 170, 255, cv2.THRESH_BINARY)

            # Remove noise with morphology
            kernel = np.ones((5,5), np.uint8)
            opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

            # Find contours
            contours, _ = cv2.findContours(opening, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # If contours found, draw them
            if contours:
                # Sort by area
                contours = sorted(contours, key=cv2.contourArea, reverse=True)
                
                # Filter out contours that are too large (e.g., the skull/entire brain)
                # and contours that are too small (noise)
                img_area = h * w
                valid_contours = [
                    c for c in contours 
                    if 150 < cv2.contourArea(c) < (img_area * 0.25)
                ]

                # Draw only the single most likely tumor mass (the largest valid one)
                for cnt in valid_contours[:1]:
                    # Draw a semi-transparent red overlay
                    overlay = highlighted_img.copy()
                    cv2.drawContours(overlay, [cnt], -1, (0, 0, 255), thickness=cv2.FILLED)
                    alpha = 0.5
                    cv2.addWeighted(overlay, alpha, highlighted_img, 1 - alpha, 0, highlighted_img)
                    
                    # Draw bounding box
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    cv2.rectangle(highlighted_img, (x, y), (x+bw, y+bh), (0, 0, 255), 2)

        filename = os.path.basename(image_path)
        base_name = os.path.splitext(filename)[0]
        highlighted_path = os.path.join(output_dir, f"{base_name}_highlighted.png")

        cv2.imwrite(highlighted_path, highlighted_img)
        logger.info(f"OpenCV Highlighted image saved to: {highlighted_path}")
        return highlighted_path

    except Exception as e:
        logger.error(f"Error in OpenCV image generation: {str(e)}")
        return None
