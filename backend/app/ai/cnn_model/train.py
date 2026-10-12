import os
import tensorflow as tf

from tensorflow.keras.preprocessing.image import ImageDataGenerator

from model import build_cnn, IMG_SIZE, CLASS_NAMES


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAIN_DIR = os.path.join(BASE_DIR, "dataset", "Train")
TEST_DIR = os.path.join(BASE_DIR, "dataset", "Test")

MODEL_DIR = os.path.join(BASE_DIR, "saved_model")
MODEL_PATH = os.path.join(MODEL_DIR, "brain_tumor_cnn.keras")

BATCH_SIZE = 32

INITIAL_EPOCHS = 5
FINE_TUNE_EPOCHS = 10


def main():

    print("Loading training dataset...")

    train_generator = ImageDataGenerator(
        validation_split=0.2
    )

    test_generator = ImageDataGenerator()

    train_data = train_generator.flow_from_directory(
        TRAIN_DIR,
        classes=CLASS_NAMES,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=True,
        subset="training"
    )

    validation_data = train_generator.flow_from_directory(
        TRAIN_DIR,
        classes=CLASS_NAMES,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
        subset="validation"
    )

    test_data = test_generator.flow_from_directory(
        TEST_DIR,
        classes=CLASS_NAMES,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False
    )

    print("\nClass mapping:")
    print(train_data.class_indices)

    model = build_cnn()

    print("\nCNN architecture:")
    model.summary()

    print("\nStage 1: Training classification head...")

    model.fit(
        train_data,
        validation_data=validation_data,
        epochs=INITIAL_EPOCHS
    )

    print("\nStage 2: Fine-tuning CNN...")

    base_model = model.layers[3]

    base_model.trainable = True

    # Freeze most of the pretrained network
    for layer in base_model.layers[:-20]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=0.00001
        ),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    model.fit(
        train_data,
        validation_data=validation_data,
        epochs=FINE_TUNE_EPOCHS
    )

    os.makedirs(MODEL_DIR, exist_ok=True)

    model.save(MODEL_PATH)

    print("\nModel saved successfully:")
    print(MODEL_PATH)

    print("\nEvaluating CNN on TEST dataset...")

    loss, accuracy = model.evaluate(test_data)

    print("\n==============================")
    print("CNN TEST RESULTS")
    print("==============================")
    print(f"Test Loss     : {loss:.4f}")
    print(f"Test Accuracy : {accuracy * 100:.2f}%")
    print("==============================")


if __name__ == "__main__":
    main()