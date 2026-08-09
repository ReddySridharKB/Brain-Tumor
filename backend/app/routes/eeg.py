from fastapi import APIRouter, HTTPException, Depends
import os
import subprocess
import re

router = APIRouter(prefix="/eeg", tags=["EEG Headband"])

# Common ESP32 driver keywords
ESP_KEYWORDS = ["cp210", "ch340", "ch341", "ftdi", "usb to uart", "usb-to-uart", "prolific"]

def get_connected_esp32_port():
    try:
        import serial.tools.list_ports
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            desc = (p.description or "").lower()
            if any(k in desc for k in ESP_KEYWORDS):
                return p.device
    except Exception:
        pass

    # Windows fallback using powershell to fetch Caption
    try:
        cmd = "powershell -Command \"Get-CimInstance Win32_PnPEntity | Where-Object { $_.Caption -match 'COM\\d+' } | Select-Object Caption\""
        res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        if res.returncode == 0 and res.stdout.strip():
            lines = res.stdout.strip().split("\n")
            for line in lines:
                if any(k in line.lower() for k in ["cp210", "ch340", "usb to uart", "bridge"]):
                    m = re.search(r'\((COM\d+)\)', line)
                    if m:
                        return m.group(1)
    except Exception:
        pass
    return None

@router.get("/status")
def get_eeg_status():
    port = get_connected_esp32_port()
    if port:
        return {"connected": True, "port": port}
    return {"connected": False, "port": None}

@router.post("/blink")
def trigger_eeg_blink():
    port = get_connected_esp32_port()
    if not port:
        raise HTTPException(status_code=400, detail="EEG Head Band is not Connected")
    
    try:
        import serial
        import time
        # Open port, send blink byte 'B', close immediately so we don't hold the lock
        # 115200 is default ESP32 baudrate
        with serial.Serial(port, 115200, timeout=1) as ser:
            ser.write(b'B\n')
            # Hardware toggle of RTS/DTR lines (creates instant blink/reset feedback)
            ser.dtr = False
            ser.rts = True
            time.sleep(0.1)
            ser.dtr = True
            ser.rts = False
        return {"status": "success", "message": f"Blink command sent to ESP32 on {port}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serial error: {e}")
