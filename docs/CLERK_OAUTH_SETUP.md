# Clerk OAuth Configuration Guide

This guide helps you verify and configure OAuth providers in your Clerk Dashboard for the Streamyyy app.

## Current OAuth Configuration

Based on the app configuration, the following OAuth providers are set up:

- ✅ **Google OAuth** (`oauth_google`)
- ✅ **Discord OAuth** (`oauth_discord`) 
- ⚠️ **Twitch OAuth** (Not directly supported by Clerk - using Discord as substitute)

## Verification Steps

### 1. Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign in to your account
3. Select your Streamyyy project

### 2. Check OAuth Providers

1. Navigate to **User & Authentication** → **Social Connections**
2. Verify the following providers are enabled:

#### Google OAuth
- **Status**: Should be enabled
- **Client ID**: Should be configured
- **Client Secret**: Should be configured
- **Redirect URI**: Should include your app domains

#### Discord OAuth
- **Status**: Should be enabled
- **Client ID**: Should be configured
- **Client Secret**: Should be configured
- **Redirect URI**: Should include your app domains

### 3. Verify Redirect URLs

Ensure the following redirect URLs are configured for each provider:

**For Development:**
- `http://localhost:8083`
- `exp://localhost:19000`
- `exp+streamyyy-app://`

**For Production:**
- Your production domain
- Your app's custom scheme

### 4. Test OAuth Flows

1. **Google OAuth Test:**
   - Click the Google button in the app
   - Should redirect to Google login
   - Should return to app after successful authentication

2. **Discord OAuth Test:**
   - Click the Discord button in the app
   - Should redirect to Discord login
   - Should return to app after successful authentication

3. **Twitch OAuth (Future):**
   - Currently shows a message directing users to Discord
   - Can be implemented as custom OAuth provider in the future

## Troubleshooting

### Common Issues

1. **OAuth button not working:**
   - Check if provider is enabled in Clerk Dashboard
   - Verify redirect URLs are correctly configured
   - Check browser console for errors

2. **Redirect loop:**
   - Verify redirect URLs match exactly
   - Check for trailing slashes in URLs

3. **Provider not found error:**
   - Ensure provider is enabled in Clerk Dashboard
   - Check that the strategy name matches Clerk's naming convention

### Environment Variables

Ensure these environment variables are set:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Implementation Status

- [x] Settings page fixed (now uses proper settings component)
- [x] OAuth logos downloaded and implemented
- [x] Google OAuth button with official logo
- [x] Discord OAuth button with official logo
- [x] Twitch OAuth placeholder (redirects to Discord)
- [x] OAuth buttons added to sign-in screen
- [x] Proper error handling for OAuth flows

## Next Steps

1. **For Twitch OAuth:** Consider implementing as custom OAuth provider
2. **UI/UX:** Test OAuth flows on mobile devices
3. **Analytics:** Add tracking for OAuth usage
4. **Security:** Review OAuth scopes and permissions
