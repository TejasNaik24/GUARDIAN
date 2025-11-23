"""Main FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, chat, ingest
from app.utils.logger import setup_logger
from app.config import get_settings

# Initialize logger
logger = setup_logger()

# Create FastAPI app
app = FastAPI(
    title="Guardian AI Backend",
    description="Medical AI assistant with RAG capabilities",
    version="1.0.0"
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.environment == "development" else ["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(ingest.router, prefix="/api", tags=["Ingest"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Guardian AI Backend starting up...")
    logger.info(f"Environment: {settings.environment}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Guardian AI Backend shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development"
    )
