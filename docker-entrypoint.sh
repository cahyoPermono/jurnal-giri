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

# Ensure uploads directory exists and has proper permissions
echo "Ensuring uploads directory exists..."
mkdir -p public/uploads
chmod 755 public/uploads
# Change ownership of the directory itself (not recursively to avoid permission issues with volume files)
chown nextjs:nodejs public/uploads
# Set proper permissions for existing files in the volume (if any)
find public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
echo "Uploads directory setup completed."

# Execute the main command (CMD) passed to the container
echo "Starting the main application..."
exec "$@"
