#!/bin/bash

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
KONG_ADMIN_URL=${KONG_ADMIN_URL:-http://localhost:8001}
until curl -s $KONG_ADMIN_URL/ > /dev/null; do
  sleep 2
done

echo "Kong is ready. Configuring services and routes..."

# Create Order Service
curl -i -X POST $KONG_ADMIN_URL/services/ \
  --data name=order-service \
  --data url=http://order-service:3005/api/orders

# Create Order Service Route - Route to /api/orders
curl -i -X POST $KONG_ADMIN_URL/services/order-service/routes \
  --data 'paths[]=/api/orders' \
  --data name=order-route

# Create Inventory Service
curl -i -X POST $KONG_ADMIN_URL/services/ \
  --data name=inventory-service \
  --data url=http://inventory-service:3002/api/inventory

# Create Inventory Service Route - Route to /api/inventory
curl -i -X POST $KONG_ADMIN_URL/services/inventory-service/routes \
  --data 'paths[]=/api/inventory' \
  --data name=inventory-route

# Enable Rate Limiting on Order Service (100 requests per minute)
curl -i -X POST $KONG_ADMIN_URL/services/order-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.policy=local

# Enable Rate Limiting on Inventory Service (200 requests per minute)
curl -i -X POST $KONG_ADMIN_URL/services/inventory-service/plugins \
  --data name=rate-limiting \
  --data config.minute=200 \
  --data config.policy=local

# Enable CORS plugin globally
curl -i -X POST $KONG_ADMIN_URL/plugins \
  --data name=cors \
  --data config.origins=* \
  --data config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS \
  --data config.headers=Accept,Authorization,Content-Type

# Enable Request/Response Logging
curl -i -X POST $KONG_ADMIN_URL/plugins \
  --data name=file-log \
  --data config.path=/tmp/kong.log

# Enable Prometheus plugin for metrics
curl -i -X POST $KONG_ADMIN_URL/plugins \
  --data name=prometheus

echo "Kong configuration completed!"