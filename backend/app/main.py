from fastapi import FastAPI
from app.routes import triage_routes, media_routes, rag_routes, auth_routes, health

app = FastAPI()

# Include routers
app.include_router(triage_routes.router)
app.include_router(media_routes.router)
app.include_router(rag_routes.router)
app.include_router(auth_routes.router)
app.include_router(health.router)

# ...existing code...
