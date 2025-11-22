"""
Endpoints for image/video analysis
"""
from fastapi import APIRouter
from app.models.media import ImageAnalysisRequest, ImageAnalysisResponse, VideoAnalysisRequest, VideoAnalysisResponse

router = APIRouter()

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image(request: ImageAnalysisRequest):
    # TODO: Implement image analysis
    return ImageAnalysisResponse(findings="none", score=0.0)

@router.post("/analyze-video", response_model=VideoAnalysisResponse)
def analyze_video(request: VideoAnalysisRequest):
    # TODO: Implement video analysis
    return VideoAnalysisResponse(findings="none", score=0.0)
