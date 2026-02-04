# Ranqly Production Operational Runbook

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Monitoring and Alerting](#monitoring-and-alerting)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)
6. [Emergency Procedures](#emergency-procedures)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Contact Information](#contact-information)

## Overview

This runbook provides operational procedures for the Ranqly Web3 contest platform in production. It covers monitoring, troubleshooting, maintenance, and emergency procedures.

### System Components
- **API Gateway**: Main entry point for all API requests
- **Voting Engine**: Handles commit-reveal voting mechanism
- **Algo Engine**: Content analysis and scoring
- **Dispute Service**: Dispute resolution system
- **Judge Service**: Anonymous judging system
- **Governance Service**: Platform governance
- **Frontend**: React-based user interface
- **Database**: PostgreSQL for persistent data
- **Cache**: Redis for session and temporary data
- **Monitoring**: Prometheus, Grafana, and AlertManager

## System Architecture

### Production Environment
- **Kubernetes Cluster**: AWS EKS/GKE
- **Namespace**: `ranqly-prod`
- **Replicas**: 
  - API Gateway: 3 replicas
  - Voting Engine: 2 replicas
  - Algo Engine: 2 replicas
  - Frontend: 3 replicas
- **Resources**:
  - CPU: 4 cores per service
  - Memory: 8GB per service
  - Storage: 100GB for database, 20GB for Redis

### Network Architecture
- **Load Balancer**: AWS ALB/NLB
- **Ingress**: NGINX Ingress Controller
- **SSL/TLS**: Let's Encrypt certificates
- **DNS**: Route 53 with health checks

## Monitoring and Alerting

### Key Metrics to Monitor

#### Application Metrics
- **API Response Time**: < 500ms (95th percentile)
- **API Error Rate**: < 1%
- **Voting Success Rate**: > 99%
- **Contest Creation Rate**: Monitor for spikes
- **Database Connection Pool**: < 80% utilization

#### Infrastructure Metrics
- **CPU Usage**: < 70%
- **Memory Usage**: < 80%
- **Disk Usage**: < 85%
- **Network Latency**: < 100ms
- **Pod Restart Count**: Monitor for increases

#### Business Metrics
- **Active Users**: Daily active users
- **Contest Participation**: Submissions per contest
- **Voting Participation**: Votes per contest
- **Revenue Metrics**: Contest fees and rewards

### Alerting Rules

#### Critical Alerts (Immediate Response)
- Service down or unreachable
- Database connection failures
- High error rates (> 5%)
- Security incidents
- Payment processing failures

#### Warning Alerts (Response within 1 hour)
- High resource utilization
- Slow response times
- Unusual traffic patterns
- Backup failures
- Certificate expiration warnings

### Monitoring Dashboards

#### Grafana Dashboards
1. **System Overview**: High-level system health
2. **API Performance**: Request rates, latencies, errors
3. **Database Performance**: Connections, queries, locks
4. **Cache Performance**: Hit rates, memory usage
5. **Business Metrics**: User activity, contest metrics

## Common Operations

### Daily Operations

#### Health Checks
```bash
# Check all pods status
kubectl get pods -n ranqly-prod

# Check service health
kubectl get svc -n ranqly-prod

# Check ingress status
kubectl get ingress -n ranqly-prod

# Run automated health checks
./scripts/health-check.sh
```

#### Log Review
```bash
# Check API Gateway logs
kubectl logs -f deployment/api-gateway-deployment -n ranqly-prod

# Check for errors in all services
kubectl logs -l app=ranqly -n ranqly-prod --tail=100 | grep ERROR

# Check database logs
kubectl logs deployment/postgres-deployment -n ranqly-prod
```

### Weekly Operations

#### Performance Review
- Review Grafana dashboards for trends
- Analyze slow queries in database
- Check resource utilization patterns
- Review security logs

#### Backup Verification
```bash
# Verify database backups
aws s3 ls s3://ranqly-backups/database/ --recursive

# Test backup restoration
./scripts/disaster-recovery.sh restore-db test-backup.sql.gz

# Verify Redis backups
aws s3 ls s3://ranqly-backups/redis/ --recursive
```

### Monthly Operations

#### Security Updates
- Update base images
- Apply security patches
- Review access logs
- Update SSL certificates

#### Capacity Planning
- Analyze resource usage trends
- Plan for scaling requirements
- Review cost optimization opportunities

## Troubleshooting

### Common Issues and Solutions

#### High API Response Times

**Symptoms:**
- API response times > 1 second
- User complaints about slow performance
- High CPU usage on API Gateway pods

**Diagnosis:**
```bash
# Check pod resource usage
kubectl top pods -n ranqly-prod

# Check database performance
kubectl exec -it deployment/postgres-deployment -n ranqly-prod -- psql -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
kubectl exec -it deployment/postgres-deployment -n ranqly-prod -- psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Solutions:**
1. Scale up API Gateway replicas
2. Optimize database queries
3. Add database indexes
4. Increase resource limits
5. Check for memory leaks

#### Database Connection Issues

**Symptoms:**
- "Too many connections" errors
- API Gateway connection timeouts
- Database pods showing high CPU usage

**Diagnosis:**
```bash
# Check database connections
kubectl exec -it deployment/postgres-deployment -n ranqly-prod -- psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool configuration
kubectl get configmap ranqly-config -n ranqly-prod -o yaml | grep -A 5 DB_POOL
```

**Solutions:**
1. Increase connection pool size
2. Add connection pooling middleware
3. Optimize connection usage
4. Scale database horizontally

#### Redis Cache Issues

**Symptoms:**
- High cache miss rates
- Redis memory usage > 90%
- Slow cache operations

**Diagnosis:**
```bash
# Check Redis memory usage
kubectl exec -it deployment/redis-deployment -n ranqly-prod -- redis-cli info memory

# Check cache hit rate
kubectl exec -it deployment/redis-deployment -n ranqly-prod -- redis-cli info stats | grep keyspace
```

**Solutions:**
1. Increase Redis memory limits
2. Optimize cache key expiration
3. Review cache usage patterns
4. Scale Redis horizontally

### Service-Specific Troubleshooting

#### API Gateway Issues

**Common Problems:**
- Rate limiting triggers
- Authentication failures
- CORS issues
- Load balancer problems

**Debugging Steps:**
1. Check ingress configuration
2. Review API Gateway logs
3. Test endpoints directly
4. Verify SSL certificates

#### Voting Engine Issues

**Common Problems:**
- Vote commitment failures
- Reveal phase issues
- Sybil detection false positives
- Blockchain connectivity problems

**Debugging Steps:**
1. Check blockchain RPC connectivity
2. Verify smart contract interactions
3. Review voting logs
4. Test voting flow manually

#### Algo Engine Issues

**Common Problems:**
- Content analysis failures
- NLP model errors
- Scoring calculation issues
- Memory leaks

**Debugging Steps:**
1. Check Python dependencies
2. Review model performance
3. Monitor memory usage
4. Test content analysis manually

## Emergency Procedures

### Service Outage Response

#### Immediate Response (0-15 minutes)
1. **Acknowledge the incident**
   - Post in #incidents Slack channel
   - Update status page if available
   - Notify on-call engineer

2. **Assess the scope**
   - Check monitoring dashboards
   - Identify affected services
   - Determine user impact

3. **Implement quick fixes**
   - Restart failing services
   - Scale up healthy services
   - Enable maintenance mode if needed

#### Short-term Response (15-60 minutes)
1. **Investigate root cause**
   - Review logs and metrics
   - Check recent deployments
   - Analyze error patterns

2. **Implement workarounds**
   - Deploy hotfixes if available
   - Adjust configuration
   - Enable circuit breakers

3. **Communicate status**
   - Update stakeholders
   - Provide ETA for resolution
   - Document findings

#### Long-term Response (1-4 hours)
1. **Implement permanent fix**
   - Deploy corrected version
   - Update configurations
   - Verify resolution

2. **Post-incident review**
   - Conduct post-mortem
   - Document lessons learned
   - Update runbooks

### Security Incident Response

#### Detection and Assessment
1. **Identify the incident**
   - Review security alerts
   - Check access logs
   - Analyze unusual patterns

2. **Assess impact**
   - Determine data exposure
   - Evaluate system compromise
   - Calculate business impact

#### Containment and Eradication
1. **Isolate affected systems**
   - Disable compromised accounts
   - Block malicious IPs
   - Quarantine affected pods

2. **Remove threats**
   - Patch vulnerabilities
   - Update security rules
   - Clean infected systems

#### Recovery and Lessons Learned
1. **Restore services**
   - Deploy clean versions
   - Restore from backups
   - Verify system integrity

2. **Document incident**
   - Create incident report
   - Update security procedures
   - Conduct security review

### Data Loss Recovery

#### Database Recovery
```bash
# Identify the latest good backup
aws s3 ls s3://ranqly-backups/database/ --recursive | sort

# Restore database
./scripts/disaster-recovery.sh restore-db postgres_backup_YYYYMMDD_HHMMSS.sql.gz

# Verify data integrity
kubectl exec -it deployment/postgres-deployment -n ranqly-prod -- psql -c "SELECT COUNT(*) FROM contests;"
```

#### Redis Recovery
```bash
# Restore Redis from backup
./scripts/disaster-recovery.sh restore-redis redis_backup_YYYYMMDD_HHMMSS.rdb.gz

# Verify cache integrity
kubectl exec -it deployment/redis-deployment -n ranqly-prod -- redis-cli info keyspace
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Maintenance
- [ ] Check system health
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Monitor resource usage

#### Weekly Maintenance
- [ ] Review performance metrics
- [ ] Update security patches
- [ ] Clean up old logs
- [ ] Test disaster recovery

#### Monthly Maintenance
- [ ] Update dependencies
- [ ] Review capacity planning
- [ ] Conduct security audit
- [ ] Update documentation

### Deployment Procedures

#### Rolling Updates
```bash
# Deploy new version
kubectl set image deployment/api-gateway-deployment api-gateway=ranqly/api-gateway:v1.1.0 -n ranqly-prod

# Monitor rollout
kubectl rollout status deployment/api-gateway-deployment -n ranqly-prod

# Rollback if needed
kubectl rollout undo deployment/api-gateway-deployment -n ranqly-prod
```

#### Blue-Green Deployments
```bash
# Deploy to staging environment
kubectl apply -f deployment/kubernetes/staging/

# Run integration tests
./scripts/integration-tests.sh

# Switch traffic to new version
kubectl patch service api-gateway-service -p '{"spec":{"selector":{"version":"v1.1.0"}}}'
```

### Scaling Procedures

#### Horizontal Scaling
```bash
# Scale API Gateway
kubectl scale deployment api-gateway-deployment --replicas=5 -n ranqly-prod

# Scale Voting Engine
kubectl scale deployment voting-engine-deployment --replicas=3 -n ranqly-prod

# Monitor scaling impact
kubectl top pods -n ranqly-prod
```

#### Vertical Scaling
```bash
# Update resource limits
kubectl patch deployment api-gateway-deployment -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"4Gi","cpu":"2"}}}]}}}}' -n ranqly-prod
```

### Backup and Recovery Procedures

#### Automated Backups
- Database backups: Daily at 2 AM UTC
- Redis backups: Daily at 3 AM UTC
- Kubernetes resources: Daily at 4 AM UTC
- Application logs: Weekly retention

#### Manual Backup
```bash
# Create full backup
./scripts/disaster-recovery.sh backup

# Verify backup
aws s3 ls s3://ranqly-backups/ --recursive
```

#### Recovery Testing
```bash
# Test database recovery
./scripts/disaster-recovery.sh restore-db postgres_backup_20240101_020000.sql.gz

# Test Redis recovery
./scripts/disaster-recovery.sh restore-redis redis_backup_20240101_030000.rdb.gz

# Verify system health after recovery
./scripts/disaster-recovery.sh health-check
```

## Contact Information

### On-Call Schedule
- **Primary**: Available 24/7
- **Secondary**: Available during business hours
- **Escalation**: Engineering Manager

### Emergency Contacts
- **Incident Response**: +1-XXX-XXX-XXXX
- **Security Team**: security@ranqly.com
- **Engineering Manager**: engineering@ranqly.com

### External Contacts
- **Cloud Provider**: AWS Support
- **DNS Provider**: Route 53 Support
- **SSL Provider**: Let's Encrypt Support
- **Monitoring**: DataDog Support

### Communication Channels
- **Incidents**: #incidents Slack channel
- **Operations**: #ops Slack channel
- **Security**: #security Slack channel
- **Status Page**: https://status.ranqly.com

### Escalation Procedures
1. **Level 1**: On-call engineer (0-15 minutes)
2. **Level 2**: Senior engineer (15-30 minutes)
3. **Level 3**: Engineering manager (30-60 minutes)
4. **Level 4**: CTO (60+ minutes)

---

*This runbook is a living document and should be updated regularly based on operational experience and system changes.*
