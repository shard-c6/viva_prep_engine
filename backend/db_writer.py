"""
VERA — Database Writer
Handles all Supabase write operations using the service_role key.
"""

import json
import urllib.request
import urllib.error
from typing import Any
from datetime import datetime, timezone

from config import Config
from errors import DatabaseWriteError


class SupabaseClient:
    """Simple Supabase REST API client using the service_role key."""

    def __init__(self, config: Config):
        self.base_url = config.supabase_url
        self.service_key = config.supabase_service_key
        self.headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def _request(
        self,
        method: str,
        table: str,
        data: dict | None = None,
        query_params: str = "",
    ) -> None:
        """Make a request to the Supabase REST API."""
        url = f"{self.base_url}/rest/v1/{table}{query_params}"

        request = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8") if data else None,
            headers=self.headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                pass  # We use Prefer: return=minimal, so no body expected

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="ignore")
            raise DatabaseWriteError(
                f"Supabase {method} to {table} failed (HTTP {e.code}): {error_body[:300]}"
            )
        except urllib.error.URLError as e:
            raise DatabaseWriteError(
                f"Failed to connect to Supabase: {e.reason}"
            )

    def update_job_status(
        self,
        job_id: str,
        status: str,
        error_code: str | None = None,
        error_message: str | None = None,
        file_count: int | None = None,
        total_size_bytes: int | None = None,
    ) -> None:
        """
        Update a job's status in the jobs table.

        Args:
            job_id: The UUID of the job to update.
            status: New status ('processing', 'completed', 'failed').
            error_code: Error code if status is 'failed'.
            error_message: Human-readable error description.
            file_count: Number of code files processed.
            total_size_bytes: Total size of all processed files.
        """
        now = datetime.now(timezone.utc).isoformat()

        data: dict[str, Any] = {
            "status": status,
            "updated_at": now,
        }

        if status == "processing":
            data["processing_started_at"] = now
        elif status in ("completed", "failed"):
            data["processing_completed_at"] = now

        if error_code:
            data["error_code"] = error_code
        if error_message:
            data["error_message"] = error_message
        if file_count is not None:
            data["file_count"] = file_count
        if total_size_bytes is not None:
            data["total_size_bytes"] = total_size_bytes

        # Use PATCH with query filter to update by job_id
        self._request(
            method="PATCH",
            table="jobs",
            data=data,
            query_params=f"?id=eq.{job_id}",
        )

    def insert_report(
        self,
        job_id: str,
        ai_result: dict[str, Any],
    ) -> None:
        """
        Insert a completed report into the reports table.

        Args:
            job_id: The UUID of the parent job.
            ai_result: The validated AI response containing all report data.
        """
        metadata = ai_result.pop("_metadata", {})

        data = {
            "job_id": job_id,
            "architecture_summary": ai_result["architecture_summary"],
            "components": ai_result["components"],
            "report_sections": ai_result["report_sections"],
            "viva_flashcards": ai_result["viva_flashcards"],
            "model_used": metadata.get("model_used", "gemini-2.5-flash-lite"),
            "input_tokens": metadata.get("input_tokens"),
            "output_tokens": metadata.get("output_tokens"),
        }

        self._request(method="POST", table="reports", data=data)
