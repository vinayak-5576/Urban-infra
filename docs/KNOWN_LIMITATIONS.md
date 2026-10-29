# Known Limitations & Academic Engineering Evaluation

This document honestly records the technical trade-offs, architecture constraints, and limitations of the current Phase-2 implementation of the **Urban Infrastructure Intelligence Platform**, in accordance with project defense standards and `docs/AGENT_RULES.md`.

---

## 1. Storage & Database: PostgreSQL 16 + PostGIS (Resolved)
- **Current State:** The platform runs on **PostgreSQL 16 with PostGIS 3.4** (`postgis/postgis:16-3.4` container).
- **Architecture:**
  - Alembic is the single authoritative schema path (`alembic/versions/`).
  - Spatial point columns in `issues` and `reports` are indexed with native PostGIS `geography(Point, 4326)` and GiST indexes (`idx_issues_location`, `idx_reports_location`).
  - Zone boundary polygons are stored as `geometry(MultiPolygon, 4326)` with GiST indexes (`idx_zones_geom`).
  - Full transactional ACID guarantees and high-concurrency connection pooling via `psycopg` replace SQLite single-file write locking.
- **Verification:** Continuous integration tests execute against a dedicated, isolated test database (`urban_infra_test`) in Docker Compose, guaranteeing zero contamination of development data.

---

## 2. Geospatial Computation: PostGIS with In-Memory Oracle
- **Current State:** Zone lookup is performed natively via PostGIS `ST_Contains(geom, point)`. Proximity and duplicate candidate screening use geodetic `ST_DWithin(location, point, radius_m)`.
- **Test Oracle:** The pure-Python `RayCastingGeoService` is retained behind the `IGeoService` interface as an authoritative reference oracle.
- **Mathematical Validation:** Automated test suite tests 200 random points distributed across the Greater Bengaluru pilot study area, proving 100% agreement between PostGIS spatial predicates and the pure-Python oracle, with geodetic distances agreeing within < 1 metre tolerance.

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
