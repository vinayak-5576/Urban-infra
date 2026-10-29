# Known Limitations & Academic Engineering Evaluation

This document honestly records the technical trade-offs, architecture constraints, and limitations of the current Phase-2 implementation of the **Urban Infrastructure Intelligence Platform**, in accordance with project defense standards and `docs/AGENT_RULES.md`.

---

## 1. Storage & Database: SQLite vs Production PostGIS
- **Current State:** The platform runs on **SQLite** (`urban_infra.db`) using SQLAlchemy 2.0 and Alembic for schema migrations.
- **Why It Was Chosen:** Enables zero-dependency local execution, instant reproducible test suites, and portable demonstrations across evaluator machines without requiring external daemon setup.
- **Limitations:**
  - **Write Concurrency:** SQLite uses database-level locking on writes. High-throughput citizen report bursts under production load will encounter write contention.
  - **Spatial Indexing:** SQLite lacks native PostGIS spatial indices (such as GiST or R-Tree indices over binary geometry types). Spatial lookups currently require querying zone boundaries into application memory.
- **Migration Path:** The data model strictly uses standard SQLAlchemy types and GeoJSON representations. The system is designed for direct migration to **PostgreSQL 16 + PostGIS**, replacing SQLite without changing application-level service contracts.

---

## 2. Geospatial Computation: Application-Level Ray-Casting
- **Current State:** Point-in-Polygon (PIP) zone boundary matching and Haversine distance calculations are implemented in **pure Python** (`RayCastingGeoService` implementing `IGeoService` in `backend/app/services/geo.py`).
- **Why It Was Chosen:** Pre-compiled C++ spatial binaries (such as `GEOS` C-libraries used by native GDAL/Shapely) are blocked on certain student Windows workstations by Windows Defender Application Control policies. The pure Python implementation operates with zero security policy friction.
- **Limitations:**
  - **Complexity:** Evaluating ray intersections runs in $O(N \cdot M)$ time per point, where $M$ is the number of polygon boundary vertices. While instantaneous across 6 pilot zones (dozens of vertices), it will degrade if evaluated against all 369 GBA ward boundaries without spatial bounding-box indexing.
  - **Complex Geometries:** Multipolygons with internal voids (islands or holes) require simplified exterior ring processing.
- **Mitigation:** The `IGeoService` interface isolates all spatial logic. When deployed on a Linux/Docker environment with PostGIS, a `PostGISGeoService` can be injected without altering API routers or tests.

---

## 3. Issue Linking & Deduplication (v0 Heuristic)
- **Current State:** Incoming reports are linked to canonical issues using a **deterministic spatial buffer (25-meter radius)** and category matching (`backend/app/services/linking.py`).
- **Limitations:**
  - **False Merges:** Two distinct potholes located 10 meters apart on the same stretch of road will currently be clustered into a single canonical issue.
  - **GPS Drift:** Mobile phone GPS drift exceeding 25 meters in dense urban street canyons can cause missed links (false negatives), resulting in separate canonical tickets.
  - **Multimodal Absence:** While perceptual image hashing (`dHash`) is computed and stored for visual duplicate screening, the v0 linker relies primarily on spatial-temporal proximity rather than a learned Siamese multimodal neural network.
- **Safeguards:** An immutable audit log records every report-issue link. Lifecycle transitions and citizen verification ensure that even if two nearby defects are merged, both reporting citizens have independent verification rights.

---

## 4. Text Classifier: Data Origin & Vocabulary
- **Current State:** Automatic category suggestion (`/api/v1/reports/suggest-category`) uses a lightweight **TF-IDF + Cosine Centroid Classifier** (`backend/app/ml/text_classifier.py`).
- **Data Origin:** The training corpus consists of hand-curated and synthetic civic complaint sentences reflecting realistic BBMP/GBA complaint patterns (e.g., pothole hazard descriptions, foul-smelling garbage dumps, waterlogging, broken streetlights).
- **Limitations:**
  - **Training Scale:** The model is trained on a focused dataset of civic patterns, not hundreds of thousands of scraped municipal tickets.
  - **Code-Mixing & Kannada Script:** The vocabulary handles English and common Bengaluru Kannada romanized terms (e.g., *gundi*, *kachra*, *khalasa*), but does not yet feature a full Kannada Unicode subword tokenizer.
  - **Conservative Inference:** The classifier enforces a minimum confidence threshold ($\ge 0.50$). If input text is ambiguous, the model deliberately returns no suggestion (`None`), preventing erroneous automated categorization.

---

## 5. Metrics & Municipal Boundaries (Transparency Over Competition)
- **Data Status:** All users, departments, responsibility rules, and zones are explicitly flagged with `is_demo = true` and `is_synthetic = true`.
- **Wards & Jurisdictions:**
  - Pilot zone boundaries are approximate spatial reference sectors representing 6 Bengaluru study zones (Koramangala, Indiranagar, HSR Layout, Whitefield, Jayanagar, Malleshwaram).
  - Wards are explicitly labelled as **"Approximate (BBMP-era demo reference)"**, reflecting the real-world ongoing transition under the Greater Bengaluru Governance Act, 2024.
- **Fair Analytics Policy (Stage 12 Compliance):**
  - The platform **strictly avoids composite leaderboard rankings or gamified scorecards** for zones or municipal officers.
  - Zones with fewer than 20 observations ($n < 20$) are explicitly flagged as `insufficient_data`, suppressing premature comparative conclusions.
  - SLA adherence is reported with **Wilson 95% confidence intervals** rather than raw point estimates.

---

## 6. Hardware & External Integrations
- **IoT Telemetry:** Ultrasonic water-level flood sensor telemetry (ESP32 + JSN-SR04T) is strictly scoped for Phase 3 / stretch exploration. The core platform operates independently of physical hardware.
- **Government APIs:** The platform operates as a standalone civic intelligence prototype. No live credentials or dependencies on internal BBMP Sahaaya or GBA servers exist or are assumed.
