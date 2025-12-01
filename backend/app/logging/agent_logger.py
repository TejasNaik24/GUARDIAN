import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional
from app.utils.logger import setup_logger

# Use the existing logger setup but add specific agent formatting
base_logger = setup_logger()

class AgentLogger:
    """Structured logger for agent operations"""
    
    @staticmethod
    def log_agent_execution(
        agent_name: str,
        request_id: str,
        duration_ms: float,
        success: bool,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an agent execution event"""
        log_entry = {
            "event": "agent_execution",
            "agent": agent_name,
            "request_id": request_id,
            "duration_ms": duration_ms,
            "success": success,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        # Log as JSON for easy parsing
        base_logger.info(json.dumps(log_entry))

    @staticmethod
    def log_routing_decision(
        request_id: str,
        user_message: str,
        selected_agents: list,
        scores: Dict[str, float]
    ):
        """Log a routing decision"""
        log_entry = {
            "event": "routing_decision",
            "request_id": request_id,
            "message_preview": user_message[:50],
            "selected_agents": selected_agents,
            "scores": scores,
            "timestamp": datetime.utcnow().isoformat()
        }
        base_logger.info(json.dumps(log_entry))

agent_logger = AgentLogger()
