"""
Schemas for image/video/document analysis
"""
from pydantic import BaseModel

class ImageAnalysisRequest(BaseModel):
    image_url: str

class ImageAnalysisResponse(BaseModel):
    findings: str
    score: float

class VideoAnalysisRequest(BaseModel):
    video_url: str

class VideoAnalysisResponse(BaseModel):
    findings: str
    score: float
