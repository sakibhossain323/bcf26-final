# Complete Guide: Setting Up Grafana to Monitor Your Application Metrics

This guide will walk you through setting up Grafana to visualize your metrics from `localhost:8081/metrics`.

## What Has Been Done

1. **Updated Prometheus Configuration**:
   - Added your application endpoint at `localhost:8081/metrics` to the prometheus.yml file
   - The configuration now scrapes metrics from your application along with other services

2. **Added Docker Services**:
   - Added Prometheus and Grafana services to your docker-compose.yml
   - Services are configured to work with your existing infrastructure

3. **Created Configuration Files**:
   - DataSource configuration for Grafana
   - Dashboard provisioning configuration
   - Sample dashboard JSON for quick visualization

## How to Set Up Monitoring

### Step 1: Create Configuration Files

Run the following script to create the necessary Grafana configuration files (this handles the permission issues):

```bash
sudo mkdir -p monitoring/grafana/datasources
sudo mkdir -p monitoring/grafana/dashboards

# Create datasource configuration
sudo tee monitoring/grafana/datasources/datasource.yml > /dev/null << 'EOF'
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

# Create dashboard provisioning configuration
sudo tee monitoring/grafana/dashboards/dashboard.yml > /dev/null << 'EOF'
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
```

### Step 2: Start the Monitoring Stack

From the root of your project directory, start only the monitoring services:

```bash
docker-compose up -d prometheus grafana
```

### Step 3: Access Grafana

Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

- Username: `admin`
- Password: `admin`

> Note: Change the default password after first login for security purposes.

### Step 4: Verify Data Source Connection

1. In Grafana, go to the sidebar and click on "Connections" (plug icon)
2. Click on "Data sources"
3. You should see "Prometheus" listed and marked as "Default"
4. Click on "Prometheus" to view its configuration
5. Click "Save & Test" to confirm the connection to Prometheus is working

### Step 5: Verify Your Metrics Are Being Collected

1. Navigate to [http://localhost:9090](http://localhost:9090) (Prometheus web interface)
2. Go to "Status" → "Targets"
3. Look for the "external-application" job to confirm it's successfully scraping metrics from localhost:8081

### Step 6: Create Your First Dashboard

1. In Grafana, click the "+" icon in the left sidebar and select "Dashboard"
2. Click "Add new panel"
3. In the query editor, you should be able to query your metrics from localhost:8081:
   - Select the Prometheus data source
   - Enter your metric name (e.g., `up`, `promhttp_metric_handler_errors_total`, or any custom metrics you expose)
4. Customize the visualization and click "Apply"

## Alternative Method: Using the Sample Dashboard

1. Copy the JSON from `sample-dashboard.json` file provided
2. In Grafana, go to "Dashboards" → "Import"
3. Paste the JSON or upload the file
4. Select the Prometheus data source
5. Import the dashboard

## Troubleshooting Tips

### If metrics from localhost:8081 are not showing:

1. **Check the application is running**:
   ```bash
   curl http://localhost:8081/metrics
   ```
   You should receive Prometheus-formatted metrics.

2. **Verify container connectivity**:
   ```bash
   docker exec -it prometheus wget -qO- http://host.docker.internal:8081/metrics
   ```
   
   Note: On Linux, you might need to use the host's IP address instead of `host.docker.internal`:
   ```bash
   docker exec -it prometheus wget -qO- http://172.17.0.1:8081/metrics
   ```

3. **Check Prometheus targets**:
   - Visit [http://localhost:9090/targets](http://localhost:9090/targets)
   - Look for the "external-application" job
   - Check the status (should be UP)

4. **Firewall Issues**:
   - On Linux, Docker containers may not have access to host network by default
   - If needed, run your application with host networking: `--network="host"` or configure port mapping appropriately

### Common Solutions for Different Platforms:

**Linux:**
- The prometheus.yml specifies both `host.docker.internal:8081` and `172.17.0.1:8081` to maximize compatibility
- If neither works, you may need to find your Docker bridge IP:
  ```bash
  docker network inspect bridge | grep Gateway | grep -oP '\d+\.\d+\.\d+\.\d+'
  ```

**macOS/Windows:**
- `host.docker.internal` should work by default

## Stopping the Monitoring Services

To stop the monitoring stack:
```bash
docker-compose stop prometheus grafana
```

To start again:
```bash
docker-compose start prometheus grafana
```

## Production Considerations

For production environments, consider:
- Changing default credentials for Grafana
- Securing Prometheus endpoints
- Setting up retention policies for long-term storage
- Configuring alerts and notification channels

That's it! You now have Grafana monitoring your application metrics from localhost:8081/metrics.