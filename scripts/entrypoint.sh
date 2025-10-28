#!/usr/bin/env sh

# Wait for DB (simple; replace with a proper check if needed)
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL set; continuing"
else
  echo "DATABASE_URL is not set. Exiting."
  exit 1
fi

# Use NODE_ENV if set, otherwise default to development
ENV=${NODE_ENV:-development}

echo "Running migrations in $ENV environment..."
if npx sequelize-cli db:migrate --env $ENV; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migrations failed or already applied (continuing anyway)"
fi

echo "Starting app..."
exec "$@"
