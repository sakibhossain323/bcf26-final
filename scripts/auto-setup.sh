#!/bin/bash
# auto-migrate.sh

echo "Starting automatic migration and configuration setup..."

# Wait for databases to be ready
echo "Waiting for order database to be ready..."
while ! pg_isready -h order-db -p 5432 -U orderuser -d orderdb; do
  sleep 2
done
echo "Order database is ready!"

echo "Waiting for inventory database to be ready..."
while ! pg_isready -h inventory-db -p 5432 -U inventoryuser -d inventorydb; do
  sleep 2
done
echo "Inventory database is ready!"

# Run migrations for order service
echo "Running migrations for order service..."
cd /app/order-service && npm run push

echo "Migrations for order service completed!"

# Run migrations for inventory service  
echo "Running migrations for inventory service..."
cd /app/inventory-service && npm run push

echo "Migrations for inventory service completed!"

# Wait for Kong to be available
echo "Waiting for Kong Admin API to be ready..."
until curl -s http://kong:8001/ > /dev/null; do
  sleep 2
done

echo "Kong is ready. Running Kong configuration..."
cd /app/scripts && bash configure-kong.sh

echo "Kong configuration completed!"

echo "All setup completed!"