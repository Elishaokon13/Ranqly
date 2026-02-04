#!/bin/bash

# Ranqly Disaster Recovery Script
# This script provides comprehensive disaster recovery procedures for the Ranqly platform

set -euo pipefail

# Configuration
NAMESPACE="ranqly-prod"
BACKUP_NAMESPACE="ranqly-backup"
S3_BUCKET="ranqly-backups"
AWS_REGION="us-west-2"
RETENTION_DAYS=30

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
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if aws CLI is available
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump is not installed or not in PATH"
        exit 1
    fi
    
    # Check if redis-cli is available
    if ! command -v redis-cli &> /dev/null; then
        log_error "redis-cli is not installed or not in PATH"
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

# Create backup namespace
create_backup_namespace() {
    log_info "Creating backup namespace..."
    
    kubectl create namespace $BACKUP_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Backup namespace created"
}

# Backup database
backup_database() {
    log_info "Starting database backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="postgres_backup_${timestamp}.sql"
    local backup_path="/tmp/${backup_file}"
    
    # Get database credentials
    local db_host=$(kubectl get svc postgres-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local db_user=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_USERNAME}' | base64 -d)
    local db_password=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
    local db_name=$(kubectl get configmap ranqly-config -n $NAMESPACE -o jsonpath='{.data.DB_NAME}')
    
    # Create database backup
    PGPASSWORD=$db_password pg_dump -h $db_host -U $db_user -d $db_name > $backup_path
    
    # Compress backup
    gzip $backup_path
    backup_path="${backup_path}.gz"
    
    # Upload to S3
    aws s3 cp $backup_path s3://$S3_BUCKET/database/$backup_file.gz --region $AWS_REGION
    
    # Clean up local backup
    rm $backup_path
    
    log_success "Database backup completed: $backup_file.gz"
}

# Backup Redis
backup_redis() {
    log_info "Starting Redis backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="redis_backup_${timestamp}.rdb"
    local backup_path="/tmp/${backup_file}"
    
    # Get Redis credentials
    local redis_host=$(kubectl get svc redis-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local redis_password=$(kubectl get secret ranqly-redis-secret -n $NAMESPACE -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)
    
    # Create Redis backup
    redis-cli -h $redis_host -a $redis_password --rdb $backup_path
    
    # Compress backup
    gzip $backup_path
    backup_path="${backup_path}.gz"
    
    # Upload to S3
    aws s3 cp $backup_path s3://$S3_BUCKET/redis/$backup_file.gz --region $AWS_REGION
    
    # Clean up local backup
    rm $backup_path
    
    log_success "Redis backup completed: $backup_file.gz"
}

# Backup Kubernetes resources
backup_kubernetes_resources() {
    log_info "Starting Kubernetes resources backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="/tmp/k8s_backup_${timestamp}"
    
    mkdir -p $backup_dir
    
    # Backup all resources in the namespace
    kubectl get all -n $NAMESPACE -o yaml > $backup_dir/all_resources.yaml
    kubectl get configmaps -n $NAMESPACE -o yaml > $backup_dir/configmaps.yaml
    kubectl get secrets -n $NAMESPACE -o yaml > $backup_dir/secrets.yaml
    kubectl get pvc -n $NAMESPACE -o yaml > $backup_dir/pvc.yaml
    
    # Create tar archive
    tar -czf $backup_dir.tar.gz -C /tmp $(basename $backup_dir)
    
    # Upload to S3
    aws s3 cp $backup_dir.tar.gz s3://$S3_BUCKET/kubernetes/$backup_dir.tar.gz --region $AWS_REGION
    
    # Clean up
    rm -rf $backup_dir $backup_dir.tar.gz
    
    log_success "Kubernetes resources backup completed"
}

# Restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "Backup file not specified"
        exit 1
    fi
    
    log_info "Starting database restore from $backup_file..."
    
    # Download backup from S3
    local local_backup="/tmp/restore_$(basename $backup_file)"
    aws s3 cp s3://$S3_BUCKET/database/$backup_file $local_backup --region $AWS_REGION
    
    # Decompress if needed
    if [[ $backup_file == *.gz ]]; then
        gunzip $local_backup
        local_backup="${local_backup%.gz}"
    fi
    
    # Get database credentials
    local db_host=$(kubectl get svc postgres-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local db_user=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_USERNAME}' | base64 -d)
    local db_password=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
    local db_name=$(kubectl get configmap ranqly-config -n $NAMESPACE -o jsonpath='{.data.DB_NAME}')
    
    # Restore database
    PGPASSWORD=$db_password psql -h $db_host -U $db_user -d $db_name < $local_backup
    
    # Clean up
    rm $local_backup
    
    log_success "Database restore completed"
}

# Restore Redis
restore_redis() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "Backup file not specified"
        exit 1
    fi
    
    log_info "Starting Redis restore from $backup_file..."
    
    # Download backup from S3
    local local_backup="/tmp/restore_$(basename $backup_file)"
    aws s3 cp s3://$S3_BUCKET/redis/$backup_file $local_backup --region $AWS_REGION
    
    # Decompress if needed
    if [[ $backup_file == *.gz ]]; then
        gunzip $local_backup
        local_backup="${local_backup%.gz}"
    fi
    
    # Get Redis credentials
    local redis_host=$(kubectl get svc redis-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local redis_password=$(kubectl get secret ranqly-redis-secret -n $NAMESPACE -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)
    
    # Stop Redis service
    kubectl scale deployment redis-deployment --replicas=0 -n $NAMESPACE
    
    # Wait for Redis to stop
    kubectl wait --for=delete pod -l app=ranqly,component=redis -n $NAMESPACE --timeout=300s
    
    # Copy backup to Redis pod
    kubectl cp $local_backup $NAMESPACE/$(kubectl get pods -l app=ranqly,component=redis -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb
    
    # Start Redis service
    kubectl scale deployment redis-deployment --replicas=1 -n $NAMESPACE
    
    # Clean up
    rm $local_backup
    
    log_success "Redis restore completed"
}

# Restore Kubernetes resources
restore_kubernetes_resources() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "Backup file not specified"
        exit 1
    fi
    
    log_info "Starting Kubernetes resources restore from $backup_file..."
    
    # Download backup from S3
    local local_backup="/tmp/restore_$(basename $backup_file)"
    aws s3 cp s3://$S3_BUCKET/kubernetes/$backup_file $local_backup --region $AWS_REGION
    
    # Extract backup
    tar -xzf $local_backup -C /tmp
    
    # Apply resources
    kubectl apply -f /tmp/k8s_backup_*/all_resources.yaml
    kubectl apply -f /tmp/k8s_backup_*/configmaps.yaml
    kubectl apply -f /tmp/k8s_backup_*/secrets.yaml
    kubectl apply -f /tmp/k8s_backup_*/pvc.yaml
    
    # Clean up
    rm -rf $local_backup /tmp/k8s_backup_*
    
    log_success "Kubernetes resources restore completed"
}

# Failover to backup region
failover_to_backup_region() {
    log_info "Starting failover to backup region..."
    
    # This would involve:
    # 1. Updating DNS records to point to backup region
    # 2. Starting services in backup region
    # 3. Restoring data from backups
    # 4. Verifying service health
    
    log_warning "Failover procedure not fully implemented - manual intervention required"
    log_info "Steps for manual failover:"
    log_info "1. Update DNS records to point to backup region"
    log_info "2. Deploy services in backup region"
    log_info "3. Restore database and Redis from latest backups"
    log_info "4. Verify all services are healthy"
    log_info "5. Update monitoring and alerting"
}

# Health check
health_check() {
    log_info "Running health checks..."
    
    # Check if all pods are running
    local failed_pods=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running --no-headers | wc -l)
    if [ $failed_pods -gt 0 ]; then
        log_error "Found $failed_pods failed pods"
        kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running
        return 1
    fi
    
    # Check API Gateway health
    local api_gateway_ip=$(kubectl get svc api-gateway-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    if ! curl -f http://$api_gateway_ip:8000/health > /dev/null 2>&1; then
        log_error "API Gateway health check failed"
        return 1
    fi
    
    # Check database connectivity
    local db_host=$(kubectl get svc postgres-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local db_user=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_USERNAME}' | base64 -d)
    local db_password=$(kubectl get secret ranqly-db-secret -n $NAMESPACE -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
    local db_name=$(kubectl get configmap ranqly-config -n $NAMESPACE -o jsonpath='{.data.DB_NAME}')
    
    if ! PGPASSWORD=$db_password pg_isready -h $db_host -U $db_user -d $db_name > /dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Check Redis connectivity
    local redis_host=$(kubectl get svc redis-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    local redis_password=$(kubectl get secret ranqly-redis-secret -n $NAMESPACE -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)
    
    if ! redis-cli -h $redis_host -a $redis_password ping > /dev/null 2>&1; then
        log_error "Redis connectivity check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Clean up S3 backups older than retention period
    aws s3api list-objects-v2 --bucket $S3_BUCKET --query "Contents[?LastModified<='$(date -d "$RETENTION_DAYS days ago" --iso-8601)'].Key" --output text | \
    while read key; do
        if [ ! -z "$key" ]; then
            aws s3 rm s3://$S3_BUCKET/$key --region $AWS_REGION
            log_info "Deleted old backup: $key"
        fi
    done
    
    log_success "Old backups cleanup completed"
}

# Main function
main() {
    case "${1:-}" in
        "backup")
            log_info "Starting backup procedure..."
            check_prerequisites
            create_backup_namespace
            backup_database
            backup_redis
            backup_kubernetes_resources
            log_success "Backup procedure completed"
            ;;
        "restore-db")
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 restore-db <backup-file>"
                exit 1
            fi
            log_info "Starting database restore..."
            check_prerequisites
            restore_database "$2"
            log_success "Database restore completed"
            ;;
        "restore-redis")
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 restore-redis <backup-file>"
                exit 1
            fi
            log_info "Starting Redis restore..."
            check_prerequisites
            restore_redis "$2"
            log_success "Redis restore completed"
            ;;
        "restore-k8s")
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 restore-k8s <backup-file>"
                exit 1
            fi
            log_info "Starting Kubernetes resources restore..."
            check_prerequisites
            restore_kubernetes_resources "$2"
            log_success "Kubernetes resources restore completed"
            ;;
        "failover")
            log_info "Starting failover procedure..."
            check_prerequisites
            failover_to_backup_region
            log_success "Failover procedure completed"
            ;;
        "health-check")
            log_info "Starting health check..."
            health_check
            ;;
        "cleanup")
            log_info "Starting cleanup procedure..."
            cleanup_old_backups
            log_success "Cleanup procedure completed"
            ;;
        *)
            echo "Usage: $0 {backup|restore-db|restore-redis|restore-k8s|failover|health-check|cleanup}"
            echo ""
            echo "Commands:"
            echo "  backup              - Create full backup of all resources"
            echo "  restore-db          - Restore database from backup"
            echo "  restore-redis       - Restore Redis from backup"
            echo "  restore-k8s         - Restore Kubernetes resources from backup"
            echo "  failover            - Failover to backup region"
            echo "  health-check        - Run health checks"
            echo "  cleanup             - Clean up old backups"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore-db postgres_backup_20240101_120000.sql.gz"
            echo "  $0 health-check"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
