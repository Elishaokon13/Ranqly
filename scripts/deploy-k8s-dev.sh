#!/bin/bash

# Ranqly Kubernetes Development Deployment Script
# This script deploys the Ranqly application to a local Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="ranqly-dev"
KUBECTL_CMD="kubectl"
KUSTOMIZE_CMD="kubectl apply -k"

# Functions
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
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your cluster connection."
        exit 1
    fi
    
    # Check if kustomize is available
    if ! kubectl kustomize --help &> /dev/null; then
        log_warning "kustomize is not available. Using kubectl apply instead."
        KUSTOMIZE_CMD="kubectl apply -f"
    fi
    
    log_success "Prerequisites check passed"
}

# Build and push Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build API Gateway
    log_info "Building API Gateway image..."
    docker build -t ranqly/api-gateway:latest -f services/api-gateway/Dockerfile .
    
    # Build Algo Engine
    log_info "Building Algo Engine image..."
    docker build -t ranqly/algo-engine:latest -f services/algo-engine/Dockerfile .
    
    # Build Voting Engine
    log_info "Building Voting Engine image..."
    docker build -t ranqly/voting-engine:latest -f services/voting-engine/Dockerfile .
    
    # Build Frontend
    log_info "Building Frontend image..."
    docker build -t ranqly/frontend:latest -f frontend/Dockerfile .
    
    log_success "All Docker images built successfully"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f deployment/kubernetes/dev/namespace.yaml
    
    # Apply all resources using kustomize
    log_info "Applying Kubernetes resources..."
    cd deployment/kubernetes/dev
    $KUSTOMIZE_CMD .
    cd ../../..
    
    log_success "Kubernetes resources deployed successfully"
}

# Wait for deployments to be ready
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE
    
    # Wait for Redis
    log_info "Waiting for Redis to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n $NAMESPACE
    
    # Wait for API Gateway
    log_info "Waiting for API Gateway to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n $NAMESPACE
    
    log_success "All deployments are ready"
}

# Show deployment status
show_status() {
    log_info "Deployment status:"
    kubectl get pods -n $NAMESPACE
    kubectl get services -n $NAMESPACE
    kubectl get ingress -n $NAMESPACE
}

# Port forward services for local access
port_forward() {
    log_info "Setting up port forwarding..."
    
    # API Gateway
    log_info "Port forwarding API Gateway (8000:8000)..."
    kubectl port-forward service/api-gateway-service 8000:8000 -n $NAMESPACE &
    API_GW_PID=$!
    
    # PostgreSQL
    log_info "Port forwarding PostgreSQL (5432:5432)..."
    kubectl port-forward service/postgres-service 5432:5432 -n $NAMESPACE &
    POSTGRES_PID=$!
    
    # Redis
    log_info "Port forwarding Redis (6379:6379)..."
    kubectl port-forward service/redis-service 6379:6379 -n $NAMESPACE &
    REDIS_PID=$!
    
    log_success "Port forwarding started"
    log_info "API Gateway: http://localhost:8000"
    log_info "PostgreSQL: localhost:5432"
    log_info "Redis: localhost:6379"
    
    # Save PIDs for cleanup
    echo $API_GW_PID > .port-forward-pids
    echo $POSTGRES_PID >> .port-forward-pids
    echo $REDIS_PID >> .port-forward-pids
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Kill port forwarding processes
    if [ -f .port-forward-pids ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
            fi
        done < .port-forward-pids
        rm .port-forward-pids
    fi
    
    log_success "Cleanup completed"
}

# Main function
main() {
    log_info "Starting Ranqly Kubernetes deployment..."
    
    # Set trap for cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    
    if [ "$1" = "--build" ]; then
        build_images
    fi
    
    deploy_to_k8s
    wait_for_deployments
    show_status
    
    if [ "$1" = "--port-forward" ] || [ "$2" = "--port-forward" ]; then
        port_forward
        log_info "Press Ctrl+C to stop port forwarding and exit"
        wait
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build         Build Docker images before deployment"
    echo "  --port-forward  Start port forwarding for local access"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy without building images"
    echo "  $0 --build                   # Build images and deploy"
    echo "  $0 --build --port-forward    # Build, deploy, and port forward"
}

# Handle command line arguments
if [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"
