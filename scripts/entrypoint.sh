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

# Create database if it doesn't exist (for development)
if [ "$ENV" = "development" ]; then
  echo "🔧 Creating database if it doesn't exist..."
  node ./scripts/create-db.js
  echo "✅ Database check completed"
fi

echo "Running migrations in $ENV environment..."
if npx sequelize-cli db:migrate --env $ENV; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migrations failed or already applied (continuing anyway)"
fi

# Run seeders only in development
if [ "$ENV" = "development" ]; then
  echo "🌱 Running seeders in development environment..."
  if npx sequelize-cli db:seed:all --env $ENV; then
    echo "✅ Seeders completed successfully"
  else
    echo "⚠️  Seeders failed or already applied (continuing anyway)"
  fi
else
  echo "⏭️  Skipping seeders - not in development environment"
fi

echo "Starting app..."
exec "$@"
