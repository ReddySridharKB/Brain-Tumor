import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import load_img, img_to_array

from model import IMG_SIZE, CLASS_NAMES

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "saved_model",
    "brain_tumor_cnn.keras",
)

_model = None

def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"CNN model not found: {MODEL_PATH}. "
                "Train the model first using train.py."
            )
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model

def predict_mri(image_path: str) -> dict:
    model = _load_model()

    image = load_img(
        image_path,
        target_size=(IMG_SIZE, IMG_SIZE),
        color_mode="rgb",
    )
    array = img_to_array(image)
    array = np.expand_dims(array, axis=0)

    probabilities = model.predict(array, verbose=0)[0]
    index = int(np.argmax(probabilities))

    return {
        "tumor_type": CLASS_NAMES[index],
        "confidence": round(float(probabilities[index] * 100), 2),
        "probabilities": {
            CLASS_NAMES[i]: round(float(probabilities[i] * 100), 2)
            for i in range(len(CLASS_NAMES))
        },
    }

if __name__ == "__main__":
    path = input("Enter MRI image path: ").strip()
    print(predict_mri(path))
