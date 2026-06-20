"""
VERA — Configuration Management
Loads environment variables with validation.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    """Immutable configuration loaded from environment variables."""

    gemini_api_key: str
    supabase_url: str
    supabase_service_key: str
    github_pat: str

    # Limits
    max_repo_size_mb: int = 50
    max_file_count: int = 200
    max_single_file_kb: int = 100
    max_concurrent_jobs: int = 5
    max_daily_jobs: int = 20
    flashcard_count: int = 10

    # AI settings
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_temperature: float = 0.3
    gemini_max_output_tokens: int = 8192


def load_config() -> Config:
    """Load and validate configuration from environment variables."""
    required_vars = {
        "GEMINI_API_KEY": "Gemini API key for AI analysis",
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_SERVICE_KEY": "Supabase service role key",
        "GITHUB_PAT": "GitHub Personal Access Token (bot account)",
    }

    missing = [
        f"  - {var}: {desc}"
        for var, desc in required_vars.items()
        if not os.environ.get(var)
    ]

    if missing:
        raise EnvironmentError(
            "Missing required environment variables:\n" + "\n".join(missing)
        )

    return Config(
        gemini_api_key=os.environ["GEMINI_API_KEY"],
        supabase_url=os.environ["SUPABASE_URL"],
        supabase_service_key=os.environ["SUPABASE_SERVICE_KEY"],
        github_pat=os.environ["GITHUB_PAT"],
    )
