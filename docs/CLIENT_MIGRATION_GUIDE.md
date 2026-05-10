# API Key Migration Guide for Billing Finance API Clients

## Important: API Authentication Update Coming

We are implementing enhanced security measures for the Billing Finance API on **May 10, 2026**. This guide explains what's changing and how to update your integration.

### Timeline

- **April 26 - May 9**: Deprecation notice period
- **May 10 onwards**: Production API key required
- **June 7**: Default key will no longer work (30-day grace period)

---

## What's Changing?

### Before (Current)
```
Base URL: https://billing-finance-ashy.vercel.app/api/invoices
Authentication: Optional (default key used if not provided)
Default Key: sk_live_invoices_default_key_change_in_production
```

### After (New)
```
Base URL: https://billing-finance-ashy.vercel.app/api/invoices
Authentication: Required (must provide valid production key)
Production Key: [Unique key provided to your organization]
```

---

## How to Migrate

### Step 1: Obtain Your Production API Key

1. Contact the Billing Finance team at support@example.com
2. Request your **production API key** (format: `sk_prod_*`)
3. You will receive:
   - Primary API key
   - (Optional) Secondary key for key rotation
   - Key documentation and management guidelines

### Step 2: Update Your Code

#### If Using cURL:

**Before:**
```bash
curl https://billing-finance-ashy.vercel.app/api/invoices \
  -H "Content-Type: application/json"
```

**After:**
```bash
curl https://billing-finance-ashy.vercel.app/api/invoices \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_prod_your_unique_key"
```

#### If Using JavaScript/Node.js:

**Before:**
```javascript
const response = await fetch('https://billing-finance-ashy.vercel.app/api/invoices', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**After:**
```javascript
const API_KEY = process.env.BILLING_API_KEY; // Store in env var!

const response = await fetch('https://billing-finance-ashy.vercel.app/api/invoices', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});
```

#### If Using Python:

**Before:**
```python
import requests

response = requests.get('https://billing-finance-ashy.vercel.app/api/invoices')
```

**After:**
```python
import requests

API_KEY = os.getenv('BILLING_API_KEY')  # Store in env var!

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://billing-finance-ashy.vercel.app/api/invoices',
    headers=headers
)
```

#### If Using Postman:

1. Open your Postman request
2. Click **Headers** tab
3. Add new header:
   - **Key**: `x-api-key`
   - **Value**: `sk_prod_your_unique_key`
4. (Optional) Use Postman environment variables to store the key securely

#### Using Bearer Token (Alternative):

Instead of `x-api-key` header, you can also use:

```bash
curl https://billing-finance-ashy.vercel.app/api/invoices \
  -H "Authorization: Bearer sk_prod_your_unique_key"
```

### Step 3: Store Your API Key Securely

**IMPORTANT**: Never commit API keys to version control!

#### Best Practices:

**Environment Variables** (Recommended)
```bash
# .env.local (never commit this file)
BILLING_API_KEY=sk_prod_your_unique_key

# In your code:
const apiKey = process.env.BILLING_API_KEY;
```

**Config Management**
- Use your platform's secret management (AWS Secrets Manager, Azure Key Vault, etc.)
- Use Vercel Environment Variables for production deployments
- Never log or display API keys

**Secrets Managers**
- 1Password, LastPass, etc. for team sharing
- HashiCorp Vault for enterprise
- GitHub Secrets for CI/CD

### Step 4: Test Your Changes

#### Quick Test:
```bash
# Test with your new API key
curl -H "x-api-key: sk_prod_your_unique_key" \
  https://billing-finance-ashy.vercel.app/api/invoices

# Should return: 200 OK with data
```

#### If You Get 401 Unauthorized:
- Double-check your API key is correct
- Verify you're using the right header (`x-api-key` or `Authorization: Bearer`)
- Confirm the key has not expired
- Contact support if the issue persists

### Step 5: Deploy to Production

1. Update your code with the new authentication
2. Set environment variables in your deployment platform
3. Deploy to staging first to test
4. Verify the API calls work in staging
5. Deploy to production

---

## FAQ

### Q: What happens if I don't update before June 7?
**A**: The default key will stop working. Your API calls will fail with 401 Unauthorized. You'll need to update and redeploy your application to fix this.

### Q: Will the API be down during the migration?
**A**: No. The API will continue to work with both the old default key and your new production key during the transition period (April 26 - June 7).

### Q: Can I use the old default key after June 7?
**A**: No. After June 7, only valid production API keys will work. You must migrate before that date.

### Q: Do I need to change my base URL?
**A**: No. The base URL remains the same: `https://billing-finance-ashy.vercel.app`

### Q: What header should I use: `x-api-key` or `Authorization: Bearer`?
**A**: Either works. Use whichever fits your application better. `x-api-key` is more explicit for API keys, while `Authorization: Bearer` is standard OAuth format.

### Q: Can I rotate my API key?
**A**: Yes. Contact support to rotate your key. We support multiple keys during rotation periods. You'll have a grace period to update your code before the old key expires.

### Q: What if I lose my API key?
**A**: Contact support immediately. We can revoke the old key and issue a new one. Use the new key in your code.

### Q: Is there a rate limit on API calls?
**A**: API key rate limiting may be implemented in the future. Currently, there are no per-key limits. Standard API rate limits apply (see API documentation).

### Q: How do I know if I'm using the deprecated key?
**A**: You'll receive a response header: `X-API-Key-Deprecated: true`. Update your code immediately when you see this header.

### Q: Can I test with the old default key first?
**A**: Yes, during the transition period (April 26 - June 7), both keys work. You'll see a deprecation warning with the old key. Use this time to test and deploy your changes.

---

## Troubleshooting

### Error: 401 Unauthorized

**Check:**
1. Is your API key in the request headers?
2. Is the key spelled correctly? (case-sensitive)
3. Is it in the right header (`x-api-key` or `Authorization: Bearer`)?
4. Has the key expired?
5. Is the key for the right environment?

**Example Fix:**
```bash
# Wrong - missing header
curl https://billing-finance-ashy.vercel.app/api/invoices

# Right - with header
curl -H "x-api-key: sk_prod_xxxxx" https://billing-finance-ashy.vercel.app/api/invoices
```

### Error: 500 Internal Server Error

This is a server error, not an authentication issue. 

**Check:**
1. Is the API service running? Check status page
2. Are you sending valid JSON in the request body?
3. Is your request missing required fields?

**Contact Support** if the error persists

### Error: Connection Refused

The API service may be temporarily unavailable.

**Check:**
1. Can you ping the domain? `ping billing-finance-ashy.vercel.app`
2. Check the status page: https://status.example.com
3. Try again in a few minutes

**Contact Support** if the issue persists

---

## Support

### Need Help?

- **Email**: support@example.com
- **Slack**: #billing-api-support
- **Docs**: https://docs.example.com/billing-api
- **Status**: https://status.example.com

### Contact Information

- Response time: Within 2 hours (business hours)
- Emergency support: On-call team available 24/7

---

## Additional Resources

- [API Documentation](https://docs.example.com/api)
- [Authentication Guide](https://docs.example.com/auth)
- [Best Practices Guide](https://docs.example.com/best-practices)
- [API Error Reference](https://docs.example.com/errors)
- [Rate Limiting](https://docs.example.com/rate-limiting)

---

## Timeline Summary

| Date | Event | Action Required |
|------|-------|-----------------|
| April 26 | Migration period begins | Obtain production key |
| April 26 - May 9 | Both keys work (grace period) | Update your code |
| May 10 | Default key deprecated in prod | Deploy your changes |
| May 10 - June 7 | Default key still works (30 days) | Complete deployment |
| June 7 | Default key disabled | Must use production key |

---

**Last Updated**: 2026-05-10
**Questions?** Contact support@example.com
