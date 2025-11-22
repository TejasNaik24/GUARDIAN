"""
User schemas (optional, for login/signup)
"""
from pydantic import BaseModel

class UserLogin(BaseModel):
    username: str
    password: str

class UserSignup(BaseModel):
    username: str
    password: str
    email: str
