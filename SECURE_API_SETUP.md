# 🔐 Secure API Key Setup Guide

This guide will help you move your Anthropic API key from the client-side to a secure server-side implementation.

## 🚨 Security Issue Fixed

**Problem**: The `VITE_ANTHROPIC_API_KEY` was exposed on the client-side, making it visible to anyone who inspects your app's code.

**Solution**: API keys are now stored securely in the database and accessed only through server-side Edge Functions.

## 📋 Setup Steps

### 1. Deploy the Edge Function

Run the deployment script:

```bash
./scripts/deploy-edge-functions.sh
```

This will deploy the `anthropic-proxy` Edge Function to your Supabase project.

### 2. Set Up the Database

Run the SQL script in your Supabase Dashboard > SQL Editor:

```sql
-- Copy and paste the contents of scripts/setup-api-keys.sql
-- Replace 'YOUR_ANTHROPIC_API_KEY_HERE' with your actual API key
```

### 3. Update Your Environment Variables

**Remove** the following from your `.env` file:
```bash
# ❌ Remove this line - it's no longer needed
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

**Keep** these (they're still needed):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Test the Implementation

1. Try generating a weekly report
2. Check the browser's Network tab to ensure API calls go to your Edge Function
3. Verify that no API keys are visible in the client-side code

## 🏗️ Architecture Overview

### Before (Insecure)
```
Client → Anthropic API (with exposed API key)
```

### After (Secure)
```
Client → Supabase Edge Function → Database (API key) → Anthropic API
```

## 🔧 Components Created

### 1. Database Table: `api_keys`
- Stores API keys securely
- Only accessible by service role
- Includes audit fields

### 2. Edge Function: `anthropic-proxy`
- Server-side proxy for Anthropic API calls
- Retrieves API key from database
- Handles CORS and error responses

### 3. Service: `SecureAnthropicAIService`
- Replaces the old `AnthropicAIService`
- Uses Edge Function instead of direct API calls
- Maintains the same interface

### 4. Management Component: `ApiKeyManagement`
- UI for managing API keys (optional)
- Shows security status
- Allows key updates

## 🔒 Security Features

- **Server-side Storage**: API keys never leave the server
- **RLS Policies**: Database access restricted to service role
- **Edge Function Proxy**: All API calls go through secure proxy
- **No Client Exposure**: API keys are never bundled in frontend code
- **Audit Trail**: Track when keys are created/updated

## 🧪 Testing

### Verify Security
1. Open browser DevTools
2. Go to Sources tab
3. Search for "anthropic" or "api_key"
4. Confirm no API keys are visible

### Test Functionality
1. Generate a weekly report
2. Check Network tab for calls to `/functions/v1/anthropic-proxy`
3. Verify AI functionality works as expected

## 🚀 Benefits

- ✅ **Secure**: API keys never exposed to clients
- ✅ **Scalable**: Edge Functions handle high load
- ✅ **Maintainable**: Centralized API key management
- ✅ **Auditable**: Track all API key changes
- ✅ **Flexible**: Easy to add more API services

## 🔧 Troubleshooting

### Edge Function Not Working
- Check Supabase Dashboard > Edge Functions
- Verify the function is deployed and active
- Check function logs for errors

### API Key Not Found
- Verify the key is in the `api_keys` table
- Check that `is_active = true`
- Ensure service role has access

### CORS Issues
- Edge Function includes CORS headers
- Check browser console for CORS errors
- Verify the function URL is correct

## 📝 Next Steps

1. **Remove Old Code**: Delete the old `AnthropicAIService.ts` file
2. **Update Documentation**: Update any docs that reference the old API key
3. **Monitor Usage**: Check Edge Function logs for usage patterns
4. **Add More Services**: Use the same pattern for other API keys

## 🆘 Support

If you encounter issues:
1. Check the Edge Function logs in Supabase Dashboard
2. Verify your API key is correct in the database
3. Test the Edge Function directly using the Supabase Dashboard
4. Check browser console for any client-side errors

---

**Security Note**: This implementation ensures your API keys are never exposed to the client-side, providing enterprise-grade security for your application.
