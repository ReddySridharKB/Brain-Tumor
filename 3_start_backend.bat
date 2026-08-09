@echo off
title NeuroAI - Backend (FastAPI)
color 0B
echo.
echo  ============================================================
echo     NeuroAI Backend - FastAPI
echo     Running at: http://localhost:8000
echo     API Docs:   http://localhost:8000/docs
echo  ============================================================
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo.
echo  [Backend stopped. Press any key to close.]
pause >nul
