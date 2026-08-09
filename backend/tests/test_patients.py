import pytest
from fastapi.testclient import TestClient
from app.config.settings import settings

def test_create_patient(client: TestClient):
    response = client.post(
        f"{settings.API_V1_STR}/patients/create",
        json={
            "name": "John Doe",
            "age": 45,
            "sex": "Male",
            "dob": "1980-01-01",
            "blood_group": "O+"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["age"] == 45
    assert data["sex"] == "Male"
    assert "id" in data
    assert "patient_uid" in data

def test_get_patient(client: TestClient):
    # First create a patient
    create_resp = client.post(
        f"{settings.API_V1_STR}/patients/create",
        json={
            "name": "Jane Doe",
            "age": 30,
            "sex": "Female",
            "dob": "1994-05-15",
            "blood_group": "A-"
        }
    )
    patient_id = create_resp.json()["id"]
    
    response = client.get(f"{settings.API_V1_STR}/patients/{patient_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id
    assert data["name"] == "Jane Doe"
    assert "scans" in data

def test_get_nonexistent_patient(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/patients/9999")
    assert response.status_code == 404
