"""
Pydantic schemas for triage requests/responses
"""
from pydantic import BaseModel

class TriageRequest(BaseModel):
    text: str
    image_url: str = None
    video_url: str = None

class TriageResponse(BaseModel):
    result: str
    confidence: float
