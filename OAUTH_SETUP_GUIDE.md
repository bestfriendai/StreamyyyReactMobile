# OAuth Setup Guide for Streamyyy

This guide will help you configure Google and Discord OAuth providers in your Clerk Dashboard to make the OAuth buttons fully functional.

## Prerequisites

1. **Clerk Account**: You need a Clerk account and project
2. **OAuth App Credentials**: You'll need to create OAuth apps with Google and Discord
3. **Environment Variables**: Your `.env` file should have your Clerk keys

## Step 1: Configure Google OAuth

### 1.1 Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen if not done already
6. For Application type, select "Web application"
7. Add authorized redirect URIs:
   ```
   https://accounts.clerk.dev/v1/oauth_callback
   https://[your-clerk-frontend-api]/v1/oauth_callback
   ```
8. Save and note down:
   - **Client ID**
   - **Client Secret**

### 1.2 Configure in Clerk Dashboard
1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your project
3. Navigate to "User & Authentication" > "Social Connections"
4. Find "Google" and click "Configure"
5. Enable Google OAuth
6. Enter your Google OAuth credentials:
   - **Client ID**: From step 1.1
   - **Client Secret**: From step 1.1
7. Save the configuration

## Step 2: Configure Discord OAuth

### 2.1 Create Discord OAuth App
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Streamyyy")
4. Go to "OAuth2" section
5. Add redirect URIs:
   ```
   https://accounts.clerk.dev/v1/oauth_callback
   https://[your-clerk-frontend-api]/v1/oauth_callback
   ```
6. Note down:
   - **Client ID**
   - **Client Secret**

### 2.2 Configure in Clerk Dashboard
1. In your Clerk Dashboard
2. Navigate to "User & Authentication" > "Social Connections"
3. Find "Discord" and click "Configure"
4. Enable Discord OAuth
5. Enter your Discord OAuth credentials:
   - **Client ID**: From step 2.1
   - **Client Secret**: From step 2.1
6. Save the configuration

## Step 3: Configure for Twitch (Alternative Approaches)

Since Clerk doesn't have built-in Twitch OAuth, you have a few options:

### Option A: Use Discord (Recommended for now)
- Many streamers have Discord accounts
- The current implementation uses Discord as "Twitch" alternative
- Discord is widely used in the streaming community

### Option B: Custom OAuth Provider (Advanced)
1. In Clerk Dashboard, you can configure a custom OAuth provider
2. Use Twitch OAuth endpoints:
   - **Authorization URL**: `https://id.twitch.tv/oauth2/authorize`
   - **Token URL**: `https://id.twitch.tv/oauth2/token`
   - **User Info URL**: `https://api.twitch.tv/helix/users`
3. Get Twitch OAuth credentials from [Twitch Developer Console](https://dev.twitch.tv/)

## Step 4: Test OAuth Integration

### 4.1 Test Google OAuth
1. Open your app
2. Navigate to sign-in screen
3. Tap "Google" button
4. Should open Google OAuth flow
5. After authorization, should redirect back to app

### 4.2 Test Discord/"Twitch" OAuth
1. Open your app
2. Navigate to sign-in screen  
3. Tap "Twitch" button (actually Discord)
4. Should open Discord OAuth flow
5. After authorization, should redirect back to app

## Step 5: Environment Variables

Make sure your `.env` file has the correct Clerk keys:

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
```

## Troubleshooting

### Common Issues:

1. **"OAuth provider not configured" error**
   - Make sure you've enabled the provider in Clerk Dashboard
   - Check that Client ID and Secret are correctly entered

2. **Redirect URI mismatch**
   - Ensure redirect URIs match exactly in both OAuth app and Clerk
   - Common format: `https://accounts.clerk.dev/v1/oauth_callback`

3. **App not opening after OAuth**
   - Check your app's URL scheme configuration
   - Ensure `expo-web-browser` is properly installed

### Debug Steps:

1. Check console logs for OAuth errors
2. Verify OAuth provider status in Clerk Dashboard
3. Test OAuth flow in a web browser first
4. Check network requests in developer tools

## Production Considerations

1. **Redirect URIs**: Update redirect URIs for production domain
2. **OAuth App Settings**: Configure OAuth apps for production use
3. **Environment Variables**: Use production Clerk keys
4. **Security**: Review OAuth scopes and permissions

## Success Indicators

When properly configured, you should see:
- ✅ Google/Twitch buttons functional (no error alerts)
- ✅ OAuth flow opens in browser/WebView
- ✅ Successful authentication redirects to main app
- ✅ User logged in with OAuth provider info

---

**Note**: The current implementation is ready for OAuth integration. Once you configure the providers in the Clerk Dashboard following this guide, the OAuth buttons will work immediately without any code changes.