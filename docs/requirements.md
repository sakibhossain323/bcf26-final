# Requirements Extraction: Microservice & DevOps System

## Core System Requirements

### 1. Microservice Architecture
- Break down the existing monolithic server into microservices
- Design appropriate database schema for the new architecture
- Must include these two separate services:
  - **Order Service**: Receives orders, validates them, coordinates downstream processes
  - **Inventory Service**: Manages stock levels, updates when orders are shipped
- Order Service calls Inventory Service to update inventory when order is ready to ship
- System must be modular to allow adding services (notifications, payments, analytics) without breaking core flow

### 2. Latency Handling ("The Vanishing Response")
- **Inventory Service**: Implement predictable, deterministic latency pattern in responses
- **Order Service**: 
  - Must not wait indefinitely for slow Inventory Service responses
  - Implement timeout mechanism
  - Return clear, appropriate timeout/error messages to users when Inventory Service is slow
  - Continue working smoothly despite Inventory Service delays

### 3. Automated Testing Pipeline ("It Runs On My Machine")
- Build automated verification pipeline
- Pipeline must:
  - Start the system automatically
  - Run series of requests against Order Service
  - Verify behavior under load
  - Record affected orders when slow responses occur from Inventory Service
  - Continue running remaining requests normally even when some are affected by delays

### 4. Health Monitoring ("Go Beyond Your Logs")
- **Health Endpoints**: Each service must have `/health` endpoint
  - Not just "200 OK"
  - Must verify downstream dependencies
  - Example: Inventory Service must ping its database/tables; return error if unavailable
- **Visual Dashboard**:
  - Monitor average response time of Order Service
  - Alert system: Component changes from green to red when average response time exceeds 1 second over rolling 30-second window

### 5. Idempotency & Partial Failure Handling ("Schrödinger's Warehouse")
- **Problem to solve**:
  - Inventory Service crashes after database commit but before sending HTTP response to Order Service
  - Network errors causing Internal Server Error despite successful processing
- **Solution Requirements**:
  - Handle uncertain states between client and server
  - Work around network issues and sudden internal service crashes
  - Ensure system does exactly what it's supposed to do
- **Testing**:
  - Simulate uncertain behaviors in your setup
  - Introduce moments where things don't go as planned
  - Observe how solution reacts when workflow becomes unreliable
  - Demonstrate increased end-user reliability through simulation

### 6. User Interface ("Just A Human Window")
- Build minimal UI that talks to services
- Keep It Stupid Simple (KISS principle)
- Goal: Make backend behavior visible
- Simulate the functionalities

### 7. Cloud Deployment ("The First Cloud Frontier")
- Deploy services at small scale on a cloud provider
- Make microservices live outside local environment

### 8. Bonus Challenge: Data Backup with Constraints
- **Problem**: Database storage can crash and lose data
- **Constraint**: Backup service allows only ONE call per day for backup operation
- **Goal**: Ensure data is safely preserved multiple times despite the one-call-per-day restriction
- Solution approach is open-ended

## Summary of Key Technical Concerns
- Network failures
- Service delays/restarts
- High traffic/load handling
- Partial failures and cascading issues
- Database reliability
- Monitoring and observability
- State consistency between services
- Graceful degradation