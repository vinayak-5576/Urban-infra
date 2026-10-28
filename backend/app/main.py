import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.v1 import auth, zones, reports, issues, analytics
from backend.app.ml.text_classifier import classifier

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Urban Infrastructure Intelligence API",
    description="Issue-Centric Urban Infrastructure Intelligence for Bengaluru: Report Linking, Explainable Prioritisation, and Accountability Analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for report attachments
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(zones.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(issues.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Urban Infrastructure Intelligence Engine",
        "study_area": settings.STUDY_AREA_NAME,
        "database": "connected",
        "text_classifier": {
            "status": "ready",
            "version": classifier.model_version
        },
        "synthetic_banner_enabled": settings.ENABLE_SYNTHETIC_DATA_BANNER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
