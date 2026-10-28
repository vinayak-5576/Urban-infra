# System Architecture — Urban Infrastructure Intelligence

## Overview
This platform implements an **issue-centric civic intelligence system** for urban infrastructure maintenance in Bengaluru. It decouples raw citizen submissions (treated as **observations**) from tracked **issues** (real-world potholes, open trenches, garbage dumps), establishing an auditable lifecycle and explainable multi-factor prioritization.

## Architecture Diagram

```mermaid
flowchart TB
  subgraph Clients["Client Interface (React 18 + TypeScript + Vite)"]
    CW["Citizen Web App (Map Pin, Photo Upload, AI Chip)"]
    SW["Operations Dashboard (Prioritized Queue, State Machine)"]
    AN["Intelligence Analytics (SLA, Linking Ratio, Reopen Rate)"]
  end

  subgraph API["FastAPI Backend (RESTful JSON)"]
    AUTH["JWT Authentication & RBAC Engine"]
    GEO["Spatial Engine (Ray-Casting Point-in-Polygon & Haversine)"]
    AI["AI-1 Text Classifier (TF-IDF & Centroid Cosine)"]
    LINK["Issue Linking & Deduplication Service"]
    PRI["Explainable Multi-Factor Priority Scorer"]
    AUD["Audit Logger & Lifecycle State Machine"]
    STO["Secure Storage (EXIF Stripping, dHash Deduplication)"]
  end

  subgraph Storage["Persistent Layer"]
    DB[("Relational DB (SQLite / PostgreSQL)")]
    FS[("Sanitized Upload Volume (/uploads)")]
  end

  CW --> AUTH
  SW --> AUTH
  CW --> GEO
  CW --> AI
  CW --> STO
  STO --> FS
  CW --> LINK
  LINK --> PRI
  LINK --> AUD
  SW --> AUD
  AN --> DB
  AUTH --> DB
  LINK --> DB
  AUD --> DB
```

## Key Technical Decisions
1. **Issue-Centric Spine:** Avoids ticket inflation by grouping spatial and semantic duplicates into a single ground truth issue record.
2. **Pure Python Spatial Verification:** Uses ray-casting Point-in-Polygon against official GeoJSON polygons for Koramangala, Indiranagar, and HSR Layout, ensuring zero dependency on complex native C GIS libraries while guaranteeing portability.
3. **Auditable Citizen Verification:** A municipal officer cannot unilaterally mark a defect closed; it transitions to `resolved_pending_verification`, requiring citizen sign-off (`closed_verified`) or dispute (`reopened`).
4. **Hardware Scoping:** ESP32 water-level sensor telemetry is reserved for Phase 3 (if time permits).
