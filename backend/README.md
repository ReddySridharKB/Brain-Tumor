# Brain Tumor Detection & Monitoring System - Backend

This is the FastAPI backend for the Brain Tumor Detection & Monitoring System.

## Features
- Patient Management API
- MRI Scan Upload & Processing
- Gemini API Integration for Medical Analysis & Scan Comparison
- Auto-generation of tumor highlight overlays and heatmaps
- Chart Generation
- PDF Report Export

## Setup Instructions

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure Environment:
   Copy `.env.example` to `.env` and add your Gemini API Key:
   ```ini
   GEMINI_API_KEY=your_key_here
   DATABASE_URL=sqlite:///../database/brain_tumor.db
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints
- `POST /api/v1/patients/create` - Create new patient
- `GET /api/v1/patients/{id}` - Get patient info
- `POST /api/v1/scans/upload/{patient_id}` - Upload and analyze scan
- `GET /api/v1/scans/history/{patient_id}` - Get patient scan history
- `GET /api/v1/analytics/{scan_id}` - Get generated analytics chart
- `GET /api/v1/report/pdf/{scan_id}` - Download PDF report
