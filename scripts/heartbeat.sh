#!/bin/bash
# ==============================================================================
# VERA Daily Heartbeat Logger
# Logs a daily timestamp to docs/HEARTBEAT.md and commits/pushes it.
# Under GitHub Actions or manual run, it commits with Shardul Chogale's email
# to reflect on the GitHub contribution graph.
# ==============================================================================

set -e

# File path
HEARTBEAT_FILE="docs/HEARTBEAT.md"

# Git user details for contribution graph mapping
COMMIT_AUTHOR_NAME="Shardul Chogale"
COMMIT_AUTHOR_EMAIL="144150911+shard-c6@users.noreply.github.com"

# Ensure docs directory exists
mkdir -p docs

# Create file with headers if it doesn't exist
if [ ! -f "$HEARTBEAT_FILE" ]; then
  echo "# ❤️ VERA Daily Heartbeat Log" > "$HEARTBEAT_FILE"
  echo "Track daily activity and status of the VERA project." >> "$HEARTBEAT_FILE"
  echo "" >> "$HEARTBEAT_FILE"
  echo "| Date | Time (UTC) | Status |" >> "$HEARTBEAT_FILE"
  echo "|------|------------|--------|" >> "$HEARTBEAT_FILE"
fi

# Append current date/time
CURRENT_DATE=$(date -u +"%Y-%m-%d")
CURRENT_TIME=$(date -u +"%H:%M:%S")

# Check if we already logged a heartbeat today to avoid double-logging
if grep -q "| $CURRENT_DATE |" "$HEARTBEAT_FILE"; then
  echo "Heartbeat already logged for today ($CURRENT_DATE). Skipping append."
else
  echo "| $CURRENT_DATE | $CURRENT_TIME | Healthy ❤️ |" >> "$HEARTBEAT_FILE"
  echo "Heartbeat logged successfully at $CURRENT_DATE $CURRENT_TIME UTC."
fi

# Git stage, commit, and push if requested or running in CI
if [ "$1" == "--commit" ] || [ "$GITHUB_ACTIONS" == "true" ]; then
  echo "Staging, committing and pushing heartbeat..."
  
  # Configure local git author details
  git config user.name "$COMMIT_AUTHOR_NAME"
  git config user.email "$COMMIT_AUTHOR_EMAIL"
  
  git add "$HEARTBEAT_FILE"
  
  # Check if there are changes staged
  if git diff --cached --quiet; then
    echo "No new heartbeat changes to commit."
  else
    git commit -m "chore(heartbeat): daily project heartbeat for $CURRENT_DATE [skip ci]"
    git push
    echo "Heartbeat pushed to remote branch successfully!"
  fi
fi
