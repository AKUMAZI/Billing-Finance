# API Key Security Implementation - Testing Guide

## Phase 6: Deployment to Staging & Comprehensive Testing

### Pre-Deployment Checklist

- [ ] All code changes reviewed and approved
- [ ] All API routes updated with new authentication module
- [ ] Audit logging module created and integrated
- [ ] Documentation updated and reviewed
- [ ] Team trained on new procedures
- [ ] Staging environment prepared
- [ ] Monitoring/alerting configured
- [ ] Database backups current

### Testing Scenarios

#### 1. Valid Primary Key Tests

**Test Case 1.1**: Valid key in x-api-key header
```
Endpoint: GET /api/invoices
Headers:
  x-api-key: [VALID_PRIMARY_KEY]
Expected: 200 OK, returns data
```

**Test Case 1.2**: Valid key in Authorization Bearer header
```
Endpoint: GET /api/invoices
Headers:
  Authorization: Bearer [VALID_PRIMARY_KEY]
Expected: 200 OK, returns data
```

#### 2. Invalid Key Tests

**Test Case 2.1**: Invalid API key
```
Endpoint: GET /api/invoices
Headers:
  x-api-key: invalid_key_12345
Expected: 401 Unauthorized, error message
Audit Log: api_key_validation_failure recorded
```

**Test Case 2.2**: Missing API key
```
Endpoint: GET /api/invoices
Headers: (none)
Expected: 401 Unauthorized
Audit Log: api_key_validation_failure recorded
```

**Test Case 2.3**: Malformed Authorization header
```
Endpoint: GET /api/invoices
Headers:
  Authorization: InvalidFormat [KEY]
Expected: 401 Unauthorized
```

#### 3. Legacy Key Tests (During Transition)

**Test Case 3.1**: Legacy key acceptance with warning
```
Endpoint: GET /api/invoices
Headers:
  x-api-key: sk_live_invoices_default_key_change_in_production
Expected: 200 OK
Response Headers:
  X-API-Key-Deprecated: true
  X-API-Key-Deprecation-Date: 2026-05-10
Audit Log: api_key_validation_success (deprecated=true)
```

#### 4. Secondary Key Tests (Rotation Period)

**Test Case 4.1**: Secondary key works during rotation
```
Endpoint: GET /api/invoices
Headers:
  x-api-key: [VALID_SECONDARY_KEY]
Expected: 200 OK, returns data
Audit Log: api_key_validation_success (key_type=secondary)
```

#### 5. All Endpoints Tests

Run the following tests against each endpoint:
- `/api/invoices` (POST, GET, PATCH)
- `/api/bills` (GET, POST)
- `/api/bills/[billId]` (GET, PUT, DELETE)
- `/api/bills/[billId]/audit` (GET)
- `/api/bills/[billId]/claim` (PATCH)
- `/api/patients` (GET)
- `/api/audit` (POST)

Each endpoint should:
- Accept valid primary key
- Accept valid secondary key (if configured)
- Accept legacy key with deprecation warning (if configured)
- Reject invalid keys with 401
- Reject missing keys with 401

#### 6. Audit Logging Tests

**Test Case 6.1**: Check audit logs for successful auth
```bash
# Query audit logs for successful authentications
# Should see entries with: action="api_key_validation_success", success=true
```

**Test Case 6.2**: Check audit logs for failed auth
```bash
# Query audit logs for failed authentications
# Should see entries with: action="api_key_validation_failure", success=false
```

**Test Case 6.3**: Check audit logs for deprecated key usage
```bash
# Query audit logs for legacy key usage
# Should see entries with: key_type="legacy", deprecated=true
```

#### 7. Performance Tests

**Test Case 7.1**: Validate API key validation latency < 5ms
```bash
# Run load test with 1000 requests
# Measure average response time
# Should be < 5ms addition from validation
```

**Test Case 7.2**: Validate under load (100 req/sec)
```bash
# Run sustained load test
# Monitor error rates
# Should remain < 0.1% error rate
```

#### 8. Error Handling Tests

**Test Case 8.1**: Non-JSON body doesn't crash
```
Endpoint: POST /api/invoices
Headers: x-api-key: [VALID_KEY]
Body: invalid json {]
Expected: 400 Bad Request (or specific error)
```

**Test Case 8.2**: Rate limiting (if implemented)
```
Endpoint: Any endpoint
Action: Send 1000 requests in 1 second
Expected: 429 Too Many Requests after threshold
```

### Staging Deployment Steps

1. **Deploy Code to Staging**
   ```bash
   # Create feature branch
   git checkout -b feature/api-key-security
   
   # Commit all changes
   git add -A
   git commit -m "feat: implement secure API key management"
   
   # Push to staging
   git push origin feature/api-key-security
   ```

2. **Configure Staging Environment Variables**
   - Add `INVOICES_API_KEY_PROD` with test key
   - Add `INVOICES_API_KEY_SECONDARY` (optional for testing rotation)
   - Add `INVOICES_API_KEY_LEGACY` with default key
   - Set `API_KEY_USAGE_LOG_ENABLED=true`

3. **Verify Staging Deployment**
   ```bash
   # Check deployment health
   curl -I https://staging-app.vercel.app/api/health
   
   # Test without key
   curl https://staging-app.vercel.app/api/invoices
   # Should return 401
   
   # Test with key
   curl -H "x-api-key: test_key_xyz" https://staging-app.vercel.app/api/invoices
   # Should return 200 or proper error based on key validity
   ```

4. **Run Test Suite**
   ```bash
   # Run all test cases
   npm run test:api-auth
   ```

5. **Monitor Staging**
   - Check error rates
   - Monitor response times
   - Review audit logs
   - Verify no sensitive data in logs

### Staging Sign-Off Checklist

- [ ] All test cases passing
- [ ] Error rates < 0.1%
- [ ] Average response time acceptable
- [ ] No sensitive data in logs
- [ ] Deprecation warnings appearing for legacy keys
- [ ] Audit logs recording correctly
- [ ] Team ready for production

### Rollback Plan

If staging tests fail:
1. Revert the feature branch
2. Fix identified issues
3. Re-test in staging
4. Only proceed to production when all tests pass

### Documentation to Update Before Production

- [ ] API documentation - add authentication section
- [ ] Client migration guide - provide step-by-step instructions
- [ ] Environment variables documentation
- [ ] Audit logging documentation
- [ ] Troubleshooting guide
- [ ] Team runbooks for common issues

---

## Next Steps

Once staging sign-off is complete, proceed to Phase 7: Production Deployment & Monitoring
