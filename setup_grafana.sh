#!/bin/bash

# Script to set up Grafana and Prometheus configuration for Valerix platform

echo "Setting up Grafana and Prometheus monitoring..."

# Create the necessary directory structure if it doesn't exist
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/grafana/dashboards

# Create the datasource configuration for Prometheus
cat > monitoring/grafana/datasources/datasource.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "5s"
EOF

# Create a basic dashboard provisioning configuration
cat > monitoring/grafana/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

echo "Grafana and Prometheus configuration created successfully!"
echo ""
echo "To start the monitoring stack, run:"
echo "  docker-compose up -d prometheus grafana"
echo ""
echo "Access Grafana at: http://localhost:3000"
echo "Username: admin"
echo "Password: admin"
echo ""
echo "Prometheus will be accessible at: http://localhost:9090"
echo ""
echo "Note: The prometheus.yml file has been updated to scrape metrics from:"
echo "  - order-service:3001/metrics"
echo "  - inventory-service:3002/metrics"  
echo "  - kong:8001/metrics"
echo "  - host.docker.internal:8081/metrics (your external application)"