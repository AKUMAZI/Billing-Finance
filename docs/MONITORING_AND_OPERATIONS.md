# Monitoring & Operations Guide - API Key Security System

## Overview

This guide covers ongoing monitoring, maintenance, and operations for the API key security system in production.

---

## Monitoring Dashboard

### Key Metrics to Monitor

#### 1. Authentication Health
- **Successful API Key Validations**: % of requests with valid keys
  - Target: > 99.9%
  - Alert threshold: < 99%

- **Failed API Key Validations**: % of requests with invalid/missing keys
  - Expected: 0-1% during transition period
  - Target post-migration: < 0.1%
  - Alert threshold: > 1%

- **Legacy Key Usage**: % of requests using deprecated key
  - Expected: High initially, declining over time
  - Target: 0% after June 7, 2026
  - Alert threshold: Still high after June 7

#### 2. Performance Metrics
- **Validation Latency**: Time to validate API key
  - Target: < 5ms (should be <1ms typically)
  - Alert threshold: > 10ms
  - Track: p50, p95, p99 percentiles

- **Request Latency**: Overall request response time
  - Target: < 200ms average
  - Alert threshold: > 500ms
  - Monitor per endpoint

#### 3. Security Metrics
- **Suspicious Activity**: Failed auth attempts from same IP
  - Alert: > 10 failures in 5 minutes
  - Alert: Pattern changes detected

- **Key Exposure Events**: (if any)
  - Alert immediately: Key found in logs, commits, etc.
  - Action: Revoke immediately

- **Unauthorized Access Attempts**: 
  - Track attempts by endpoint
  - Look for brute force patterns

#### 4. Business Metrics
- **Client API Key Migration Progress**
  - % of clients using new production key
  - Target: 100% by June 7
  - Track by client/organization

- **API Availability**
  - Target: 99.99% uptime
  - Alert threshold: Any downtime

---

## Monitoring Setup

### Vercel Monitoring

1. **Enable Vercel Analytics**
   - Project Settings → Analytics
   - Monitor deployments
   - Track error rates

2. **View Logs**
   ```bash
   # Using Vercel CLI
   vercel logs --follow
   
   # Filter by error level
   vercel logs --level error
   ```

3. **Monitoring Alerts**
   - CPU usage alerts
   - Memory usage alerts
   - Deployment failures
   - Critical errors

### Application Logging

#### Console Logs (Development/Staging)
```javascript
// Audit logs are automatically logged to console
// Example output:
// [audit-info] api_key_validation_success on /api/invoices - Key: abc1 (primary)
```

#### Structured Logging (Production)
Logs are output in JSON format:
```json
{
  "timestamp": "2026-05-10T15:30:45.123Z",
  "event_id": "evt_1715347845_abc123",
  "level": "info",
  "action": "api_key_validation_success",
  "route": "/api/invoices",
  "method": "POST",
  "key_identifier": "abc1",
  "key_type": "primary",
  "success": true,
  "response_time_ms": 2
}
```

### Integration with External Monitoring Services

#### Option 1: Vercel Edge Logs (Recommended)
- Built into Vercel
- Automatic collection
- 30-day retention
- No additional setup required

#### Option 2: Cloud Logging Services

**AWS CloudWatch**
```javascript
// Update lib/audit-logger.ts to send to CloudWatch
const cloudwatch = new AWS.CloudWatch();
// Implement custom metric publishing
```

**Google Cloud Logging**
```javascript
// Update lib/audit-logger.ts to send to Cloud Logging
const logging = new LoggingClass();
// Implement custom log sending
```

**Datadog**
```javascript
// Update lib/audit-logger.ts to send to Datadog
const statsd = new StatsD();
statsd.gauge('api.auth.validation', 1);
```

**Sentry (Error Tracking)**
```javascript
import * as Sentry from "@sentry/nextjs";

// Already integrated in Next.js 16
// Errors automatically captured
```

---

## Alerting Rules

### Critical Alerts (Page On-Call)

1. **API Service Down**
   - Condition: Error rate > 50% for 5 minutes
   - Action: Page on-call engineer immediately

2. **Authentication System Failure**
   - Condition: Auth validation latency > 100ms
   - Action: Page on-call engineer

3. **Security Incident**
   - Condition: API key found in commit/logs
   - Action: CRITICAL - Page multiple team members
   - Action: Immediate key revocation

### High Priority Alerts (Within 15 minutes)

1. **Error Rate Spike**
   - Condition: Error rate > 10% for 5 minutes
   - Action: Notify on-call engineer

2. **Legacy Key Overuse**
   - Condition: Legacy key > 50% of requests post-cutoff date
   - Action: Notify team, prepare outreach

3. **Validation Performance Degradation**
   - Condition: Latency > 50ms for 5 minutes
   - Action: Investigate and notify

### Medium Priority Alerts (Investigate within hours)

1. **Elevated 401 Rates**
   - Condition: 401 rate > 5% for 10 minutes
   - Action: Check client migrations, review logs

2. **Suspicious Activity Pattern**
   - Condition: Brute force attempt detected
   - Action: Review logs, consider rate limiting

3. **Memory/CPU Spikes**
   - Condition: Usage > 80% for sustained period
   - Action: Monitor, investigate cause

---

## Daily Operations

### Daily Checklist (10 minutes)

```
[ ] Check error rates in dashboard
[ ] Review overnight logs for issues
[ ] Check for any critical alerts triggered
[ ] Verify all API endpoints responding
[ ] Confirm backups completed successfully
```

### Daily Commands

```bash
# Check API health
curl -I https://billing-finance-ashy.vercel.app/api/invoices \
  -H "x-api-key: test_key"

# Check error logs
vercel logs --level error --since "1 hour ago"

# Check deployment status
vercel status

# View recent deployments
vercel deployments list | head -5
```

---

## Weekly Operations

### Weekly Review (30 minutes)

1. **Performance Analysis**
   - Review performance trends
   - Identify any degradation
   - Plan optimization if needed

2. **Security Review**
   - Review failed auth attempts
   - Check for suspicious patterns
   - Verify no keys leaked

3. **Migration Progress**
   - Check % of clients migrated
   - Identify clients needing help
   - Plan outreach if needed

4. **Team Sync**
   - Discuss any issues
   - Share metrics/status
   - Plan ahead

### Weekly Commands

```bash
# Export audit logs for the week
# Update lib/audit-logger.ts to include export functionality
# curl -H "x-admin-key: admin_key" /api/admin/audit/export

# Check key rotation schedule
# List all active API keys and their creation dates

# Review client adoption
# Query database for client key update timestamps
```

---

## Monthly Operations

### Monthly Security Audit (2 hours)

1. **Key Audit**
   - List all API keys in use
   - Verify expiration dates
   - Identify unused keys for cleanup
   - Verify key formats

2. **Access Audit**
   - Review who has access to production secrets
   - Verify RBAC configuration
   - Check for orphaned access
   - Update access list

3. **Compliance Review**
   - Verify audit log retention (90+ days)
   - Check for compliance violations
   - Review incident logs
   - Prepare compliance report

4. **Performance Audit**
   - Analyze monthly performance trends
   - Identify optimization opportunities
   - Plan capacity improvements
   - Document findings

### Monthly Commands

```bash
# Audit active API keys
vercel env list --environment production

# Review team access
# Check Vercel dashboard for team members with secret access

# Export comprehensive audit logs
# Backup to secure storage for compliance

# Run security scan
# Check for secrets in code/logs
```

---

## Incident Response

### Incident Categories

#### Category 1: API Service Incident
- API completely down or major degradation
- Response time: Page on-call immediately
- Severity: CRITICAL

#### Category 2: Authentication Incident
- Auth system failure or bypass
- Response time: Page on-call immediately
- Severity: CRITICAL

#### Category 3: Security Incident
- Key compromise suspected
- API key leaked
- Unauthorized access detected
- Response time: Immediate
- Severity: CRITICAL

#### Category 4: Performance Incident
- High latency or error rates
- Response time: Within 15 minutes
- Severity: HIGH

#### Category 5: Operational Incident
- Client complaints, migration issues
- Response time: Within 1 hour
- Severity: MEDIUM

### Incident Response Steps

1. **Alert Triggered**
   - Page on-call team
   - Post to incident channel
   - Start incident tracking

2. **Initial Response (5 minutes)**
   - Gather basic facts
   - Assess severity
   - Start collecting logs
   - Open war room if needed

3. **Investigation (Ongoing)**
   - Review error logs
   - Check metrics
   - Review recent changes
   - Test API endpoints

4. **Resolution**
   - Implement fix OR rollback
   - Test fix thoroughly
   - Deploy if needed
   - Monitor closely

5. **Post-Incident**
   - Document what happened
   - Root cause analysis
   - Action items to prevent recurrence
   - Post-mortem (24-48 hours later)

### Key Revocation (If Compromised)

If an API key is compromised:

1. **Immediate Actions**
   - Revoke the key immediately
   - Notify affected clients
   - Generate new key for client
   - Update documentation

2. **Post-Incident**
   - Review logs for misuse
   - Audit for unauthorized access
   - Generate incident report
   - Implement preventative measures

---

## Maintenance Windows

### Planned Maintenance

**Frequency**: Monthly (if needed)
**Duration**: 30 minutes
**Notification**: 48 hours advance notice

Process:
1. Send client notification (48 hours prior)
2. Prepare rollback plan
3. Execute maintenance
4. Verify all systems
5. Send completion notification

### Emergency Maintenance

Can be performed immediately if:
- Security issue detected
- Data corruption found
- Critical service failure
- Compliance requirement

---

## Key Rotation Process

### Standard Rotation (Every 90 days)

1. **Preparation** (Day 1)
   - Notify clients (2 weeks prior)
   - Generate new production key
   - Schedule rotation window

2. **Pre-Rotation** (Day 1)
   - Add new key as "secondary" in environment
   - Test with new key in staging

3. **During Rotation** (Day 1)
   - Update production environment
   - Redeploy application
   - Monitor metrics closely
   - Verify old key still works

4. **Grace Period** (Days 2-14)
   - Clients update their code
   - Monitor key usage
   - Support any issues

5. **Final Rotation** (Day 15)
   - Remove old key from environment
   - Monitor for failures
   - Send completion notification
   - Document completion

### Emergency Key Rotation

If key is compromised:
1. Immediately revoke current key
2. Generate new production key
3. Update environment variables
4. Redeploy application
5. Notify all clients
6. Monitor for issues
7. Document incident

---

## Backup & Disaster Recovery

### Backup Strategy

1. **Audit Logs**
   - Backup daily to S3/GCS
   - Retention: 90+ days
   - Encryption: AES-256

2. **Configuration**
   - Backup environment variables
   - Backup to secure vault
   - Retention: Indefinite
   - Encryption: Required

3. **Code/Deployment**
   - Git repository (already backed up)
   - Vercel automatic backups
   - Database snapshots (if using DB)

### Disaster Recovery Plan

**Scenario**: Complete service loss

1. **Assessment** (5 minutes)
   - Confirm service is down
   - Check status page
   - Gather initial info

2. **Communication** (10 minutes)
   - Notify customers
   - Post status update
   - Activate war room

3. **Recovery** (30 minutes)
   - Restore from previous deployment
   - Restore environment variables
   - Verify data integrity
   - Bring service back online

4. **Verification** (15 minutes)
   - Run smoke tests
   - Verify all endpoints
   - Check data consistency
   - Monitor metrics

5. **Post-Recovery**
   - Root cause analysis
   - Incident report
   - Preventative measures
   - Customer communication

---

## Documentation & Knowledge Base

### Key Documentation
- API authentication guide
- Client migration guide
- Operations runbook
- Troubleshooting guide
- Key management procedures
- Disaster recovery plan

### Update Frequency
- API Changes: Immediately
- Process Changes: Weekly
- Best Practices: Monthly
- Training Materials: Quarterly

### Where to Find Docs
- Internal Wiki: [link]
- GitHub Repository: `/docs` folder
- Knowledge Base: [link]
- Runbooks: [link]

---

## Team Training

### Initial Training (Required)
All team members must complete:
- Authentication system overview (30 min)
- Operations procedures (30 min)
- Incident response (30 min)
- Key management (15 min)

### Ongoing Training
- Monthly all-hands on security practices
- Quarterly incident simulation drills
- Annual security certification refresh

### On-Call Training
New on-call engineers must:
- Review full runbook
- Perform shadow shift
- Run incident simulation
- Get sign-off from lead

---

## Metrics Dashboard (Sample)

```
┌─────────────────────────────────────────────────────┐
│         API Key Security System Metrics              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Auth Success Rate:        99.97% ✓                │
│  Error Rate:               0.03%  ✓                │
│  Latency (avg):            2.3ms  ✓                │
│  Latency (p95):            5.1ms  ✓                │
│                                                     │
│  Legacy Key Usage:         12%    (Target: 0%)    │
│  Clients Migrated:         88%    (Target: 100%)  │
│                                                     │
│  Security Incidents:       0      ✓                │
│  Failed Rollbacks:         0      ✓                │
│  Uptime:                   99.99% ✓                │
│                                                     │
└─────────────────────────────────────────────────────┘

Updated: 2026-05-10 15:30 UTC
Status: All systems healthy
```

---

## Contacts & Escalation

### On-Call Escalation

**Level 1**: On-Call Engineer
- Available: Always
- Response: < 5 minutes
- Can: Troubleshoot, monitor, communicate

**Level 2**: Backend Lead
- Available: 8am-6pm
- Response: < 30 minutes
- Can: Authorize rollbacks, approve changes

**Level 3**: Security Lead
- Available: 8am-6pm, on-call for security
- Response: < 1 hour
- Can: Authorize key revocations, security decisions

**Level 4**: VP Engineering
- Available: 8am-6pm
- Response: < 2 hours
- Can: Authorize emergency actions, customer communications

### Communication Channels

- **Slack**: #incidents
- **War Room**: [link]
- **Phone Tree**: [setup in PagerDuty or similar]
- **Email**: incidents@example.com

---

## Success Metrics (Post-Implementation)

### Achieved
- ✓ All API endpoints require valid API key
- ✓ Default hardcoded key completely removed
- ✓ Comprehensive audit logging implemented
- ✓ Security monitoring in place
- ✓ Team trained on procedures
- ✓ Documentation complete

### Target Outcomes
- 99.9%+ auth success rate
- 0% security incidents
- 100% client migration by June 7
- < 5ms validation latency
- < 100ms endpoint latency

---

**Last Updated**: 2026-05-10
**Next Review**: 2026-05-24 (two weeks post-deployment)
**Owner**: [DevOps/Backend Lead]
