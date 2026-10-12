import json
import sys

from predict import predict_mri


if len(sys.argv) != 2:
    print(json.dumps({"error": "Usage: predict_bridge.py <image_path>"}))
    raise SystemExit(2)

try:
    result = predict_mri(sys.argv[1])
    print(json.dumps(result))
except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    raise SystemExit(1)
