# Production Deployment Runbook - API Key Security Implementation

## Phase 7: Production Deployment & Monitoring

### Pre-Deployment Verification

**Date of Deployment**: [TO BE DETERMINED]
**Deployment Window**: 02:00 - 04:00 UTC (off-peak hours)
**Team Lead**: [TO BE ASSIGNED]
**On-Call Support**: [TO BE ASSIGNED]

#### Final Checklist

- [ ] Staging sign-off completed and approved
- [ ] All stakeholders notified (14+ days prior)
- [ ] Client communication sent
- [ ] Rollback plan documented and tested
- [ ] Team trained on procedures
- [ ] Monitoring/alerting configured
- [ ] Database backups created
- [ ] Incident response team available
- [ ] Communication channels set up (Slack, war room link)
- [ ] Deployment script reviewed and tested

### Step-by-Step Deployment Process

#### Step 1: Pre-Deployment (T-30 minutes)

1. **Notify Team**
   - Post in #incidents channel
   - Message on-call team members
   - Confirm all team members are available

2. **Verify All Systems**
   ```bash
   # Verify Vercel deployment status
   vercel status
   
   # Verify database connectivity
   # Verify external service availability
   # Verify monitoring systems online
   ```

3. **Create Deployment Issue/Ticket**
   - Document timeline
   - Assign to deployment lead
   - Add link to incident channel

#### Step 2: Code Deployment (T-0 minutes)

1. **Push Code to Main Branch**
   ```bash
   # Ensure you're on the main branch
   git checkout main
   git pull origin main
   
   # Verify code is present (from staging)
   git log --oneline -5
   ```

2. **Trigger Vercel Deployment**
   - Push to main branch (automatic)
   - Or manually trigger via Vercel dashboard
   - Monitor deployment progress

3. **Verify Deployment**
   ```bash
   # Check deployment status
   vercel deployments list
   
   # Wait for deployment to complete (usually 2-5 min)
   ```

#### Step 3: Configure Environment Variables (T+5 minutes)

1. **Add Production API Keys in Vercel Settings**
   - Navigate to: Project Settings → Environment Variables
   - Add for Production environment only:
     
     ```
     INVOICES_API_KEY_PROD = [SECURE_PRODUCTION_KEY]
     INVOICES_API_KEY_SECONDARY = [SECURE_SECONDARY_KEY]  (optional)
     INVOICES_API_KEY_LEGACY = sk_live_invoices_default_key_change_in_production
     BILLS_API_KEY_PROD = [SECURE_PRODUCTION_KEY]
     AUDIT_API_KEY_PROD = [SECURE_AUDIT_KEY]
     ```

2. **Verify Variables are Set**
   ```bash
   # List environment variables (does not show values)
   vercel env list --environment production
   ```

3. **Note**: Do NOT include these in version control

#### Step 4: Redeploy with Environment Variables (T+10 minutes)

1. **Trigger Redeployment**
   ```bash
   # Redeploy to ensure env variables are loaded
   vercel deploy --prod
   ```

2. **Verify Deployment Success**
   - Check Vercel dashboard
   - Wait for "Ready" status

#### Step 5: Smoke Testing (T+15 minutes)

Run these critical tests to verify everything is working:

**Test 1: API without key (should fail)**
```bash
curl -X GET https://billing-finance-ashy.vercel.app/api/invoices
# Expected: 401 Unauthorized
```

**Test 2: API with invalid key (should fail)**
```bash
curl -X GET https://billing-finance-ashy.vercel.app/api/invoices \
  -H "x-api-key: invalid_key_xyz"
# Expected: 401 Unauthorized
```

**Test 3: API with valid key (should succeed)**
```bash
curl -X GET https://billing-finance-ashy.vercel.app/api/invoices \
  -H "x-api-key: [PRODUCTION_KEY]"
# Expected: 200 OK with data
```

**Test 4: Check all endpoints respond**
```bash
# Test each endpoint
curl -I https://billing-finance-ashy.vercel.app/api/bills \
  -H "x-api-key: [PRODUCTION_KEY]"
  
curl -I https://billing-finance-ashy.vercel.app/api/audit \
  -H "x-api-key: [PRODUCTION_KEY]"
  
curl -I https://billing-finance-ashy.vercel.app/api/patients \
  -H "x-api-key: [PRODUCTION_KEY]"
```

**All tests MUST pass before proceeding**

#### Step 6: Monitor Metrics (T+20 to T+60 minutes)

1. **Check Error Rates**
   - Target: < 0.1% error rate
   - Alert if > 1% errors

2. **Check Response Times**
   - Target: < 200ms average
   - Alert if > 500ms average

3. **Check Authentication Failures**
   - Expected increase in 401s initially (client keys not updated)
   - Should stabilize after 1-2 hours

4. **Check Audit Logs**
   - Verify logs are being recorded
   - Look for any suspicious patterns
   - Confirm no sensitive data in logs

5. **Review Alerts**
   - Check Vercel deployment health
   - Check monitoring dashboard
   - Monitor external service health

#### Step 7: Post-Deployment Notification (T+60 minutes)

1. **Confirm Success**
   ```bash
   # All smoke tests passing?
   # Error rates normal?
   # Audit logs recording?
   # Metrics looking good?
   ```

2. **Notify Stakeholders**
   - Post deployment success to #incidents
   - Update ticket/issue
   - Notify PMs and team leads

3. **Confirm with Clients** (Optional)
   - Send "deployment complete" notification
   - Provide support contact information
   - Link to migration guide

### If Issues Occur - Rollback Procedure

#### Immediate Steps (within 30 minutes of issue detection)

1. **Call Incident Meeting**
   - Activate war room
   - Gather core team
   - Assess severity

2. **Stop New Deployments**
   - Prevent any additional changes
   - Freeze environment variable changes

3. **Assess Issue Severity**
   - Is API completely down? → CRITICAL
   - Are some endpoints broken? → HIGH
   - Are authentication failures elevated? → MEDIUM
   - Are there suspicious logs? → MEDIUM

#### Rollback Procedure (if needed)

**Option A: Revert Code Only** (fastest)
```bash
# Revert to previous commit
git revert HEAD --no-edit
git push origin main

# Monitor Vercel auto-deployment
# Should take 2-5 minutes
```

**Option B: Remove Environment Variables**
```bash
# If issue is related to new env vars:
# Go to Vercel Settings → Environment Variables
# Remove production keys
# Redeploy

# API will fall back to default behavior
```

**Option C: Full Rollback to Previous Deployment**
```bash
# Via Vercel dashboard:
# 1. Go to Deployments tab
# 2. Find previous stable deployment
# 3. Click three dots → Promote to Production

# Should be instant
```

#### After Rollback

1. **Verify Rollback Success**
   - Run smoke tests again
   - Check error rates return to normal
   - Verify APIs are responding

2. **Post-Mortem**
   - Document what went wrong
   - Identify root cause
   - Create fix plan
   - Schedule re-deployment when ready

3. **Notify Stakeholders**
   - Explain what happened
   - Provide status update
   - Outline next steps

### Post-Deployment Monitoring (24-48 hours)

#### Continued Monitoring

1. **Hour 1-6**: Every 30 minutes
   - Check error rates
   - Monitor response times
   - Review audit logs
   - Confirm no security issues

2. **Hour 6-24**: Every 2 hours
   - Continue monitoring metrics
   - Review client adoption
   - Check for support tickets

3. **Day 2-7**: Daily review
   - Monitor legacy key usage
   - Verify adoption of new key
   - Check for any remaining issues

#### Success Criteria

- ✓ Zero deployment-related downtime
- ✓ Error rates < 0.1%
- ✓ Response times normal (< 200ms)
- ✓ Audit logs recording correctly
- ✓ No sensitive data in logs
- ✓ No security incidents
- ✓ Team confidence high

### Documentation & Communication

#### Client Migration Support

1. **Provide Support Resources**
   - Detailed migration guide (already created)
   - API documentation updates
   - Code examples
   - FAQ document

2. **Support Channels**
   - Email support: support@example.com
   - Slack workspace (if applicable)
   - Documentation site
   - Support ticket system

3. **Track Client Adoption**
   - Monitor new key usage
   - Track legacy key deprecation
   - Identify clients needing help

#### Team Documentation

1. **Update Internal Docs**
   - Deployment procedure
   - Key management process
   - Troubleshooting guide
   - On-call runbook

2. **Training Materials**
   - Recorded training session
   - Written procedures
   - FAQ document
   - Common issues and solutions

### Long-Term Monitoring (Week 2+)

#### Weekly Tasks

1. **Review Metrics**
   - API usage patterns
   - Error rates by endpoint
   - Performance trends
   - Client adoption progress

2. **Audit Log Review**
   - Check for suspicious activity
   - Monitor failed authentication attempts
   - Verify deprecated key usage
   - Look for patterns

3. **Team Standup**
   - Discuss any issues
   - Plan for key rotation
   - Review client feedback
   - Identify improvements

#### Monthly Tasks

1. **Security Review**
   - Audit all API keys in use
   - Verify RBAC configuration
   - Check access logs
   - Review incident logs

2. **Performance Review**
   - Analyze performance trends
   - Identify optimization opportunities
   - Plan resource allocation
   - Document lessons learned

3. **Client Outreach**
   - Check in with major clients
   - Verify successful migration
   - Gather feedback
   - Identify pain points

### Escalation Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [TBD] | [TBD] | [TBD] |
| DevOps Lead | [TBD] | [TBD] | [TBD] |
| Backend Lead | [TBD] | [TBD] | [TBD] |
| Security Lead | [TBD] | [TBD] | [TBD] |

### Additional Resources

- Vercel Documentation: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Rollback Guide: [Internal Wiki]
- On-Call Procedures: [Internal Wiki]
- Incident Response: [Internal Wiki]

---

**Deployment Status**: Ready for Production
**Last Updated**: 2026-05-10
**Next Review**: Post-deployment debrief
