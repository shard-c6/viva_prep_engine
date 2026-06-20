"""
Viva Prep Engine — Gemini AI Engine
Handles communication with Google's Gemini API for codebase analysis.
"""

import json
import urllib.request
import urllib.error
from typing import Any

from config import Config
from schemas import REPORT_SCHEMA
from errors import AIProcessingError, AITimeoutError


# System prompt enforcing codebase-specific analysis
SYSTEM_PROMPT = """You are an expert software engineering evaluator and university project reviewer.
You will receive a codebase from a student project. Your job is to analyze it thoroughly and produce a structured evaluation.

RULES:
- Be specific to THIS codebase. Reference actual file names, function names, and variables.
- Do not hallucinate files or functions that don't exist in the provided code.
- Tailor Viva questions to the exact code written, not generic CS questions.
- Match the requested difficulty level precisely.
- Generate exactly 10 Viva flashcards.
- Output MUST conform exactly to the provided JSON schema.

DIFFICULTY LEVELS:
- beginner: Focus on syntax, basic concepts, "what does this line do?"
- intermediate: Focus on design decisions, "why did you choose X over Y?"
- advanced: Focus on architecture trade-offs, scalability, "how would this handle 10x load?"
"""


def call_gemini(
    code_context: str,
    tech_stack: str,
    difficulty: str,
    config: Config,
) -> dict[str, Any]:
    """
    Call the Gemini API with the codebase context and return structured analysis.

    Uses the Gemini REST API with enforced JSON schema output.

    Args:
        code_context: Formatted code context from the chunker.
        tech_stack: The primary tech stack selected by the user.
        difficulty: Viva difficulty level (beginner/intermediate/advanced).
        config: Application configuration.

    Returns:
        Parsed JSON response matching REPORT_SCHEMA.

    Raises:
        AIProcessingError: If the API call fails or returns invalid data.
        AITimeoutError: If the API call times out.
    """
    user_prompt = (
        f"TECH STACK: {tech_stack}\n"
        f"VIVA DIFFICULTY: {difficulty}\n\n"
        f"{code_context}\n\n"
        f"Analyze this codebase and return a JSON response matching the schema."
    )

    # Build Gemini API request payload
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}],
            }
        ],
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": config.gemini_temperature,
            "topP": 0.95,
            "maxOutputTokens": config.gemini_max_output_tokens,
            "responseMimeType": "application/json",
            "responseSchema": REPORT_SCHEMA,
        },
    }

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{config.gemini_model}:generateContent"
        f"?key={config.gemini_api_key}"
    )

    headers = {
        "Content-Type": "application/json",
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response_data = json.loads(response.read().decode("utf-8"))

    except urllib.error.URLError as e:
        if "timed out" in str(e).lower():
            raise AITimeoutError("Gemini API request timed out after 120 seconds")
        raise AIProcessingError(f"Failed to connect to Gemini API: {e.reason}")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        raise AIProcessingError(
            f"Gemini API returned HTTP {e.code}: {error_body[:500]}"
        )

    except json.JSONDecodeError as e:
        raise AIProcessingError(f"Invalid JSON in Gemini API response: {e}")

    # Extract the generated text from the response
    try:
        candidates = response_data.get("candidates", [])
        if not candidates:
            raise AIProcessingError("Gemini returned no candidates")

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        if not parts:
            raise AIProcessingError("Gemini response has no content parts")

        text = parts[0].get("text", "")
        if not text:
            raise AIProcessingError("Gemini response text is empty")

        # Parse the JSON output
        result = json.loads(text)

    except (KeyError, IndexError) as e:
        raise AIProcessingError(f"Unexpected Gemini response structure: {e}")

    except json.JSONDecodeError as e:
        raise AIProcessingError(f"Gemini returned invalid JSON in text: {e}")

    # Extract token usage metadata
    usage = response_data.get("usageMetadata", {})
    result["_metadata"] = {
        "input_tokens": usage.get("promptTokenCount", 0),
        "output_tokens": usage.get("candidatesTokenCount", 0),
        "model_used": config.gemini_model,
    }

    return result
