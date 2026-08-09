import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.config.settings import settings

def test_eeg_status_disconnected(client: TestClient):
    with patch("app.routes.eeg.get_connected_esp32_port", return_value=None):
        response = client.get(f"{settings.API_V1_STR}/eeg/status")
        assert response.status_code == 200
        assert response.json() == {"connected": False, "port": None}

def test_eeg_status_connected(client: TestClient):
    with patch("app.routes.eeg.get_connected_esp32_port", return_value="COM7"):
        response = client.get(f"{settings.API_V1_STR}/eeg/status")
        assert response.status_code == 200
        assert response.json() == {"connected": True, "port": "COM7"}

def test_eeg_blink_not_connected(client: TestClient):
    with patch("app.routes.eeg.get_connected_esp32_port", return_value=None):
        response = client.post(f"{settings.API_V1_STR}/eeg/blink")
        assert response.status_code == 400
        assert "EEG Head Band is not Connected" in response.json()["detail"]

@patch("app.routes.eeg.get_connected_esp32_port")
@patch("serial.Serial")
def test_eeg_blink_success(mock_serial, mock_port, client: TestClient):
    mock_port.return_value = "COM7"
    response = client.post(f"{settings.API_V1_STR}/eeg/blink")
    assert response.status_code == 200
    assert "Blink command sent to ESP32 on COM7" in response.json()["message"]
    assert mock_serial.called
