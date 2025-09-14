#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Log the start of the script
echo "Entrypoint script started..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy
echo "Database migrations finished."

# Run database seeding
echo "Running database seeding..."
node prisma/seed.js
echo "Database seeding finished."

# Execute the main command (CMD) passed to the container
echo "Starting the main application..."
exec "$@"
