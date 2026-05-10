# API Key Setup & Management Guide

## Overview
This guide outlines the process for setting up, managing, and rotating API keys for the billing-finance application.

## Phase 2: Secret Management Infrastructure

### Step 1: Create Environment Variables in Vercel

Navigate to your Vercel Project Settings → Environment Variables and create the following:

#### Production Environment Variables

| Variable Name | Description | Status | Notes |
|---|---|---|---|
| `INVOICES_API_KEY_PROD` | Primary production API key for invoices | Required | Rotate every 90 days |
| `INVOICES_API_KEY_SECONDARY` | Secondary key for rotation period | Optional | Use during key rotation |
| `INVOICES_API_KEY_LEGACY` | Legacy key for backward compatibility | Optional | Deprecated, 28-day transition period |
| `BILLS_API_KEY_PROD` | API key for bills endpoints | Required | Rotate every 90 days |
| `AUDIT_API_KEY_PROD` | API key for audit logging | Required | Must rotate with billing keys |
| `API_KEY_ROTATION_ENABLED` | Enable key rotation feature | Optional | Default: true |
| `API_KEY_EXPIRATION_DAYS` | Key expiration period | Optional | Default: 90 |
| `REQUIRE_API_KEY` | Enforce API key requirement | Optional | Default: true |
| `API_KEY_USAGE_LOG_ENABLED` | Enable detailed logging | Optional | Default: true |

### Step 2: Access Control Configuration

1. **RBAC Setup in Vercel**
   - Configure team members with appropriate roles
   - Restrict secret creation to DevOps/Infrastructure team only
   - Enable read-only access for developers

2. **Audit & Logging**
   - Enable Vercel audit logs for all secret access
   - Set up alerts for unauthorized access attempts
   - Review access logs weekly

3. **Two-Factor Authentication**
   - Require 2FA for all team members accessing secrets
   - Enforce strong password policies

### Step 3: Key Generation Standards

#### Key Format
```
sk_prod_<service>_<version>_<random_string>
```

Example: `sk_prod_invoices_v1_7k9x2m3n4p5q6r7s8t9u`

#### Generation Process
1. Use cryptographically secure random generation
2. Minimum 32 characters (after prefix)
3. Include versioning for tracking
4. Document key creation date and creator

### Step 4: Deployment Verification

Before moving to Phase 3, verify:
- [ ] All environment variables created in Vercel
- [ ] Access controls configured
- [ ] 2FA enabled for team members
- [ ] Audit logging enabled
- [ ] Documentation updated
- [ ] Team trained on new procedures

## Implementation Checklist

- [ ] Variables configured in Vercel
- [ ] RBAC policies defined
- [ ] Audit logging enabled
- [ ] 2FA requirements enforced
- [ ] Rotation schedule documented
- [ ] Incident response plan created
- [ ] Team aligned on timeline
- [ ] Client communication drafted

## Next Steps
Proceed to Phase 3: Create Centralized Authentication Module
