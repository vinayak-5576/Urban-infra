# Issue-Centric Urban Infrastructure Intelligence for Bengaluru

An engineering platform for municipal defect tracking, spatial report linking, explainable priority scoring, and lifecycle accountability across Bengaluru pilot zones.

---

## Key Differentiators

1. **Issue-Centric Data Model:** Citizen reports are treated as *observations*. Multiple reports observing the same pothole or broken trench are linked to one tracked *issue*, eliminating ticket inflation.
2. **Explainable Multi-Factor Prioritization:** Priority scores (0–100) are computed via a transparent formula combining Severity ($S$), Arterial Exposure ($E$), Citizen Corroboration ($C$), Recurrence ($R$), and Age vs SLA ($A$).
3. **Auditable Citizen Verification:** Municipal officers cannot unilaterally close issues; repairs enter `resolved_pending_verification` until the citizen confirms or disputes with grounds for reopening.
4. **Geospatial Point-in-Polygon Engine:** Pure Python ray-casting geospatial validation against official pilot boundaries (Koramangala, Indiranagar, and HSR Layout).
5. **AI-1 Text Category Classifier:** In-process TF-IDF & centroid cosine classifier providing instant category recommendations with confidence scoring.
6. **Hardware Scope:** ESP32 water-level sensor telemetry is scheduled for Phase 3 (if time permits).

---

## Architecture & Technology Stack

* **Backend:** Python 3.15, FastAPI, Pydantic v2, SQLAlchemy, Pure Python Geospatial Engine
* **Frontend:** React 18, TypeScript, Vite, Leaflet Maps, Lucide Icons, Modern Vanilla CSS Design System
* **Database:** SQLite (default for 100% portable zero-server local execution) / PostgreSQL + PostGIS ready
* **Documentation:** Architecture Diagram (`docs/architecture.md`), ERD (`docs/erd.md`), Evaluation Script (`docs/demo-script.md`)

---

## Quick Start (Local Setup)

### 1. Backend Setup & Seeding
```powershell
# In project root:
$env:PYTHONPATH="."
.\venv\Scripts\python.exe -m seed.load
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Launch
```powershell
cd frontend
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm.cmd run dev
```
Web Application will be live at `http://127.0.0.1:5173`.

### 3. Run Test Suite
```powershell
$env:PYTHONPATH="."
.\venv\Scripts\python.exe -m pytest backend/tests/test_core.py -v
```

---

## Demo Accounts (1-Click Sign In)

* **Citizen:** `citizen@demo.org` / `citizen123`
* **Road Officer:** `officer@gba.civic.in` / `officer123`
* **Zone Head:** `head@gba.civic.in` / `head123`
* **System Admin:** `admin@gba.civic.in` / `admin123`
