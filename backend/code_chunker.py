"""
Viva Prep Engine — Code Chunker
Filters, validates, and aggregates code files into AI-ready context blocks.
"""

import os
import tarfile
import tempfile
from pathlib import Path
from typing import NamedTuple

from errors import (
    EmptyRepoError,
    RepoTooLargeError,
    UnsupportedLanguageError,
)


class CodeFile(NamedTuple):
    """Represents a single code file extracted from a repository."""

    path: str  # Relative path from repo root
    content: str  # File content (potentially truncated)
    language: str  # Detected language
    size_bytes: int  # Original file size


# Language → file extension mapping
LANGUAGE_EXTENSIONS: dict[str, set[str]] = {
    "C": {".c", ".h"},
    "C++": {".cpp", ".hpp", ".cc", ".hh", ".cxx", ".hxx", ".h"},
    "Java": {".java"},
    "Python": {".py"},
    "JavaScript": {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"},
}

# All supported extensions (union of all languages)
ALL_SUPPORTED_EXTENSIONS: set[str] = set()
for exts in LANGUAGE_EXTENSIONS.values():
    ALL_SUPPORTED_EXTENSIONS.update(exts)

# Directories to always skip
IGNORE_DIRS: set[str] = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    ".next",
    "target",
    ".idea",
    ".vscode",
    "vendor",
    "packages",
    ".gradle",
    "bin",
    "obj",
    ".mypy_cache",
    ".pytest_cache",
    ".tox",
    "env",
    ".egg-info",
}

# Specific files to always skip
IGNORE_FILES: set[str] = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Pipfile.lock",
    "poetry.lock",
    ".DS_Store",
    "Thumbs.db",
}


def detect_language(file_path: str) -> str | None:
    """Detect the programming language from file extension."""
    ext = Path(file_path).suffix.lower()
    for language, extensions in LANGUAGE_EXTENSIONS.items():
        if ext in extensions:
            return language
    return None


def should_skip_path(path_parts: list[str]) -> bool:
    """Check if any part of the path is in the ignore list."""
    return any(part in IGNORE_DIRS for part in path_parts)


def unpack_tarball(tarball_path: str, extract_dir: str) -> str:
    """
    Safely unpack a tarball and return the root directory.

    GitHub tarballs have a single root directory like 'user-repo-abc1234/'.
    """
    with tarfile.open(tarball_path, "r:gz") as tar:
        # Security: prevent path traversal attacks
        for member in tar.getmembers():
            if member.name.startswith("/") or ".." in member.name:
                raise ValueError(f"Unsafe path in tarball: {member.name}")

        tar.extractall(path=extract_dir)

    # Find the root directory (GitHub tarballs have exactly one)
    entries = os.listdir(extract_dir)
    if len(entries) == 1 and os.path.isdir(os.path.join(extract_dir, entries[0])):
        return os.path.join(extract_dir, entries[0])

    return extract_dir


def extract_code_files(
    repo_dir: str,
    max_file_count: int = 200,
    max_single_file_kb: int = 100,
) -> list[CodeFile]:
    """
    Walk the repo directory and extract supported code files.

    Args:
        repo_dir: Path to the extracted repository root.
        max_file_count: Maximum number of code files to process.
        max_single_file_kb: Maximum size of a single file in KB before truncation.

    Returns:
        List of CodeFile objects.

    Raises:
        RepoTooLargeError: If file count exceeds the limit.
        EmptyRepoError: If no files are found at all.
        UnsupportedLanguageError: If no supported code files are found.
    """
    code_files: list[CodeFile] = []
    total_files_scanned = 0
    max_single_file_bytes = max_single_file_kb * 1024

    for root, dirs, files in os.walk(repo_dir):
        # Skip ignored directories (modifying dirs in-place prunes the walk)
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for filename in files:
            if filename in IGNORE_FILES:
                continue

            total_files_scanned += 1
            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, repo_dir)

            # Check if path has any ignored directory components
            if should_skip_path(Path(rel_path).parts):
                continue

            # Detect language
            language = detect_language(filename)
            if language is None:
                continue

            # Read file content
            try:
                file_size = os.path.getsize(filepath)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                # Truncate large files
                if file_size > max_single_file_bytes:
                    content = content[: max_single_file_bytes] + "\n\n[TRUNCATED — file exceeds 100KB limit]"

                code_files.append(
                    CodeFile(
                        path=rel_path,
                        content=content,
                        language=language,
                        size_bytes=file_size,
                    )
                )

            except (IOError, OSError):
                # Skip files we can't read (binary, permission issues, etc.)
                continue

    # Validation checks
    if total_files_scanned == 0:
        raise EmptyRepoError("This repository appears to be empty")

    if len(code_files) == 0:
        raise UnsupportedLanguageError(
            "No supported code files found (.py, .java, .c, .cpp, .js, .ts)"
        )

    if len(code_files) > max_file_count:
        raise RepoTooLargeError(
            f"Repository contains {len(code_files)} code files, "
            f"exceeding the {max_file_count} file limit"
        )

    return code_files


def build_context_prompt(code_files: list[CodeFile], repo_url: str) -> str:
    """
    Build the code context block for the AI prompt.

    Formats all code files into labeled Markdown blocks that preserve
    file hierarchy context for the LLM.
    """
    blocks: list[str] = []

    for cf in sorted(code_files, key=lambda f: f.path):
        blocks.append(f"--- FILE: {cf.path} ({cf.language}) ---")
        blocks.append(cf.content)
        blocks.append("")

    header = f"REPOSITORY: {repo_url}\n"
    header += f"TOTAL FILES: {len(code_files)}\n"
    header += f"TOTAL SIZE: {sum(f.size_bytes for f in code_files):,} bytes\n\n"
    header += "=== CODEBASE START ===\n\n"

    footer = "\n=== CODEBASE END ==="

    return header + "\n".join(blocks) + footer
