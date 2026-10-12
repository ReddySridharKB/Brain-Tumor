# CNN tumor-type module

This is a separate CNN component for the Brain Tumor Detection project.

## Classes

- Glioma
- Meningioma
- Pituitary
- No_Tumor

## Dataset layout

cnn_model/
  dataset/
    train/
      Glioma/
      Meningioma/
      Pituitary/
      No_Tumor/
    test/
      Glioma/
      Meningioma/
      Pituitary/
      No_Tumor/

## Install

pip install -r requirements-cnn.txt

## Train

python train.py

The trained model is saved as:
saved_model/brain_tumor_cnn.keras

## Evaluate

python evaluate.py

This prints the actual test-set classification report and confusion matrix.

## Predict one MRI

python predict.py

## Integration

This module is intentionally isolated initially. Do not modify the existing
scan_service.py or other application files until the CNN has been trained
and tested.
