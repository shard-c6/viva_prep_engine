"""
Viva Prep Engine — JSON Schemas for AI Output
Defines the enforced response schema for Gemini API calls.
"""

# Schema passed to Gemini's response_schema parameter
# to enforce structured JSON output.

COMPONENT_SCHEMA = {
    "type": "object",
    "properties": {
        "file_path": {
            "type": "string",
            "description": "Relative path to the file from the repo root",
        },
        "language": {
            "type": "string",
            "description": "Programming language of the file",
        },
        "purpose": {
            "type": "string",
            "description": "One-sentence description of what this file does",
        },
        "key_functions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of important function/method names in this file",
        },
        "dependencies": {
            "type": "array",
            "items": {"type": "string"},
            "description": "External libraries or modules this file imports",
        },
        "complexity": {
            "type": "string",
            "enum": ["low", "medium", "high"],
            "description": "Relative complexity level of this file",
        },
        "lines_of_code": {
            "type": "integer",
            "description": "Approximate number of lines of code",
        },
    },
    "required": [
        "file_path",
        "language",
        "purpose",
        "key_functions",
        "dependencies",
        "complexity",
        "lines_of_code",
    ],
}

REPORT_SECTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "problem_statement": {
            "type": "string",
            "description": "What problem does this project solve?",
        },
        "system_design": {
            "type": "string",
            "description": "High-level architecture and design patterns used",
        },
        "execution_flow": {
            "type": "string",
            "description": "Step-by-step flow of how the application executes",
        },
        "tech_stack_rationale": {
            "type": "string",
            "description": "Why specific technologies were chosen",
        },
        "key_algorithms": {
            "type": "string",
            "description": "Notable algorithms or data structures used",
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "description": "What the project does well",
        },
        "improvement_areas": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Areas where the project could be improved",
        },
    },
    "required": [
        "problem_statement",
        "system_design",
        "execution_flow",
        "tech_stack_rationale",
        "key_algorithms",
        "strengths",
        "improvement_areas",
    ],
}

FLASHCARD_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Sequential flashcard number (1-10)",
        },
        "difficulty": {
            "type": "string",
            "enum": ["beginner", "intermediate", "advanced"],
            "description": "Difficulty level of this question",
        },
        "question": {
            "type": "string",
            "description": "A Viva question specific to this codebase",
        },
        "model_answer": {
            "type": "string",
            "description": "A comprehensive model answer",
        },
        "follow_up": {
            "type": "string",
            "description": "A follow-up question an evaluator might ask",
        },
        "topic_tag": {
            "type": "string",
            "description": "Category tag (e.g., 'framework_selection', 'error_handling')",
        },
    },
    "required": [
        "id",
        "difficulty",
        "question",
        "model_answer",
        "follow_up",
        "topic_tag",
    ],
}

# Top-level schema enforced via Gemini's response_schema parameter
REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "architecture_summary": {
            "type": "string",
            "description": "A 2-3 paragraph high-level overview of the codebase architecture",
        },
        "components": {
            "type": "array",
            "items": COMPONENT_SCHEMA,
            "description": "Detailed breakdown of each significant code file",
        },
        "report_sections": REPORT_SECTIONS_SCHEMA,
        "viva_flashcards": {
            "type": "array",
            "items": FLASHCARD_SCHEMA,
            "description": "Exactly 10 Viva preparation flashcards",
        },
    },
    "required": [
        "architecture_summary",
        "components",
        "report_sections",
        "viva_flashcards",
    ],
}
