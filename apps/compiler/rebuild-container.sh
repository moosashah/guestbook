#!/bin/bash

echo "🔄 Rebuilding compiler container with font support..."
echo ""

# Stop the current container
echo "Stopping current container..."
docker-compose -f docker-compose.dev.yml down

# Rebuild the container (no cache to ensure fresh build)
echo "Rebuilding container..."
docker-compose -f docker-compose.dev.yml build --no-cache compiler

# Start the container
echo "Starting container..."
docker-compose -f docker-compose.dev.yml up -d compiler

echo ""
echo "✅ Container rebuilt and started!"
echo ""

# Test fonts
echo "Testing fonts in container..."
docker-compose -f docker-compose.dev.yml exec compiler /bin/sh -c "fc-list | head -5"

echo ""
echo "Testing custom fonts..."
docker-compose -f docker-compose.dev.yml exec compiler /bin/sh -c "ls -la /usr/share/fonts/custom/ || echo 'Custom fonts not found'"
