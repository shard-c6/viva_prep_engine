"""
VERA — Unit Tests for code_chunker.py
Tests file extraction, language detection, filtering, truncation, and prompt building.
"""

import sys
import os
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from code_chunker import (
    detect_language,
    should_skip_path,
    extract_code_files,
    build_context_prompt,
    CodeFile,
    LANGUAGE_EXTENSIONS,
    ALL_SUPPORTED_EXTENSIONS,
    IGNORE_DIRS,
    IGNORE_FILES,
)
from errors import EmptyRepoError, UnsupportedLanguageError, RepoTooLargeError


class TestDetectLanguage(unittest.TestCase):
    """Tests for detect_language()."""

    def test_python(self):
        self.assertEqual(detect_language("main.py"), "Python")

    def test_javascript_variants(self):
        self.assertEqual(detect_language("app.js"), "JavaScript")
        self.assertEqual(detect_language("index.jsx"), "JavaScript")
        self.assertEqual(detect_language("server.ts"), "JavaScript")
        self.assertEqual(detect_language("Component.tsx"), "JavaScript")
        self.assertEqual(detect_language("utils.mjs"), "JavaScript")
        self.assertEqual(detect_language("config.cjs"), "JavaScript")

    def test_java(self):
        self.assertEqual(detect_language("Main.java"), "Java")

    def test_c(self):
        self.assertEqual(detect_language("main.c"), "C")

    def test_cpp(self):
        self.assertEqual(detect_language("main.cpp"), "C++")
        self.assertEqual(detect_language("util.hpp"), "C++")
        self.assertEqual(detect_language("lib.cc"), "C++")

    def test_header_file_detected(self):
        # .h is in both C and C++; detect_language returns whichever comes first
        result = detect_language("types.h")
        self.assertIn(result, ["C", "C++"])

    def test_unsupported_extension(self):
        self.assertIsNone(detect_language("README.md"))
        self.assertIsNone(detect_language("data.json"))
        self.assertIsNone(detect_language("image.png"))
        self.assertIsNone(detect_language("Makefile"))

    def test_case_insensitive(self):
        self.assertEqual(detect_language("Main.PY"), "Python")
        self.assertEqual(detect_language("App.JS"), "JavaScript")


class TestShouldSkipPath(unittest.TestCase):
    """Tests for should_skip_path()."""

    def test_skips_node_modules(self):
        self.assertTrue(should_skip_path(["src", "node_modules", "express", "index.js"]))

    def test_skips_git_directory(self):
        self.assertTrue(should_skip_path([".git", "config"]))

    def test_skips_pycache(self):
        self.assertTrue(should_skip_path(["src", "__pycache__", "module.cpython-312.pyc"]))

    def test_skips_venv(self):
        self.assertTrue(should_skip_path(["venv", "lib", "site-packages"]))

    def test_does_not_skip_src(self):
        self.assertFalse(should_skip_path(["src", "components", "App.tsx"]))

    def test_does_not_skip_normal_path(self):
        self.assertFalse(should_skip_path(["backend", "handler.py"]))


class TestExtractCodeFiles(unittest.TestCase):
    """Tests for extract_code_files() using temporary directories."""

    def _create_repo(self, files: dict[str, str]) -> str:
        """Helper: create a temp directory with files. Returns the directory path."""
        tmp = tempfile.mkdtemp()
        for path, content in files.items():
            full_path = os.path.join(tmp, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w") as f:
                f.write(content)
        return tmp

    def test_extracts_python_files(self):
        repo = self._create_repo({
            "main.py": "print('hello')",
            "utils.py": "def add(a, b): return a + b",
        })
        files = extract_code_files(repo)
        self.assertEqual(len(files), 2)
        self.assertTrue(all(f.language == "Python" for f in files))

    def test_ignores_non_code_files(self):
        repo = self._create_repo({
            "main.py": "print('hello')",
            "README.md": "# Project",
            "data.json": "{}",
        })
        files = extract_code_files(repo)
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].path, "main.py")

    def test_ignores_node_modules(self):
        repo = self._create_repo({
            "src/app.js": "console.log('hi')",
            "node_modules/express/index.js": "module.exports = {}",
        })
        files = extract_code_files(repo)
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].path, os.path.join("src", "app.js"))

    def test_ignores_lock_files(self):
        repo = self._create_repo({
            "index.js": "console.log('hi')",
            "package-lock.json": "{}",
            "yarn.lock": "",
        })
        files = extract_code_files(repo)
        self.assertEqual(len(files), 1)

    def test_truncates_large_files(self):
        large_content = "x" * (150 * 1024)  # 150KB
        repo = self._create_repo({"big.py": large_content})
        files = extract_code_files(repo, max_single_file_kb=100)
        self.assertEqual(len(files), 1)
        self.assertIn("[TRUNCATED", files[0].content)
        # Content should be ~100KB + truncation marker
        self.assertLess(len(files[0].content), 110 * 1024)

    def test_raises_empty_repo_error(self):
        repo = self._create_repo({})
        with self.assertRaises(EmptyRepoError) as ctx:
            extract_code_files(repo)
        self.assertEqual(ctx.exception.error_code, "EMPTY_REPO")

    def test_raises_unsupported_language_error(self):
        repo = self._create_repo({
            "README.md": "# Project",
            "config.yaml": "key: value",
        })
        with self.assertRaises(UnsupportedLanguageError) as ctx:
            extract_code_files(repo)
        self.assertEqual(ctx.exception.error_code, "UNSUPPORTED_LANGUAGE")

    def test_raises_repo_too_large_for_file_count(self):
        # Create 5 files but set max to 3
        files = {f"file_{i}.py": f"# file {i}" for i in range(5)}
        repo = self._create_repo(files)
        with self.assertRaises(RepoTooLargeError) as ctx:
            extract_code_files(repo, max_file_count=3)
        self.assertEqual(ctx.exception.error_code, "REPO_TOO_LARGE")

    def test_mixed_languages(self):
        repo = self._create_repo({
            "main.py": "print('hello')",
            "App.java": "public class App {}",
            "index.js": "console.log('hi')",
        })
        files = extract_code_files(repo)
        self.assertEqual(len(files), 3)
        languages = {f.language for f in files}
        self.assertEqual(languages, {"Python", "Java", "JavaScript"})


class TestBuildContextPrompt(unittest.TestCase):
    """Tests for build_context_prompt()."""

    def test_basic_prompt_structure(self):
        files = [
            CodeFile(path="main.py", content="print('hello')", language="Python", size_bytes=14),
        ]
        prompt = build_context_prompt(files, "https://github.com/user/repo")
        self.assertIn("REPOSITORY: https://github.com/user/repo", prompt)
        self.assertIn("TOTAL FILES: 1", prompt)
        self.assertIn("=== CODEBASE START ===", prompt)
        self.assertIn("=== CODEBASE END ===", prompt)
        self.assertIn("--- FILE: main.py (Python) ---", prompt)
        self.assertIn("print('hello')", prompt)

    def test_multiple_files_sorted(self):
        files = [
            CodeFile(path="z_last.py", content="", language="Python", size_bytes=0),
            CodeFile(path="a_first.py", content="", language="Python", size_bytes=0),
        ]
        prompt = build_context_prompt(files, "https://github.com/user/repo")
        a_pos = prompt.index("a_first.py")
        z_pos = prompt.index("z_last.py")
        self.assertLess(a_pos, z_pos, "Files should be sorted alphabetically")

    def test_size_calculation(self):
        files = [
            CodeFile(path="a.py", content="x", language="Python", size_bytes=100),
            CodeFile(path="b.py", content="y", language="Python", size_bytes=200),
        ]
        prompt = build_context_prompt(files, "https://github.com/user/repo")
        self.assertIn("TOTAL SIZE: 300 bytes", prompt)


class TestConstants(unittest.TestCase):
    """Tests for module-level constants."""

    def test_all_extensions_is_union(self):
        for lang, exts in LANGUAGE_EXTENSIONS.items():
            for ext in exts:
                self.assertIn(ext, ALL_SUPPORTED_EXTENSIONS,
                              f"Extension {ext} from {lang} not in ALL_SUPPORTED_EXTENSIONS")

    def test_ignore_dirs_are_strings(self):
        for d in IGNORE_DIRS:
            self.assertIsInstance(d, str)

    def test_ignore_files_are_strings(self):
        for f in IGNORE_FILES:
            self.assertIsInstance(f, str)


if __name__ == "__main__":
    unittest.main()
