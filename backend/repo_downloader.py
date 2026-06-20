"""
Viva Prep Engine — GitHub Repository Downloader
Downloads repository tarballs from GitHub's public API.
"""

import os
import re
import urllib.request
import urllib.error
from typing import NamedTuple

from errors import InvalidRepoError, GitHubRateLimitError, RepoTooLargeError


class RepoInfo(NamedTuple):
    """Parsed GitHub repository information."""

    owner: str
    name: str
    url: str


# Matches: https://github.com/owner/repo or https://github.com/owner/repo.git
GITHUB_URL_PATTERN = re.compile(
    r"^https?://github\.com/(?P<owner>[a-zA-Z0-9\-_.]+)/(?P<name>[a-zA-Z0-9\-_.]+?)(?:\.git)?/?$"
)


def parse_github_url(url: str) -> RepoInfo:
    """
    Parse and validate a GitHub repository URL.

    Args:
        url: The GitHub URL to parse.

    Returns:
        RepoInfo with owner, name, and cleaned URL.

    Raises:
        InvalidRepoError: If the URL doesn't match GitHub repo format.
    """
    match = GITHUB_URL_PATTERN.match(url.strip())
    if not match:
        raise InvalidRepoError(
            f"Invalid GitHub URL: '{url}'. Expected format: https://github.com/owner/repo"
        )

    owner = match.group("owner")
    name = match.group("name")
    clean_url = f"https://github.com/{owner}/{name}"

    return RepoInfo(owner=owner, name=name, url=clean_url)


def download_tarball(
    repo_info: RepoInfo,
    github_pat: str,
    output_dir: str,
    max_size_mb: int = 50,
    branch: str = "HEAD",
) -> str:
    """
    Download a repository as a gzipped tarball from GitHub's archive API.

    Args:
        repo_info: Parsed repository information.
        github_pat: GitHub Personal Access Token for authentication.
        output_dir: Directory to save the downloaded tarball.
        max_size_mb: Maximum allowed tarball size in MB.
        branch: Git ref to download (default: HEAD / default branch).

    Returns:
        Path to the downloaded tarball file.

    Raises:
        InvalidRepoError: If the repo doesn't exist or is private.
        GitHubRateLimitError: If GitHub rate limits the request.
        RepoTooLargeError: If the tarball exceeds the size limit.
    """
    tarball_url = f"https://api.github.com/repos/{repo_info.owner}/{repo_info.name}/tarball/{branch}"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_pat}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "VivaPrepEngine/1.0",
    }

    request = urllib.request.Request(tarball_url, headers=headers)
    max_size_bytes = max_size_mb * 1024 * 1024
    output_path = os.path.join(output_dir, f"{repo_info.owner}-{repo_info.name}.tar.gz")

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            # Check content length if available
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > max_size_bytes:
                raise RepoTooLargeError(
                    f"Repository tarball is {int(content_length) // (1024 * 1024)}MB, "
                    f"exceeding the {max_size_mb}MB limit"
                )

            # Stream download with size checking
            downloaded = 0
            with open(output_path, "wb") as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    downloaded += len(chunk)
                    if downloaded > max_size_bytes:
                        # Clean up partial download
                        f.close()
                        os.remove(output_path)
                        raise RepoTooLargeError(
                            f"Repository tarball exceeds the {max_size_mb}MB limit"
                        )
                    f.write(chunk)

    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise InvalidRepoError(
                f"Repository '{repo_info.owner}/{repo_info.name}' not found. "
                "Make sure it exists and is public."
            )
        elif e.code == 403:
            raise GitHubRateLimitError(
                "GitHub API rate limit exceeded. Please try again later."
            )
        elif e.code == 401:
            raise InvalidRepoError("GitHub authentication failed. Check the bot PAT.")
        else:
            raise InvalidRepoError(f"GitHub API error (HTTP {e.code}): {e.reason}")

    except urllib.error.URLError as e:
        raise InvalidRepoError(f"Failed to connect to GitHub: {e.reason}")

    return output_path
