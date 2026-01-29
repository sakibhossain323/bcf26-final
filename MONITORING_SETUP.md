# Monitoring Setup for Valerix Platform

This document describes how to set up Grafana and Prometheus to monitor your application metrics available at `localhost:8081/metrics`.

## Prerequisites

- Docker and Docker Compose installed
- Your application running and exposing metrics at `localhost:8081/metrics`

## Configuration Files Created

### 1. Prometheus Configuration (`monitoring/prometheus.yml`)
Updated to include scraping from:
- `order-service:3001/metrics`
- `inventory-service:3002/metrics`
- `kong:8001/metrics`
- **NEW**: `host.docker.internal:8081/metrics` (your external application)

### 2. Grafana Datasource Configuration
- Configures Prometheus as the default data source
- Sets up automatic connection to Prometheus at `http://prometheus:9090`

### 3. Dashboard Provisioning
- Sets up automatic dashboard loading from the designated directory

## Steps to Deploy the Monitoring Stack

1. **Run the setup script** (may require sudo):
   ```bash
   ./create_dashboard_config.sh
   ```

2. **Start the monitoring services**:
   ```bash
   docker-compose up -d prometheus grafana
   ```

3. **Access the services**:
   - **Grafana**: [http://localhost:3000](http://localhost:3000)
     - Username: `admin`
     - Password: `admin`
   - **Prometheus**: [http://localhost:9000](http://localhost:9090)

## Important Notes

- The configuration uses `host.docker.internal:8081` to reach your host machine's port 8081 from within Docker containers
- This allows Prometheus to scrape metrics from your application running on the host
- The dashboard includes panels for CPU, memory, HTTP requests, and general metrics
- After logging into Grafana, you may want to change the default password for security

## Troubleshooting

If your metrics at `localhost:8081/metrics` are not appearing in Prometheus:

1. Verify your application is running and accessible at `http://localhost:8081/metrics`
2. Check if Prometheus is correctly scraping by visiting [http://localhost:9090/targets](http://localhost:9090/targets)
3. Look for any firewall rules that might be blocking Docker containers from reaching the host
4. On some systems, you might need to use `172.17.0.1:8081` instead of `host.docker.internal:8081`

## Sample Dashboard

A sample dashboard JSON file has been provided (`sample-dashboard.json`) that you can import into Grafana under the Dashboards section.

## Stopping the Services

To stop the monitoring services:
```bash
docker-compose stop prometheus grafana
```

To remove the services completely:
```bash
docker-compose down prometheus grafana
```