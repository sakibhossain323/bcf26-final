#!/bin/bash

# Base URL for Kong Admin API
KONG_ADMIN_URL="http://localhost:8001"

echo "🔌 Configuring Kong Gateway..."

# 1. Add Order Service
echo "   > Adding Order Service (http://order-service:3005)..."
curl -s -X PUT $KONG_ADMIN_URL/services/order-service \
  -d url=http://order-service:3005

# 2. Add Route for Order Service
echo "   > Adding Route for Order Service (/api/orders)..."
curl -s -X PUT $KONG_ADMIN_URL/services/order-service/routes/order-route \
  -d paths[]=/api/orders \
  -d strip_path=false

# 3. Add Inventory Service
echo "   > Adding Inventory Service (http://inventory-service:3002)..."
curl -s -X PUT $KONG_ADMIN_URL/services/inventory-service \
  -d url=http://inventory-service:3002

# 4. Add Route for Inventory Service
echo "   > Adding Route for Inventory Service (/api/inventory)..."
curl -s -X PUT $KONG_ADMIN_URL/services/inventory-service/routes/inventory-route \
  -d paths[]=/api/inventory \
  -d strip_path=false

echo -e "\n✅ Kong Configuration Complete!"
echo "   - Order Service: http://localhost:8000/api/orders"
echo "   - Inventory Service: http://localhost:8000/api/inventory"
