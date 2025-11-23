"""Logging configuration using Loguru"""
from loguru import logger
import sys
from app.config import get_settings


def setup_logger():
    """
    Configure Loguru logger with custom format
    
    Returns:
        Configured logger instance
    """
    settings = get_settings()
    
    # Remove default handler
    logger.remove()
    
    # Add custom handler with format
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True
    )
    
    # Add file handler for production
    if settings.environment == "production":
        logger.add(
            "logs/guardian_{time}.log",
            rotation="500 MB",
            retention="10 days",
            level="INFO"
        )
    
    return logger
