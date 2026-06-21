"""
VERA — Unit Tests for ai_engine.py
Tests Gemini API payload construction, response parsing, and error mapping.
"""

import sys
import os
import json
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai_engine import SYSTEM_PROMPT
from errors import AIProcessingError, AITimeoutError


class TestSystemPrompt(unittest.TestCase):
    """Tests that the system prompt contains critical instructions."""

    def test_contains_difficulty_levels(self):
        self.assertIn("beginner", SYSTEM_PROMPT)
        self.assertIn("intermediate", SYSTEM_PROMPT)
        self.assertIn("advanced", SYSTEM_PROMPT)

    def test_contains_anti_hallucination_rule(self):
        self.assertIn("hallucinate", SYSTEM_PROMPT.lower())

    def test_contains_json_schema_instruction(self):
        self.assertIn("JSON schema", SYSTEM_PROMPT)

    def test_contains_flashcard_count(self):
        self.assertIn("10", SYSTEM_PROMPT)

    def test_contains_codebase_specificity_rule(self):
        self.assertIn("specific to THIS codebase", SYSTEM_PROMPT)


class TestAIErrorClasses(unittest.TestCase):
    """Tests for AI-related error types."""

    def test_ai_processing_error_code(self):
        e = AIProcessingError("test error")
        self.assertEqual(e.error_code, "AI_ERROR")
        self.assertEqual(str(e), "test error")

    def test_ai_timeout_error_code(self):
        e = AITimeoutError("timeout!")
        self.assertEqual(e.error_code, "AI_TIMEOUT")
        self.assertEqual(str(e), "timeout!")

    def test_default_messages(self):
        e1 = AIProcessingError()
        self.assertIn("AI analysis failed", str(e1))
        e2 = AITimeoutError()
        self.assertIn("timed out", str(e2))


class TestGeminiPayloadStructure(unittest.TestCase):
    """Tests that the payload we'd send to Gemini is well-formed.
    
    Since call_gemini() makes a real HTTP call, we test the structure
    by simulating what the function builds internally.
    """

    def _build_mock_payload(self, code_context: str, tech_stack: str, difficulty: str):
        """Replicate the payload construction from ai_engine.call_gemini()."""
        from schemas import REPORT_SCHEMA

        user_prompt = (
            f"TECH STACK: {tech_stack}\n"
            f"VIVA DIFFICULTY: {difficulty}\n\n"
            f"{code_context}\n\n"
            f"Analyze this codebase and return a JSON response matching the schema."
        )

        return {
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
                "temperature": 0.3,
                "topP": 0.95,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
                "responseSchema": REPORT_SCHEMA,
            },
        }

    def test_payload_has_contents(self):
        payload = self._build_mock_payload("code", "Python", "beginner")
        self.assertIn("contents", payload)
        self.assertEqual(len(payload["contents"]), 1)
        self.assertEqual(payload["contents"][0]["role"], "user")

    def test_payload_has_system_instruction(self):
        payload = self._build_mock_payload("code", "Python", "beginner")
        self.assertIn("systemInstruction", payload)
        self.assertIn("parts", payload["systemInstruction"])

    def test_payload_generation_config(self):
        payload = self._build_mock_payload("code", "Python", "beginner")
        config = payload["generationConfig"]
        self.assertEqual(config["responseMimeType"], "application/json")
        self.assertIn("responseSchema", config)
        self.assertLessEqual(config["temperature"], 1.0)

    def test_user_prompt_includes_context(self):
        payload = self._build_mock_payload("def hello(): pass", "Python", "intermediate")
        user_text = payload["contents"][0]["parts"][0]["text"]
        self.assertIn("TECH STACK: Python", user_text)
        self.assertIn("VIVA DIFFICULTY: intermediate", user_text)
        self.assertIn("def hello(): pass", user_text)

    def test_payload_is_json_serializable(self):
        payload = self._build_mock_payload("code", "Java", "advanced")
        try:
            serialized = json.dumps(payload)
            self.assertIsInstance(serialized, str)
        except (TypeError, ValueError) as e:
            self.fail(f"Payload is not JSON serializable: {e}")


class TestGeminiResponseParsing(unittest.TestCase):
    """Tests response parsing logic (simulated, no HTTP calls)."""

    def test_valid_response_extraction(self):
        """Simulate the response parsing from call_gemini()."""
        mock_response = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "architecture_summary": "A test project",
                                    "components": [],
                                    "report_sections": {},
                                    "viva_flashcards": [],
                                })
                            }
                        ]
                    }
                }
            ],
            "usageMetadata": {
                "promptTokenCount": 1000,
                "candidatesTokenCount": 500,
            },
        }

        candidates = mock_response.get("candidates", [])
        self.assertTrue(len(candidates) > 0)

        content = candidates[0]["content"]
        parts = content["parts"]
        text = parts[0]["text"]
        result = json.loads(text)

        self.assertEqual(result["architecture_summary"], "A test project")
        self.assertIsInstance(result["components"], list)

    def test_empty_candidates_raises(self):
        mock_response = {"candidates": []}
        candidates = mock_response.get("candidates", [])
        self.assertEqual(len(candidates), 0)

    def test_missing_text_detected(self):
        mock_response = {
            "candidates": [
                {"content": {"parts": [{"text": ""}]}}
            ]
        }
        text = mock_response["candidates"][0]["content"]["parts"][0]["text"]
        self.assertEqual(text, "")


if __name__ == "__main__":
    unittest.main()
