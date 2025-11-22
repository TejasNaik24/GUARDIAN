"""
Configuration loader for environment variables, API keys, etc.
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    GOOGLE_ADK_KEY = os.getenv("GOOGLE_ADK_KEY")
    # ...add more config as needed...
