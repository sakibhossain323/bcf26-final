#!/bin/bash

# Create dashboard configuration with proper permissions
sudo mkdir -p /home/navid-kamal/valerix-platform/monitoring/grafana/datasources
sudo mkdir -p /home/navid-kamal/valerix-platform/monitoring/grafana/dashboards

# Create datasource config
sudo tee /home/navid-kamal/valerix-platform/monitoring/grafana/datasources/datasource.yml > /dev/null << 'EOF'
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

# Create dashboard provisioning config
sudo tee /home/navid-kamal/valerix-platform/monitoring/grafana/dashboards/dashboard.yml > /dev/null << 'EOF'
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

echo "Configuration files created successfully!"
echo "You can now run: docker-compose up -d prometheus grafana"