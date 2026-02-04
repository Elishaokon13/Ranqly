#!/usr/bin/env python3
"""
Ranqly Security Monitor
Real-time security monitoring and incident response system
"""

import asyncio
import json
import logging
import smtplib
import time
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from pathlib import Path
from typing import Dict, List, Optional, Any
import aiohttp
import psutil
import yaml
from dataclasses import dataclass, asdict

@dataclass
class SecurityEvent:
    id: str
    timestamp: str
    severity: str
    category: str
    source: str
    description: str
    details: Dict[str, Any]
    status: str = 'open'
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[str] = None

@dataclass
class SecurityAlert:
    id: str
    event_id: str
    timestamp: str
    severity: str
    message: str
    recipients: List[str]
    sent: bool = False
    acknowledged: bool = False

class SecurityMonitor:
    def __init__(self, config_path: str = "security/config/monitor-config.yaml"):
        self.config = self.load_config(config_path)
        self.events: List[SecurityEvent] = []
        self.alerts: List[SecurityAlert] = []
        self.running = False
        
        # Setup logging
        self.setup_logging()
        
        # Load existing events
        self.load_events()
    
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """Load monitoring configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default monitoring configuration"""
        return {
            'monitoring': {
                'enabled': True,
                'check_interval': 30,  # seconds
                'retention_days': 30
            },
            'alerts': {
                'enabled': True,
                'email': {
                    'enabled': True,
                    'smtp_server': 'localhost',
                    'smtp_port': 587,
                    'username': '',
                    'password': '',
                    'from_email': 'security@ranqly.com',
                    'to_emails': ['admin@ranqly.com']
                },
                'webhook': {
                    'enabled': False,
                    'url': ''
                }
            },
            'thresholds': {
                'cpu_usage': 90,
                'memory_usage': 90,
                'disk_usage': 90,
                'network_connections': 1000,
                'failed_logins': 5,
                'api_errors': 100,
                'response_time': 5.0
            },
            'services': {
                'api_gateway': {
                    'enabled': True,
                    'url': 'http://localhost:8000',
                    'health_endpoint': '/health'
                },
                'voting_engine': {
                    'enabled': True,
                    'url': 'http://localhost:8001',
                    'health_endpoint': '/health'
                },
                'database': {
                    'enabled': True,
                    'host': 'localhost',
                    'port': 5432
                },
                'redis': {
                    'enabled': True,
                    'host': 'localhost',
                    'port': 6379
                }
            }
        }
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = Path("security/logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'security-monitor.log'),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger(__name__)
    
    async def start_monitoring(self):
        """Start security monitoring"""
        self.logger.info("🚀 Starting security monitoring...")
        self.running = True
        
        # Start monitoring tasks
        tasks = [
            self.monitor_system_resources(),
            self.monitor_services(),
            self.monitor_api_security(),
            self.monitor_database_security(),
            self.monitor_network_security(),
            self.process_alerts()
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Security monitoring stopped")
            self.running = False
        except Exception as e:
            self.logger.error(f"❌ Security monitoring failed: {e}")
            self.running = False
    
    async def monitor_system_resources(self):
        """Monitor system resource usage"""
        while self.running:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                if cpu_percent > self.config['thresholds']['cpu_usage']:
                    await self.create_event(
                        severity='high',
                        category='system',
                        source='cpu_monitor',
                        description=f'High CPU usage: {cpu_percent}%',
                        details={'cpu_percent': cpu_percent, 'threshold': self.config['thresholds']['cpu_usage']}
                    )
                
                # Memory usage
                memory = psutil.virtual_memory()
                if memory.percent > self.config['thresholds']['memory_usage']:
                    await self.create_event(
                        severity='high',
                        category='system',
                        source='memory_monitor',
                        description=f'High memory usage: {memory.percent}%',
                        details={'memory_percent': memory.percent, 'threshold': self.config['thresholds']['memory_usage']}
                    )
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                if disk_percent > self.config['thresholds']['disk_usage']:
                    await self.create_event(
                        severity='medium',
                        category='system',
                        source='disk_monitor',
                        description=f'High disk usage: {disk_percent:.1f}%',
                        details={'disk_percent': disk_percent, 'threshold': self.config['thresholds']['disk_usage']}
                    )
                
                await asyncio.sleep(self.config['monitoring']['check_interval'])
                
            except Exception as e:
                self.logger.error(f"System monitoring error: {e}")
                await asyncio.sleep(60)  # Wait before retrying
    
    async def monitor_services(self):
        """Monitor service health and availability"""
        while self.running:
            try:
                async with aiohttp.ClientSession() as session:
                    for service_name, service_config in self.config['services'].items():
                        if not service_config.get('enabled', True):
                            continue
                        
                        try:
                            url = f"{service_config['url']}{service_config.get('health_endpoint', '/health')}"
                            
                            async with session.get(url, timeout=10) as response:
                                if response.status != 200:
                                    await self.create_event(
                                        severity='high',
                                        category='service',
                                        source=f'{service_name}_monitor',
                                        description=f'{service_name} service unhealthy: HTTP {response.status}',
                                        details={'status_code': response.status, 'url': url}
                                    )
                        
                        except asyncio.TimeoutError:
                            await self.create_event(
                                severity='high',
                                category='service',
                                source=f'{service_name}_monitor',
                                description=f'{service_name} service timeout',
                                details={'timeout': 10, 'url': url}
                            )
                        
                        except Exception as e:
                            await self.create_event(
                                severity='high',
                                category='service',
                                source=f'{service_name}_monitor',
                                description=f'{service_name} service error: {str(e)}',
                                details={'error': str(e), 'url': url}
                            )
                
                await asyncio.sleep(self.config['monitoring']['check_interval'])
                
            except Exception as e:
                self.logger.error(f"Service monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def monitor_api_security(self):
        """Monitor API security events"""
        while self.running:
            try:
                # Monitor for suspicious API activity
                await self.check_api_rate_limiting()
                await self.check_api_authentication_failures()
                await self.check_api_input_validation()
                
                await asyncio.sleep(self.config['monitoring']['check_interval'])
                
            except Exception as e:
                self.logger.error(f"API security monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def check_api_rate_limiting(self):
        """Check for API rate limiting violations"""
        # This would typically query logs or metrics
        # For now, we'll simulate the check
        
        # In a real implementation, you would:
        # 1. Query your API gateway logs
        # 2. Count requests per IP in the last minute
        # 3. Alert if any IP exceeds the rate limit
        
        pass
    
    async def check_api_authentication_failures(self):
        """Check for authentication failures"""
        # This would typically query authentication logs
        # For now, we'll simulate the check
        
        # In a real implementation, you would:
        # 1. Query authentication service logs
        # 2. Count failed authentication attempts
        # 3. Alert if failures exceed threshold
        
        pass
    
    async def check_api_input_validation(self):
        """Check for input validation issues"""
        # This would typically query API logs for validation errors
        # For now, we'll simulate the check
        
        # In a real implementation, you would:
        # 1. Query API logs for validation errors
        # 2. Look for potential injection attempts
        # 3. Alert on suspicious patterns
        
        pass
    
    async def monitor_database_security(self):
        """Monitor database security"""
        while self.running:
            try:
                # Check database connection security
                await self.check_database_connections()
                await self.check_database_queries()
                
                await asyncio.sleep(self.config['monitoring']['check_interval'])
                
            except Exception as e:
                self.logger.error(f"Database security monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def check_database_connections(self):
        """Check database connection security"""
        # In a real implementation, you would:
        # 1. Monitor database connection logs
        # 2. Check for unusual connection patterns
        # 3. Alert on potential brute force attempts
        
        pass
    
    async def check_database_queries(self):
        """Check for suspicious database queries"""
        # In a real implementation, you would:
        # 1. Monitor database query logs
        # 2. Look for potential SQL injection attempts
        # 3. Alert on unusual query patterns
        
        pass
    
    async def monitor_network_security(self):
        """Monitor network security"""
        while self.running:
            try:
                # Check network connections
                await self.check_network_connections()
                await self.check_network_traffic()
                
                await asyncio.sleep(self.config['monitoring']['check_interval'])
                
            except Exception as e:
                self.logger.error(f"Network security monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def check_network_connections(self):
        """Check network connections"""
        try:
            connections = psutil.net_connections()
            connection_count = len(connections)
            
            if connection_count > self.config['thresholds']['network_connections']:
                await self.create_event(
                    severity='medium',
                    category='network',
                    source='network_monitor',
                    description=f'High number of network connections: {connection_count}',
                    details={'connection_count': connection_count, 'threshold': self.config['thresholds']['network_connections']}
                )
        except Exception as e:
            self.logger.error(f"Network connections check failed: {e}")
    
    async def check_network_traffic(self):
        """Check network traffic patterns"""
        # In a real implementation, you would:
        # 1. Monitor network traffic logs
        # 2. Check for unusual traffic patterns
        # 3. Alert on potential DDoS attacks
        
        pass
    
    async def create_event(self, severity: str, category: str, source: str, description: str, details: Dict[str, Any]):
        """Create a security event"""
        event = SecurityEvent(
            id=f"evt_{int(time.time())}_{len(self.events)}",
            timestamp=datetime.now().isoformat(),
            severity=severity,
            category=category,
            source=source,
            description=description,
            details=details
        )
        
        self.events.append(event)
        self.logger.warning(f"🚨 Security event created: {event.id} - {description}")
        
        # Create alert if severity is high or critical
        if severity in ['high', 'critical']:
            await self.create_alert(event)
        
        # Save events
        self.save_events()
    
    async def create_alert(self, event: SecurityEvent):
        """Create a security alert"""
        alert = SecurityAlert(
            id=f"alert_{int(time.time())}_{len(self.alerts)}",
            event_id=event.id,
            timestamp=datetime.now().isoformat(),
            severity=event.severity,
            message=f"Security Alert: {event.description}",
            recipients=self.config['alerts']['email']['to_emails']
        )
        
        self.alerts.append(alert)
        self.logger.warning(f"🚨 Security alert created: {alert.id}")
    
    async def process_alerts(self):
        """Process pending alerts"""
        while self.running:
            try:
                pending_alerts = [alert for alert in self.alerts if not alert.sent]
                
                for alert in pending_alerts:
                    if self.config['alerts']['enabled']:
                        await self.send_alert(alert)
                        alert.sent = True
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Alert processing error: {e}")
                await asyncio.sleep(60)
    
    async def send_alert(self, alert: SecurityAlert):
        """Send security alert"""
        try:
            if self.config['alerts']['email']['enabled']:
                await self.send_email_alert(alert)
            
            if self.config['alerts']['webhook']['enabled']:
                await self.send_webhook_alert(alert)
                
        except Exception as e:
            self.logger.error(f"Failed to send alert {alert.id}: {e}")
    
    async def send_email_alert(self, alert: SecurityAlert):
        """Send email alert"""
        try:
            email_config = self.config['alerts']['email']
            
            msg = MimeMultipart()
            msg['From'] = email_config['from_email']
            msg['To'] = ', '.join(alert.recipients)
            msg['Subject'] = f"🚨 Ranqly Security Alert - {alert.severity.upper()}"
            
            # Create email body
            event = next((e for e in self.events if e.id == alert.event_id), None)
            
            body = f"""
Security Alert Details:

Severity: {alert.severity.upper()}
Time: {alert.timestamp}
Event ID: {alert.event_id}

Description:
{alert.message}

Event Details:
"""
            
            if event:
                body += f"""
Category: {event.category}
Source: {event.source}
Details: {json.dumps(event.details, indent=2)}
"""
            
            body += """

This is an automated security alert from the Ranqly monitoring system.

Please investigate and respond appropriately.

Best regards,
Ranqly Security Team
"""
            
            msg.attach(MimeText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            
            if email_config['username'] and email_config['password']:
                server.login(email_config['username'], email_config['password'])
            
            text = msg.as_string()
            server.sendmail(email_config['from_email'], alert.recipients, text)
            server.quit()
            
            self.logger.info(f"📧 Email alert sent: {alert.id}")
            
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}")
    
    async def send_webhook_alert(self, alert: SecurityAlert):
        """Send webhook alert"""
        try:
            webhook_config = self.config['alerts']['webhook']
            
            payload = {
                'alert_id': alert.id,
                'event_id': alert.event_id,
                'severity': alert.severity,
                'timestamp': alert.timestamp,
                'message': alert.message
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_config['url'],
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        self.logger.info(f"🔗 Webhook alert sent: {alert.id}")
                    else:
                        self.logger.error(f"Webhook alert failed: {response.status}")
        
        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {e}")
    
    def save_events(self):
        """Save events to file"""
        try:
            events_dir = Path("security/data")
            events_dir.mkdir(parents=True, exist_ok=True)
            
            events_file = events_dir / "security-events.json"
            
            # Keep only recent events
            cutoff_date = datetime.now() - timedelta(days=self.config['monitoring']['retention_days'])
            recent_events = [
                event for event in self.events
                if datetime.fromisoformat(event.timestamp) > cutoff_date
            ]
            
            with open(events_file, 'w') as f:
                json.dump([asdict(event) for event in recent_events], f, indent=2)
            
            self.events = recent_events
        
        except Exception as e:
            self.logger.error(f"Failed to save events: {e}")
    
    def load_events(self):
        """Load events from file"""
        try:
            events_file = Path("security/data/security-events.json")
            
            if events_file.exists():
                with open(events_file, 'r') as f:
                    events_data = json.load(f)
                
                self.events = [
                    SecurityEvent(**event_data) for event_data in events_data
                ]
                
                self.logger.info(f"📂 Loaded {len(self.events)} security events")
        
        except Exception as e:
            self.logger.error(f"Failed to load events: {e}")
    
    def get_security_dashboard(self) -> Dict[str, Any]:
        """Get security dashboard data"""
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Filter events by time
        recent_events = [
            event for event in self.events
            if datetime.fromisoformat(event.timestamp) > last_24h
        ]
        
        weekly_events = [
            event for event in self.events
            if datetime.fromisoformat(event.timestamp) > last_7d
        ]
        
        # Count by severity
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        for event in recent_events:
            severity_counts[event.severity] += 1
        
        # Count by category
        category_counts = {}
        for event in recent_events:
            category_counts[event.category] = category_counts.get(event.category, 0) + 1
        
        return {
            'summary': {
                'total_events_24h': len(recent_events),
                'total_events_7d': len(weekly_events),
                'open_events': len([e for e in self.events if e.status == 'open']),
                'resolved_events': len([e for e in self.events if e.status == 'resolved'])
            },
            'severity_breakdown': severity_counts,
            'category_breakdown': category_counts,
            'recent_events': [
                {
                    'id': event.id,
                    'timestamp': event.timestamp,
                    'severity': event.severity,
                    'category': event.category,
                    'description': event.description,
                    'status': event.status
                }
                for event in sorted(recent_events, key=lambda x: x.timestamp, reverse=True)[:10]
            ]
        }
    
    def generate_security_report(self, output_path: str = "security/reports/security-monitoring-report.json"):
        """Generate security monitoring report"""
        report = {
            'report_metadata': {
                'generated_at': datetime.now().isoformat(),
                'monitoring_period': f"{self.config['monitoring']['retention_days']} days",
                'total_events': len(self.events),
                'total_alerts': len(self.alerts)
            },
            'dashboard': self.get_security_dashboard(),
            'events': [asdict(event) for event in self.events],
            'alerts': [asdict(alert) for alert in self.alerts],
            'recommendations': self.generate_recommendations()
        }
        
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"📊 Security report generated: {output_path}")
        return report
    
    def generate_recommendations(self) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        # Analyze events for recommendations
        critical_events = [e for e in self.events if e.severity == 'critical']
        high_events = [e for e in self.events if e.severity == 'high']
        
        if critical_events:
            recommendations.append("Immediate attention required: Critical security events detected")
        
        if high_events:
            recommendations.append("High priority: Review and address high severity events")
        
        # Check for patterns
        system_events = [e for e in self.events if e.category == 'system']
        if len(system_events) > 10:
            recommendations.append("Consider upgrading system resources or optimizing application performance")
        
        service_events = [e for e in self.events if e.category == 'service']
        if len(service_events) > 5:
            recommendations.append("Review service health monitoring and implement better resilience")
        
        return recommendations

async def main():
    """Main function"""
    monitor = SecurityMonitor()
    
    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        print("\n🛑 Security monitoring stopped")
    except Exception as e:
        print(f"❌ Security monitoring failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
