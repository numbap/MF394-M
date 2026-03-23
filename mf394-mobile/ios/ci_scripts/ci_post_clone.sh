#!/bin/bash
set -e

echo "=== ci_post_clone: Installing dependencies ==="

# ── Node ──────────────────────────────────────────────────────────────────────
# Xcode Cloud has Homebrew pre-installed; use it for a reliable Node install.
if ! command -v node &>/dev/null; then
  echo "Installing Node 20 via Homebrew..."
  brew install node@20
fi

# Ensure node@20 is on PATH (Homebrew keg-only on Apple Silicon)
export PATH="/opt/homebrew/opt/node@20/bin:/usr/local/opt/node@20/bin:$PATH"

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# ── npm install ───────────────────────────────────────────────────────────────
REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH/mf394-mobile"
echo "Running npm install in $REPO_ROOT..."
cd "$REPO_ROOT"
npm install --legacy-peer-deps

# ── CocoaPods ─────────────────────────────────────────────────────────────────
echo "Running pod install..."
cd ios
pod install

echo "=== ci_post_clone: Done ==="
