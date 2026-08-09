import cv2
import numpy as np
import os
from PIL import Image

def process_mri_image(image_path: str, output_dir: str):
    """
    Process the MRI image to generate a highlighted image and a heatmap.
    Returns the paths to the highlighted image and heatmap.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        
    filename = os.path.basename(image_path)
    base_name, ext = os.path.splitext(filename)
    
    highlighted_path = os.path.join(output_dir, f"{base_name}_highlighted{ext}")
    heatmap_path = os.path.join(output_dir, f"{base_name}_heatmap{ext}")
    
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read the image")
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Draw contours for highlighted image
    highlighted_img = img.copy()
    cv2.drawContours(highlighted_img, contours, -1, (0, 0, 255), 2)
    cv2.imwrite(highlighted_path, highlighted_img)
    
    # Generate heatmap
    heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img, 0.6, heatmap, 0.4, 0)
    cv2.imwrite(heatmap_path, overlay)
    
    return highlighted_path, heatmap_path
