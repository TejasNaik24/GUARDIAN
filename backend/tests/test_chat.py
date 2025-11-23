"""Tests for chat endpoints"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_chat_without_auth():
    """Test chat endpoint requires authentication"""
    response = client.post(
        "/api/chat",
        json={"message": "Hello"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_with_auth(auth_token):
    """Test chat endpoint with authentication"""
    response = client.post(
        "/api/chat",
        json={"message": "What is diabetes?"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert "message" in data
    assert data["role"] == "assistant"


@pytest.mark.asyncio
async def test_chat_empty_message():
    """Test chat with empty message"""
    response = client.post(
        "/api/chat",
        json={"message": ""}
    )
    assert response.status_code == 422  # Validation error
