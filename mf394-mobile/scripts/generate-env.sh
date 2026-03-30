#!/bin/bash
# Generates .env file from environment variables during EAS Build.
# EAS Build sets env vars from eas.json "env" block, but react-native-dotenv
# reads from a .env file. This script bridges the gap.

ENV_FILE=".env"

# Only generate if .env doesn't already exist (i.e., we're in EAS Build)
if [ -f "$ENV_FILE" ]; then
  echo ".env file already exists, skipping generation"
  exit 0
fi

echo "Generating .env from environment variables..."

cat > "$ENV_FILE" <<EOF
GOOGLE_OAUTH_CLIENT_ID_iOS=${GOOGLE_OAUTH_CLIENT_ID_iOS:-}
GOOGLE_OAUTH_CLIENT_ID_Android=${GOOGLE_OAUTH_CLIENT_ID_Android:-}
GOOGLE_OAUTH_WEB_CLIENT_ID=${GOOGLE_OAUTH_WEB_CLIENT_ID:-}
API_DOMAIN=${API_DOMAIN:-https://ummyou.com}
API_TIMEOUT=${API_TIMEOUT:-30000}
EOF

echo "Generated .env:"
cat "$ENV_FILE"
