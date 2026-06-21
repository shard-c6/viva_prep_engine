"""
VERA — Unit Tests for repo_downloader.py
Tests GitHub URL parsing, validation, and error handling.
"""

import sys
import os
import unittest

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from repo_downloader import parse_github_url, RepoInfo, GITHUB_URL_PATTERN
from errors import InvalidRepoError


class TestParseGithubUrl(unittest.TestCase):
    """Tests for parse_github_url()."""

    def test_valid_https_url(self):
        result = parse_github_url("https://github.com/shard-c6/VERA")
        self.assertEqual(result.owner, "shard-c6")
        self.assertEqual(result.name, "VERA")
        self.assertEqual(result.url, "https://github.com/shard-c6/VERA")

    def test_valid_url_with_trailing_slash(self):
        result = parse_github_url("https://github.com/user/repo/")
        self.assertEqual(result.owner, "user")
        self.assertEqual(result.name, "repo")

    def test_valid_url_with_git_suffix(self):
        result = parse_github_url("https://github.com/user/repo.git")
        self.assertEqual(result.owner, "user")
        self.assertEqual(result.name, "repo")

    def test_valid_url_http(self):
        result = parse_github_url("http://github.com/user/repo")
        self.assertEqual(result.owner, "user")
        self.assertEqual(result.name, "repo")

    def test_valid_url_with_dots_and_hyphens(self):
        result = parse_github_url("https://github.com/my-org/my.project-v2")
        self.assertEqual(result.owner, "my-org")
        self.assertEqual(result.name, "my.project-v2")

    def test_valid_url_with_underscores(self):
        result = parse_github_url("https://github.com/owner_1/repo_name")
        self.assertEqual(result.owner, "owner_1")
        self.assertEqual(result.name, "repo_name")

    def test_strips_whitespace(self):
        result = parse_github_url("  https://github.com/user/repo  ")
        self.assertEqual(result.owner, "user")
        self.assertEqual(result.name, "repo")

    def test_returns_named_tuple(self):
        result = parse_github_url("https://github.com/user/repo")
        self.assertIsInstance(result, RepoInfo)
        self.assertEqual(result.owner, "user")
        self.assertEqual(result.name, "repo")
        self.assertEqual(result.url, "https://github.com/user/repo")


class TestParseGithubUrlInvalid(unittest.TestCase):
    """Tests for invalid URLs that should raise InvalidRepoError."""

    def test_empty_string(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("")

    def test_random_text(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("not a url")

    def test_gitlab_url(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("https://gitlab.com/user/repo")

    def test_github_without_repo(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("https://github.com/user")

    def test_github_with_subpath(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("https://github.com/user/repo/tree/main")

    def test_github_api_url(self):
        with self.assertRaises(InvalidRepoError):
            parse_github_url("https://api.github.com/repos/user/repo")

    def test_none_like(self):
        with self.assertRaises((InvalidRepoError, TypeError, AttributeError)):
            parse_github_url(None)  # type: ignore

    def test_error_code_is_correct(self):
        try:
            parse_github_url("bad_url")
        except InvalidRepoError as e:
            self.assertEqual(e.error_code, "REPO_NOT_FOUND")


class TestGithubUrlPattern(unittest.TestCase):
    """Direct tests on the GITHUB_URL_PATTERN regex."""

    def test_matches_standard_url(self):
        self.assertIsNotNone(GITHUB_URL_PATTERN.match("https://github.com/user/repo"))

    def test_does_not_match_extra_segments(self):
        self.assertIsNone(GITHUB_URL_PATTERN.match("https://github.com/user/repo/tree/main"))

    def test_does_not_match_missing_repo(self):
        self.assertIsNone(GITHUB_URL_PATTERN.match("https://github.com/user"))


if __name__ == "__main__":
    unittest.main()
