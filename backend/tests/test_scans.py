import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.config.settings import settings

def test_upload_scan_invalid_file(client: TestClient):
    # Try to upload a text file instead of an image
    response = client.post(
        f"{settings.API_V1_STR}/scans/upload/1",
        files={"file": ("test.txt", b"dummy content", "text/plain")}
    )
    assert response.status_code == 400
    assert "image" in response.json()["detail"]

@patch("app.routes.scans.scan_service.upload_and_analyze_scan")
def test_upload_scan_success(mock_upload, client: TestClient):
    # First create a patient so it exists in DB (even though we mock upload_and_analyze_scan,
    # the endpoint just passes it on, but let's test the endpoint response directly)
    from app.models.models import MRIScan
    from datetime import datetime
    
    mock_scan = MRIScan(
        id=1,
        patient_id=1,
        scan_uid="SCAN-1",
        original_image_path="test.jpg",
        uploaded_at=datetime.utcnow()
    )
    mock_upload.return_value = mock_scan

    response = client.post(
        f"{settings.API_V1_STR}/scans/upload/1",
        files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
    )
    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert response.json()["patient_id"] == 1
    assert mock_upload.called

@patch("app.routes.scans.scan_service.get_scan_history")
def test_get_scan_history(mock_history, client: TestClient):
    from app.models.models import MRIScan
    from datetime import datetime
    
    mock_history.return_value = [
        MRIScan(id=1, patient_id=1, scan_uid="SCAN-1", original_image_path="1.jpg", uploaded_at=datetime.utcnow()),
        MRIScan(id=2, patient_id=1, scan_uid="SCAN-2", original_image_path="2.jpg", uploaded_at=datetime.utcnow())
    ]
    
    response = client.get(f"{settings.API_V1_STR}/scans/history/1")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["id"] == 1
