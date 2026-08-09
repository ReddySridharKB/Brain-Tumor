import requests
try:
    r = requests.get('http://localhost:8000/api/v1/analytics/dashboard')
    print("Status:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", str(e))
