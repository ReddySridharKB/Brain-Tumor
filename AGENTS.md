# AGENTS.md

# Brain Tumor Detection & Monitoring System

## Project Objective

Develop an AI-powered web application capable of:
- detecting brain tumors from MRI scans
- storing patient history
- monitoring tumor progression
- generating analytics
- exporting medical reports

---

# Core AI Stack

## Gemini Models

### Analysis
- gemini-2.5-flash-lite

Used for:
- tumor classification
- probability estimation
- medical reasoning
- scan comparison
- AI summary generation

### Visualization
- gemini-2.5-flash-image

Used for:
- highlighted tumor MRI generation
- visualization overlays

---

# Backend Stack

- FastAPI
- SQLite
- SQLAlchemy
- OpenCV
- NumPy
- scikit-image
- matplotlib
- reportlab

---

# Frontend Stack

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts
- Framer Motion

---

# Engineering Rules

## Code Quality
- modular architecture mandatory
- no large monolithic files
- service-based architecture
- reusable utilities
- type safety mandatory
- clean naming conventions

## Documentation
Every major implementation must:
1. update Notion documentation
2. update Graphify dependency graph
3. generate architecture notes
4. document APIs automatically

---

# Mandatory MCP Usage

## Required MCPs
- Notion MCP
- Graphify MCP
- Filesystem MCP
- Sequential Thinking MCP

## Optional MCPs
- SQLite MCP
- GitHub MCP
- Playwright MCP

---

# Backend Workflow

## Phase 1 [COMPLETED]
Setup:
- FastAPI
- SQLite
- folder structure
- SQLAlchemy models

## Phase 2 [COMPLETED]
Patient management APIs

## Phase 3 [COMPLETED]
MRI upload pipeline

## Phase 4 [COMPLETED]
Gemini integration

## Phase 5 [COMPLETED]
Tumor highlighting

## Phase 6 [COMPLETED]
Analytics generation

## Phase 7 [COMPLETED]
PDF export

## Phase 8 [COMPLETED]
Tumor comparison engine

---

# Frontend Workflow

## Phase 1 [COMPLETED]
Setup Next.js architecture

## Phase 2 [COMPLETED]
Dashboard UI

## Phase 3 [COMPLETED]
Patient management UI

## Phase 4 [COMPLETED]
MRI upload UI

## Phase 5 [COMPLETED]
Analysis visualization

## Phase 6 [COMPLETED]
Comparison dashboard

## Phase 7 [COMPLETED]
PDF integration

---

# Database Rules

Use SQLite.

Database file:
database/brain_tumor.db

Store images locally:
storage/patients/

Never store large image blobs inside SQLite.

---

# AI Response Rules

All Gemini outputs MUST:
- be structured JSON
- include confidence score
- include explanation
- include medical disclaimer

---

# File Storage Rules

Each patient must have:
storage/patients/{patient_id}/

Inside:
- original scans
- highlighted scans
- heatmaps
- reports

---

# Logging Rules

Maintain:
- API logs
- AI logs
- upload logs
- comparison logs
- PDF generation logs

---

# Error Handling

Handle:
- invalid MRI image
- unsupported formats
- Gemini API failures
- missing scans
- corrupted uploads

---

# Security Rules

- validate uploads
- sanitize filenames
- environment variables only
- secure API keys
- limit upload size

---

