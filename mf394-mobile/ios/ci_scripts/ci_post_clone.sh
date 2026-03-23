#!/bin/sh
set -e

echo "=== ci_post_clone: Installing dependencies ==="

# ── Node via nvm ──────────────────────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Installing Node 20.20.0..."
nvm install 20.20.0
nvm use 20.20.0
node --version
npm --version

# ── npm install ───────────────────────────────────────────────────────────────
REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH/mf394-mobile"
echo "Running npm install in $REPO_ROOT..."
cd "$REPO_ROOT"
npm install --legacy-peer-deps

# ── CocoaPods ─────────────────────────────────────────────────────────────────
echo "Running pod install..."
cd ios
pod install --repo-update

echo "=== ci_post_clone: Done ==="
