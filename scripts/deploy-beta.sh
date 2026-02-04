#!/bin/bash

# Ranqly Beta Testing Deployment Script
# This script deploys the Ranqly platform to a staging environment for beta testing

set -e

# Configuration
NAMESPACE="ranqly-staging"
ENVIRONMENT="staging"
BETA_VERSION="1.0.0-beta"
DOCKER_REGISTRY="ranqly"
BACKUP_ENABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm first."
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup existing deployment
backup_deployment() {
    if [ "$BACKUP_ENABLED" = true ]; then
        log_info "Creating backup of existing deployment..."
        
        BACKUP_DIR="/tmp/ranqly-beta-backup-$(date +%Y%m%d%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup Kubernetes resources
        kubectl get all -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/k8s-resources.yaml" 2>/dev/null || true
        kubectl get pvc -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/pvcs.yaml" 2>/dev/null || true
        kubectl get secrets -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/secrets.yaml" 2>/dev/null || true
        kubectl get configmaps -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/configmaps.yaml" 2>/dev/null || true
        
        # Backup database if exists
        POSTGRES_POD=$(kubectl get pods -n "$NAMESPACE" -l app=ranqly-postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        if [ -n "$POSTGRES_POD" ]; then
            log_info "Backing up PostgreSQL database..."
            kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- pg_dumpall -U ranqlyuser > "$BACKUP_DIR/postgres-backup.sql" 2>/dev/null || log_warning "Database backup failed"
        fi
        
        log_success "Backup created at $BACKUP_DIR"
    fi
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # List of services to build
    SERVICES=(
        "api-gateway"
        "algo-engine"
        "voting-engine"
        "judge-service"
        "dispute-service"
        "governance-service"
        "feedback-service"
        "beta-user-service"
        "analytics-service"
        "frontend"
    )
    
    for service in "${SERVICES[@]}"; do
        log_info "Building $service..."
        
        if [ -d "services/$service" ]; then
            docker build -t "$DOCKER_REGISTRY/$service:$BETA_VERSION" "services/$service"
            docker push "$DOCKER_REGISTRY/$service:$BETA_VERSION"
            log_success "$service image built and pushed"
        elif [ "$service" = "frontend" ] && [ -d "frontend" ]; then
            docker build -t "$DOCKER_REGISTRY/$service:$BETA_VERSION" "frontend"
            docker push "$DOCKER_REGISTRY/$service:$BETA_VERSION"
            log_success "$service image built and pushed"
        else
            log_warning "Service $service not found, skipping..."
        fi
    done
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes namespace: $NAMESPACE"
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply base configurations
    log_info "Applying base configurations..."
    kubectl apply -f deployment/kubernetes/staging/namespace.yaml
    kubectl apply -f deployment/kubernetes/staging/configmaps.yaml
    kubectl apply -f deployment/kubernetes/staging/secrets.yaml
    
    # Deploy infrastructure
    log_info "Deploying infrastructure..."
    kubectl apply -f deployment/kubernetes/staging/database.yaml
    kubectl apply -f deployment/kubernetes/staging/redis.yaml
    kubectl apply -f deployment/kubernetes/staging/monitoring.yaml
    
    # Wait for infrastructure to be ready
    log_info "Waiting for infrastructure to be ready..."
    kubectl wait --for=condition=ready pod -l app=ranqly-postgres -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=ranqly-redis -n "$NAMESPACE" --timeout=300s
    
    # Deploy microservices
    log_info "Deploying microservices..."
    for service in api-gateway algo-engine voting-engine judge-service dispute-service governance-service feedback-service beta-user-service analytics-service; do
        if [ -f "deployment/kubernetes/staging/$service.yaml" ]; then
            kubectl apply -f "deployment/kubernetes/staging/$service.yaml"
            log_info "$service deployed"
        else
            log_warning "Deployment file for $service not found, creating basic deployment..."
            create_basic_deployment "$service"
        fi
    done
    
    # Deploy frontend
    log_info "Deploying frontend..."
    if [ -f "deployment/kubernetes/staging/frontend.yaml" ]; then
        kubectl apply -f "deployment/kubernetes/staging/frontend.yaml"
    else
        log_warning "Frontend deployment file not found, creating basic deployment..."
        create_basic_deployment "frontend"
    fi
    
    # Deploy ingress
    log_info "Deploying ingress..."
    if [ -f "deployment/kubernetes/staging/ingress.yaml" ]; then
        kubectl apply -f "deployment/kubernetes/staging/ingress.yaml"
    else
        log_warning "Ingress configuration not found"
    fi
}

# Create basic deployment for missing services
create_basic_deployment() {
    local service=$1
    local port=8000
    
    # Set default ports for services
    case $service in
        "api-gateway") port=8000 ;;
        "algo-engine") port=8001 ;;
        "voting-engine") port=8002 ;;
        "judge-service") port=8003 ;;
        "dispute-service") port=8004 ;;
        "governance-service") port=8005 ;;
        "feedback-service") port=8006 ;;
        "beta-user-service") port=8007 ;;
        "analytics-service") port=8008 ;;
        "frontend") port=3000 ;;
    esac
    
    cat > "deployment/kubernetes/staging/$service.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $service
  namespace: $NAMESPACE
  labels:
    app: $service
    environment: $ENVIRONMENT
    version: $BETA_VERSION
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $service
  template:
    metadata:
      labels:
        app: $service
        environment: $ENVIRONMENT
        version: $BETA_VERSION
    spec:
      containers:
      - name: $service
        image: $DOCKER_REGISTRY/$service:$BETA_VERSION
        ports:
        - containerPort: $port
        env:
        - name: NODE_ENV
          value: "$ENVIRONMENT"
        - name: PORT
          value: "$port"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: $port
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: $port
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: $service-service
  namespace: $NAMESPACE
  labels:
    app: $service
spec:
  selector:
    app: $service
  ports:
  - protocol: TCP
    port: $port
    targetPort: $port
  type: ClusterIP
EOF
    
    kubectl apply -f "deployment/kubernetes/staging/$service.yaml"
    log_success "Basic deployment created for $service"
}

# Wait for deployment to be ready
wait_for_deployment() {
    log_info "Waiting for all deployments to be ready..."
    
    # Wait for all deployments
    kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=600s
    
    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE"
    
    # Wait for all pods to be running
    kubectl wait --for=condition=ready pod --all -n "$NAMESPACE" --timeout=300s
    
    log_success "All deployments are ready"
}

# Run post-deployment tests
run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Get service endpoints
    API_GATEWAY_IP=$(kubectl get service api-gateway-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [ -n "$API_GATEWAY_IP" ]; then
        # Test API Gateway health
        log_info "Testing API Gateway health..."
        if curl -f "http://$API_GATEWAY_IP:8000/health" > /dev/null 2>&1; then
            log_success "API Gateway health check passed"
        else
            log_warning "API Gateway health check failed"
        fi
        
        # Test frontend accessibility
        log_info "Testing frontend accessibility..."
        if curl -f "http://$API_GATEWAY_IP:3000" > /dev/null 2>&1; then
            log_success "Frontend accessibility test passed"
        else
            log_warning "Frontend accessibility test failed"
        fi
    else
        log_warning "Could not get API Gateway IP, skipping health checks"
    fi
}

# Display deployment information
display_deployment_info() {
    log_success "Beta deployment completed successfully!"
    
    echo ""
    echo "=== DEPLOYMENT INFORMATION ==="
    echo "Namespace: $NAMESPACE"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $BETA_VERSION"
    echo ""
    
    echo "=== SERVICE ENDPOINTS ==="
    kubectl get services -n "$NAMESPACE" -o wide
    
    echo ""
    echo "=== POD STATUS ==="
    kubectl get pods -n "$NAMESPACE"
    
    echo ""
    echo "=== INGRESS INFORMATION ==="
    kubectl get ingress -n "$NAMESPACE" 2>/dev/null || echo "No ingress found"
    
    echo ""
    echo "=== ACCESS INSTRUCTIONS ==="
    echo "1. Configure your hosts file to point beta.ranqly.com to the ingress IP"
    echo "2. Access the beta platform at: https://beta.ranqly.com"
    echo "3. Monitor the deployment with: kubectl get pods -n $NAMESPACE"
    echo "4. View logs with: kubectl logs -f deployment/<service-name> -n $NAMESPACE"
    
    echo ""
    echo "=== MONITORING ==="
    echo "Prometheus: kubectl port-forward svc/prometheus-service 9090:9090 -n $NAMESPACE"
    echo "Grafana: kubectl port-forward svc/grafana-service 3000:3000 -n $NAMESPACE"
    
    echo ""
    echo "=== USEFUL COMMANDS ==="
    echo "kubectl get all -n $NAMESPACE"
    echo "kubectl logs -f deployment/api-gateway -n $NAMESPACE"
    echo "kubectl describe pod <pod-name> -n $NAMESPACE"
    echo "kubectl exec -it <pod-name> -n $NAMESPACE -- /bin/bash"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f deployment/kubernetes/staging/*-temp.yaml 2>/dev/null || true
}

# Main execution
main() {
    log_info "Starting Ranqly Beta Testing Deployment"
    log_info "Version: $BETA_VERSION"
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    backup_deployment
    build_and_push_images
    deploy_to_kubernetes
    wait_for_deployment
    run_post_deployment_tests
    display_deployment_info
    
    log_success "Beta deployment completed successfully!"
}

# Run main function
main "$@"
