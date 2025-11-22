"""
Custom error responses
"""
from fastapi.responses import JSONResponse
from fastapi import Request

async def custom_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc)})
