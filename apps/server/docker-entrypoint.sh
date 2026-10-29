#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready and syncing database schema..."
MAX_RETRIES=30
RETRY_COUNT=0

until node ./node_modules/prisma/build/index.js db push || pnpm prisma db push; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ Failed to connect to database after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying in 2 seconds..."
  sleep 2
done

echo "✅ Database schema synchronized successfully."
echo "🚀 Starting Vizi Real-Time Server..."
exec "$@"
