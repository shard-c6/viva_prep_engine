"""
Viva Prep Engine — Custom Exceptions
Typed error hierarchy for the Lambda worker pipeline.
"""


class VivaEngineError(Exception):
    """Base exception for all Viva Prep Engine errors."""

    def __init__(self, message: str, error_code: str):
        super().__init__(message)
        self.error_code = error_code


class InvalidRepoError(VivaEngineError):
    """Raised when the GitHub repository URL is invalid or inaccessible."""

    def __init__(self, message: str = "Repository not found or inaccessible"):
        super().__init__(message, error_code="REPO_NOT_FOUND")


class RepoTooLargeError(VivaEngineError):
    """Raised when the repository exceeds size or file count limits."""

    def __init__(self, message: str = "Repository exceeds size limits"):
        super().__init__(message, error_code="REPO_TOO_LARGE")


class EmptyRepoError(VivaEngineError):
    """Raised when the repository contains no code files."""

    def __init__(self, message: str = "Repository appears to be empty"):
        super().__init__(message, error_code="EMPTY_REPO")


class UnsupportedLanguageError(VivaEngineError):
    """Raised when no supported language files are found."""

    def __init__(self, message: str = "No supported code files found"):
        super().__init__(message, error_code="UNSUPPORTED_LANGUAGE")


class AIProcessingError(VivaEngineError):
    """Raised when the Gemini API call fails or returns invalid data."""

    def __init__(self, message: str = "AI analysis failed"):
        super().__init__(message, error_code="AI_ERROR")


class AITimeoutError(VivaEngineError):
    """Raised when the Gemini API call times out."""

    def __init__(self, message: str = "AI analysis timed out"):
        super().__init__(message, error_code="AI_TIMEOUT")


class GitHubRateLimitError(VivaEngineError):
    """Raised when GitHub rate-limits the bot PAT."""

    def __init__(self, message: str = "GitHub API rate limit exceeded"):
        super().__init__(message, error_code="GITHUB_RATE_LIMITED")


class DatabaseWriteError(VivaEngineError):
    """Raised when writing to Supabase fails."""

    def __init__(self, message: str = "Failed to write results to database"):
        super().__init__(message, error_code="DB_WRITE_ERROR")
