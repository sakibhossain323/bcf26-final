#!/bin/bash

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -s http://localhost:8001/ > /dev/null; do
  sleep 2
done

echo "Kong is ready. Configuring services and routes..."

# ============================================================================
# SECTION 1: CREATE UPSTREAMS WITH HEALTH CHECKS
# ============================================================================

echo "Creating Order Service Upstream with Health Checks..."
curl -i -X POST http://localhost:8001/upstreams \
  --data "name=order-service-upstream" \
  --data "algorithm=round-robin" \
  --data "healthchecks.active.healthy.interval=5" \
  --data "healthchecks.active.unhealthy.interval=5" \
  --data "healthchecks.active.healthy.http_statuses=200" \
  --data "healthchecks.active.healthy.http_statuses=201" \
  --data "healthchecks.active.healthy.http_statuses=204" \
  --data "healthchecks.active.unhealthy.http_statuses=429" \
  --data "healthchecks.active.unhealthy.http_statuses=500" \
  --data "healthchecks.active.unhealthy.http_statuses=502" \
  --data "healthchecks.active.unhealthy.http_statuses=503" \
  --data "healthchecks.active.unhealthy.http_statuses=504"

echo "Creating Inventory Service Upstream with Health Checks..."
curl -i -X POST http://localhost:8001/upstreams \
  --data "name=inventory-service-upstream" \
  --data "algorithm=round-robin" \
  --data "healthchecks.active.healthy.interval=5" \
  --data "healthchecks.active.unhealthy.interval=5" \
  --data "healthchecks.active.healthy.http_statuses=200" \
  --data "healthchecks.active.healthy.http_statuses=201" \
  --data "healthchecks.active.healthy.http_statuses=204" \
  --data "healthchecks.active.unhealthy.http_statuses=429" \
  --data "healthchecks.active.unhealthy.http_statuses=500" \
  --data "healthchecks.active.unhealthy.http_statuses=502" \
  --data "healthchecks.active.unhealthy.http_statuses=503" \
  --data "healthchecks.active.unhealthy.http_statuses=504"

# ============================================================================
# SECTION 2: ADD TARGETS TO UPSTREAMS
# ============================================================================

echo "Adding Order Service targets to upstream..."
curl -i -X POST http://localhost:8001/upstreams/order-service-upstream/targets \
  --data "target=order-service:3001" \
  --data "weight=100"

echo "Adding Inventory Service targets to upstream..."
curl -i -X POST http://localhost:8001/upstreams/inventory-service-upstream/targets \
  --data "target=inventory-service:3002" \
  --data "weight=100"

# ============================================================================
# SECTION 3: CREATE SERVICES USING UPSTREAMS
# ============================================================================

# Delete existing services if they exist (to avoid conflicts)
curl -s -X DELETE http://localhost:8001/services/order-service
curl -s -X DELETE http://localhost:8001/services/inventory-service

echo "Creating Order Service with upstream..."
curl -i -X POST http://localhost:8001/services/ \
  --data "name=order-service" \
  --data "host=order-service-upstream" \
  --data "port=3001" \
  --data "path=/api/orders"

echo "Creating Inventory Service with upstream..."
curl -i -X POST http://localhost:8001/services/ \
  --data "name=inventory-service" \
  --data "host=inventory-service-upstream" \
  --data "port=3002" \
  --data "path=/api/inventory"

# ============================================================================
# SECTION 4: CREATE ROUTES
# ============================================================================

echo "Creating Order Service Route..."
curl -i -X POST http://localhost:8001/services/order-service/routes \
  --data 'paths[]=/api/orders' \
  --data name=order-route

echo "Creating Inventory Service Route..."
curl -i -X POST http://localhost:8001/services/inventory-service/routes \
  --data 'paths[]=/api/inventory' \
  --data name=inventory-route

# ============================================================================
# SECTION 5: ENABLE RATE LIMITING PLUGINS
# ============================================================================

echo "Enabling Rate Limiting on Order Service (100 requests per minute)..."
curl -i -X POST http://localhost:8001/services/order-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.policy=local

echo "Enabling Rate Limiting on Inventory Service (200 requests per minute)..."
curl -i -X POST http://localhost:8001/services/inventory-service/plugins \
  --data name=rate-limiting \
  --data config.minute=200 \
  --data config.policy=local

# ============================================================================
# SECTION 6: ENABLE GLOBAL PLUGINS (CORS, LOGGING, METRICS)
# ============================================================================

echo "Enabling CORS plugin globally..."
curl -i -X POST http://localhost:8001/plugins \
  --data name=cors \
  --data config.origins=* \
  --data config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS \
  --data config.headers=Accept,Authorization,Content-Type

echo "Enabling Request/Response File Logging..."
curl -i -X POST http://localhost:8001/plugins \
  --data name=file-log \
  --data config.path=/tmp/kong.log

echo "Enabling Prometheus plugin for metrics..."
curl -i -X POST http://localhost:8001/plugins \
  --data name=prometheus

# ============================================================================
# SECTION 7: ENABLE HEALTH CHECK MONITORING PLUGINS
# ============================================================================

echo "Enabling HTTP Log plugin for Order Service (health check monitoring)..."
curl -i -X POST http://localhost:8001/services/order-service/plugins \
  --data name=http-log \
  --data config.http_endpoint=http://monitoring-service:9000/logs \
  --data config.method=POST

echo "Enabling HTTP Log plugin for Inventory Service (health check monitoring)..."
curl -i -X POST http://localhost:8001/services/inventory-service/plugins \
  --data name=http-log \
  --data config.http_endpoint=http://monitoring-service:9000/logs \
  --data config.method=POST

# ============================================================================
# SECTION 8: DISPLAY HEALTH CHECK VERIFICATION COMMANDS
# ============================================================================

echo ""
echo "============================================================================"
echo "Kong configuration completed!"
echo "============================================================================"
echo ""
echo "To verify your setup, run these commands:"
echo ""
echo "1. Check Order Service upstream health status:"
echo "   curl http://localhost:8001/upstreams/order-service-upstream/health"
echo ""
echo "2. Check Inventory Service upstream health status:"
echo "   curl http://localhost:8001/upstreams/inventory-service-upstream/health"
echo ""
echo "3. List all Order Service targets:"
echo "   curl http://localhost:8001/upstreams/order-service-upstream/targets/all"
echo ""
echo "4. List all Inventory Service targets:"
echo "   curl http://localhost:8001/upstreams/inventory-service-upstream/targets/all"
echo ""
echo "5. Get Order Service details:"
echo "   curl http://localhost:8001/services/order-service"
echo ""
echo "6. Get Inventory Service details:"
echo "   curl http://localhost:8001/services/inventory-service"
echo ""
echo "7. View Prometheus metrics:"
echo "   curl http://localhost:8001/metrics"
echo ""
echo "============================================================================"