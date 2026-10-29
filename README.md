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

* **Backend:** Python 3.12 / 3.15, FastAPI, Pydantic v2, SQLAlchemy 2.0, GeoAlchemy2, PostGISGeoService
* **Database & Geospatial:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`), GiST indexing over `geography(Point,4326)` and `geometry(MultiPolygon,4326)`
* **Schema Evolution:** Alembic migrations (`alembic/versions/`), single schema path
* **Frontend:** React 18, TypeScript, Vite, Leaflet Maps, Lucide Icons, Modern Dark Glassmorphism CSS Design System
* **Containerization:** Docker Compose with `db`, `api`, and `web` services
* **Documentation & Audit:** `docs/AGENT_RULES.md`, `docs/KNOWN_LIMITATIONS.md`

---

## Quick Start (Docker Compose - Recommended)

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Start Services via Docker Compose
Build and start PostgreSQL 16 + PostGIS, FastAPI backend, and Vite frontend:
```bash
docker compose up -d --build
```
This automatically runs database healthchecks, applies `alembic upgrade head`, and starts:
* **Web UI:** http://localhost:5173
* **API Documentation:** http://localhost:8000/docs
* **Database:** localhost:5432 (database: `urban_infra`, test db: `urban_infra_test`)

### 3. Database Migration & Seeding (Exact Commands)
To run Alembic migrations manually or inspect schema:
```bash
docker compose exec api alembic upgrade head
```
To seed demo personas, pilot zones, and realistic ground defects:
```bash
docker compose exec api python -m seed.load
```

### 4. Running Tests (Isolated Test Database)
Tests execute against the dedicated `urban_infra_test` database in Docker Compose without mutating dev data:
```bash
docker compose exec api pytest -v backend/tests
```

---

## Local Setup (Without Docker Compose)

Ensure PostgreSQL 16 with PostGIS 3.4 is running locally (e.g., via `docker compose up -d db`):

```powershell
# 1. Run migrations
$env:PYTHONPATH="."
.\venv\Scripts\python.exe -m alembic upgrade head

# 2. Reseed database
.\venv\Scripts\python.exe -m seed.load

# 3. Start API server
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# 4. Start Frontend (in separate terminal)
cd frontend
npm run dev

# 5. Run Test Suite (all 15 unit and spatial tests)
$env:PYTHONPATH="."
.\venv\Scripts\python.exe -m pytest -v backend/tests
```

---

## Demo Accounts (1-Click Sign In)

* **Citizen:** `citizen@demo.org` / `citizen123`
* **Road Officer:** `officer@gba.civic.in` / `officer123`
* **Zone Head:** `head@gba.civic.in` / `head123`
* **System Admin:** `admin@gba.civic.in` / `admin123`
