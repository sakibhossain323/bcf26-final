#!/bin/bash

# Base URL (Change to 3001 if not using Kong, or 8000 if using Kong)
BASE_URL="http://localhost:8000/api"

echo "🚀 Starting Latency & RabbitMQ Resilience Test..."
echo "------------------------------------------------"

# Optional: Restart inventory to reset Gremlin counter to 0 (Uncomment if needed)
# docker restart inventory-service && sleep 5

# --- HELPER FUNCTIONS ---
create_order() {
  curl -s -X POST $BASE_URL/orders \
    -H "Content-Type: application/json" \
    -d '{"userId": "tester", "items": [{"productId": "p1", "quantity": 1, "price": 10}]}' | jq -r '.data.order.orderId // .orderId'
}

ship_order() {
  local id=$1
  curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/orders/$id/ship
}

# 1. PRIME THE GREMLIN
# We need to hit the Inventory POST /update endpoint 4 times to increment the counter.
# Since that endpoint is internal, we trigger it by shipping 4 dummy orders.
echo "🔄 Priming the Gremlin (Running 4 dummy orders)..."

for i in {1..4}; do
  DUMMY_ID=$(create_order)
  # We expect these to succeed (200 OK)
  STATUS=$(ship_order $DUMMY_ID)
  echo -n "."
done
echo " Done!"

# 2. THE MAIN TEST
echo "🧪 Creating the Target Order (Request #5)..."
TARGET_ORDER_ID=$(create_order)
echo "   ID: $TARGET_ORDER_ID"

echo "🔥 Shipping Order (This should TIMEOUT and trigger RabbitMQ)..."
# We capture the HTTP Code. We expect 202 (Accepted), not 200 (OK).
HTTP_CODE=$(ship_order $TARGET_ORDER_ID)

if [ "$HTTP_CODE" == "202" ]; then
  echo "✅ Success! Received HTTP 202 Accepted."
  echo "   (This means the API timed out as expected and queued the request)"
else
  echo "⚠️  Unexpected Status: $HTTP_CODE (Expected 202)"
  echo "   (Did the Gremlin trigger? Ensure the counter aligned)"
fi

# 3. VERIFY RABBITMQ PROCESSING
echo "🧐 Watching for RabbitMQ Consumer to pick up the order..."
echo "   (Status should flip from 'pending' -> 'shipped')"

for i in {1..10}; do
  CURRENT_STATUS=$(curl -s $BASE_URL/orders/$TARGET_ORDER_ID | jq -r '.data.status')
  
  if [ "$CURRENT_STATUS" == "shipped" ]; then
    echo ""
    echo "🎉 TEST PASSED: Order status is '$CURRENT_STATUS'!"
    echo "   The background worker successfully processed the queued order."
    exit 0
  fi
  
  echo -n "   Current Status: $CURRENT_STATUS (Waiting...)"
  echo ""
  sleep 2
done

echo ""
echo "❌ TEST FAILED: Status never changed to 'shipped'. Check your Worker logs."