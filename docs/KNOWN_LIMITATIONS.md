# Known Limitations & Project Status

### Phase 2 Evaluation Status
- **Current Milestone:** Phase 2 Vertical Slice
- **Study Area:** Pilot Demo Zones in Bengaluru (Koramangala, Indiranagar, HSR Layout).
- **Data Status:** Uses seeded demo and synthetic data flagged with `is_demo = true` and `is_synthetic = true`.
- **Hardware Integration:** The ESP32 water-level sensor node is explicitly deferred to Phase 3 (if time permits).

### Technical Limitations
1. **Pilot Boundary:** Submissions outside the pilot coordinates are rejected with an informative error message.
2. **Text Classifier Baseline:** Initial model uses TF-IDF / keyword baseline; fine-tuned embeddings model will be evaluated when more real Bengaluru complaint texts are collected.
3. **Database & Geo Engine:** Configured to run on SQLite with Shapely/GeoJSON geospatial verification for maximum portability and zero-server dependency during academic demonstrations, with full compatibility for PostgreSQL + PostGIS.
