#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Log the start of the script
echo "Entrypoint script started..."

# Run database migrations
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Database migrations finished."

# Run database seeding if the seed file exists
if [ -f "prisma/seed.js" ]; then
  echo "Running database seeding..."
  node prisma/seed.js
  echo "Database seeding finished."
else
  echo "Seed script not found, skipping seeding."
fi

# Execute the main command (CMD) passed to the container
echo "Starting the main application..."
exec "$@"
