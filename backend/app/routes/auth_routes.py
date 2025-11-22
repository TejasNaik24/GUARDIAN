"""
User login/signup endpoints (optional)
"""
from fastapi import APIRouter
from app.models.auth import UserLogin, UserSignup

router = APIRouter()

@router.post("/login")
def login(user: UserLogin):
    # TODO: Implement login
    return {"status": "logged in"}

@router.post("/signup")
def signup(user: UserSignup):
    # TODO: Implement signup
    return {"status": "signed up"}
