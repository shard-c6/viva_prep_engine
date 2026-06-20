"""
Viva Prep Engine — Lambda Handler
Entry point for the AWS Lambda function triggered by SQS.
"""

import json
import os
import tempfile
import logging
from typing import Any

from config import load_config
from errors import VivaEngineError
from repo_downloader import parse_github_url, download_tarball
from code_chunker import unpack_tarball, extract_code_files, build_context_prompt
from ai_engine import call_gemini
from db_writer import SupabaseClient


# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    AWS Lambda entry point — triggered by SQS.

    Each SQS message contains:
    {
        "job_id": "uuid",
        "repo_url": "https://github.com/owner/repo",
        "tech_stack": "Python",
        "viva_difficulty": "intermediate"
    }

    The function:
    1. Downloads the repo as a tarball
    2. Extracts and chunks the code files
    3. Calls Gemini API for analysis
    4. Writes the report to Supabase
    5. Updates the job status throughout
    """
    # Load config once per cold start (stays in memory for warm invocations)
    config = load_config()
    db = SupabaseClient(config)

    # Process each SQS record (batch size is 1, but handle the array)
    for record in event.get("Records", []):
        message = json.loads(record["body"])
        job_id = message["job_id"]
        repo_url = message["repo_url"]
        tech_stack = message["tech_stack"]
        difficulty = message["viva_difficulty"]

        logger.info(f"Processing job {job_id}: {repo_url} ({tech_stack}, {difficulty})")

        try:
            # Step 1: Mark job as processing
            db.update_job_status(job_id, "processing")

            # Step 2: Parse and validate the GitHub URL
            repo_info = parse_github_url(repo_url)
            logger.info(f"Parsed repo: {repo_info.owner}/{repo_info.name}")

            # Step 3: Download tarball to /tmp
            with tempfile.TemporaryDirectory(dir="/tmp") as tmp_dir:
                logger.info("Downloading tarball...")
                tarball_path = download_tarball(
                    repo_info=repo_info,
                    github_pat=config.github_pat,
                    output_dir=tmp_dir,
                    max_size_mb=config.max_repo_size_mb,
                )

                # Step 4: Unpack and extract code files
                logger.info("Unpacking and extracting code files...")
                repo_dir = unpack_tarball(tarball_path, tmp_dir)
                code_files = extract_code_files(
                    repo_dir=repo_dir,
                    max_file_count=config.max_file_count,
                    max_single_file_kb=config.max_single_file_kb,
                )

                total_size = sum(f.size_bytes for f in code_files)
                logger.info(
                    f"Found {len(code_files)} code files ({total_size:,} bytes)"
                )

                # Update job with file metrics
                db.update_job_status(
                    job_id,
                    "processing",
                    file_count=len(code_files),
                    total_size_bytes=total_size,
                )

                # Step 5: Build context prompt for AI
                context_prompt = build_context_prompt(code_files, repo_url)
                logger.info(
                    f"Built context prompt: ~{len(context_prompt)} chars"
                )

                # Step 6: Call Gemini API
                logger.info("Calling Gemini API...")
                ai_result = call_gemini(
                    code_context=context_prompt,
                    tech_stack=tech_stack,
                    difficulty=difficulty,
                    config=config,
                )
                logger.info("Gemini API response received and validated")

                # Step 7: Write report to Supabase
                logger.info("Writing report to Supabase...")
                db.insert_report(job_id, ai_result)

                # Step 8: Mark job as completed
                db.update_job_status(job_id, "completed")
                logger.info(f"Job {job_id} completed successfully")

        except VivaEngineError as e:
            # Known, typed errors — update job with specific error info
            logger.warning(f"Job {job_id} failed ({e.error_code}): {e}")
            db.update_job_status(
                job_id,
                "failed",
                error_code=e.error_code,
                error_message=str(e),
            )

        except Exception as e:
            # Unknown errors — log, update job, and re-raise for SQS retry/DLQ
            logger.error(f"Job {job_id} failed with unexpected error: {e}", exc_info=True)
            try:
                db.update_job_status(
                    job_id,
                    "failed",
                    error_code="INTERNAL_ERROR",
                    error_message="An unexpected error occurred. Please try again.",
                )
            except Exception:
                logger.error("Failed to update job status after unexpected error")

            # Re-raise so SQS retries (and eventually sends to DLQ)
            raise

    return {"statusCode": 200, "body": "OK"}
