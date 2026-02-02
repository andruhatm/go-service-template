#!/bin/bash

echo "================================"
echo "Fixing Migration State"
echo "================================"
echo ""

# Find the database container
DB_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Database container not found!"
    echo "Please make sure your database container is running."
    echo "Try: docker-compose up -d db"
    exit 1
fi

echo "Found database container: $DB_CONTAINER"
echo ""

# Check current migration state
echo "Current migration state:"
docker exec $DB_CONTAINER psql -U user -d appdb -c "SELECT version, dirty FROM schema_migrations;"
echo ""

# Check if forecasts table exists
echo "Checking if forecasts table exists..."
TABLE_EXISTS=$(docker exec $DB_CONTAINER psql -U user -d appdb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'forecasts');" | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✓ Forecasts table EXISTS"
    echo ""
    echo "Marking migration 9 as clean..."
    docker exec $DB_CONTAINER psql -U user -d appdb -c "UPDATE schema_migrations SET version = 9, dirty = false;"
else
    echo "✗ Forecasts table does NOT exist"
    echo ""
    echo "Resetting to migration 8..."
    docker exec $DB_CONTAINER psql -U user -d appdb -c "UPDATE schema_migrations SET version = 8, dirty = false;"
fi

echo ""
echo "New migration state:"
docker exec $DB_CONTAINER psql -U user -d appdb -c "SELECT version, dirty FROM schema_migrations;"

echo ""
echo "================================"
echo "✅ Migration fixed!"
echo "================================"
echo ""
echo "Now you can run your Go app:"
echo "  cd go-api"
echo "  go run main.go"
echo ""


