# Valerix Platform API Commands

 This document contains `curl` commands to interact with the Valerix Platform services. Use these to test the endpoints directly or via the Kong Gateway.

 ## 📦 Order Service
 **Base URL**: `http://localhost:3001`
 **Kong URL**: `http://localhost:8000`

 ### 1. Create Order
 Creates a new order with a list of items.

 **Direct Service**:
 ```bash
 curl -X POST http://localhost:3001/api/orders \
   -H "Content-Type: application/json" \
   -d '{
     "userId": "testuser",
     "items": [
       { "productId": "p1", "quantity": 2, "price": 50 },
       { "productId": "p2", "quantity": 1, "price": 100 }
     ]
   }'
 ```

 **Via Kong**:
 ```bash
 curl -X POST http://localhost:8000/api/orders \
   -H "Content-Type: application/json" \
   -d '{
     "userId": "testuser",
     "items": [
       { "productId": "p1", "quantity": 2, "price": 50 }
     ]
   }'
 ```

 ### 2. Ship Order
 Triggers the shipping process for an order.
 *Replace `:orderId` with a real ID from the "Create Order" response (e.g., `ORD-17696...`).*

 **Direct Service**:
 ```bash
 curl -X POST http://localhost:3001/api/orders/:orderId/ship \
   -H "Content-Type: application/json"
 ```

 **Via Kong**:
 ```bash
 curl -X POST http://localhost:8000/api/orders/:orderId/ship \
   -H "Content-Type: application/json"
 ```

 ### 3. Get Order Details
 Fetches details of a specific order.

 **Direct Service**:
 ```bash
 curl -X GET http://localhost:3001/api/orders/:orderId
 ```

 **Via Kong**:
 ```bash
 curl -X GET http://localhost:8000/api/orders/:orderId
 ```

 ### 4. Health Checks
 **Service Health**:
 ```bash
 curl http://localhost:3001/health
 ```
 **Controller Health (DB Check)**:
 ```bash
 curl http://localhost:3001/api/orders/health
 ```

 ### 5. Metrics
 ```bash
 curl http://localhost:3001/metrics
 ```

 ---

 ## 🏭 Inventory Service
 **Base URL**: `http://localhost:3002`
 **Kong URL**: `http://localhost:8000`

 ### 1. Update Inventory
 Updates inventory count (usually called internally by Order Service, but can be tested manually).
 *Replace `:productId` with a real ID.*

 **Direct Service**:
 ```bash
 curl -X POST http://localhost:3002/api/inventory/update \
   -H "Content-Type: application/json" \
   -d '{
     "orderId": "TEST-ORDER-1",
     "items": [
       { "productId": "p1", "quantity": 2 }
     ],
     "idempotencyKey": "unique-key-123"
   }'
 ```

 **Via Kong**:
 ```bash
 curl -X POST http://localhost:8000/api/inventory/update \
   -H "Content-Type: application/json" \
   -d '{
     "orderId": "TEST-ORDER-1",
     "items": [
       { "productId": "p1", "quantity": 2 }
     ],
     "idempotencyKey": "unique-key-123"
   }'
 ```

 ### 2. Get Inventory
 Get stock level for a product.

 **Direct Service**:
 ```bash
 curl -X GET http://localhost:3002/api/inventory/:productId
 ```

 **Via Kong**:
 ```bash
 curl -X GET http://localhost:8000/api/inventory/:productId
 ```

 ### 3. Health Checks
 **Service Health**:
 ```bash
 curl http://localhost:3002/health
 ```
 **Controller Health**:
 ```bash
 curl http://localhost:3002/api/inventory/health
 ```

 ### 4. Metrics
 ```bash
 curl http://localhost:3002/metrics
 ```
