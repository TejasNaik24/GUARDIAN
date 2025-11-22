"""
POST /triage endpoint for text, image, video
"""
from fastapi import APIRouter
from app.models.triage import TriageRequest, TriageResponse

router = APIRouter()

@router.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest):
    # TODO: Implement triage logic
    return TriageResponse(result="ok", confidence=1.0)
