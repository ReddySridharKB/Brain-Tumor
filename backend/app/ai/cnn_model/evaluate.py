import os
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

from model import IMG_SIZE, CLASS_NAMES

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "saved_model", "brain_tumor_cnn.keras")
TEST_DIR = os.path.join(BASE_DIR, "dataset", "test")

def main():
    model = tf.keras.models.load_model(MODEL_PATH)

    test_ds = tf.keras.utils.image_dataset_from_directory(
        TEST_DIR,
        class_names=CLASS_NAMES,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32,
        shuffle=False,
    )

    y_true = np.concatenate([y.numpy() for _, y in test_ds])
    probabilities = model.predict(test_ds, verbose=1)
    y_pred = np.argmax(probabilities, axis=1)

    print("\nClassification report:\n")
    print(
        classification_report(
            y_true,
            y_pred,
            target_names=CLASS_NAMES,
            digits=4,
        )
    )

    print("Confusion matrix:")
    print(confusion_matrix(y_true, y_pred))

if __name__ == "__main__":
    main()
