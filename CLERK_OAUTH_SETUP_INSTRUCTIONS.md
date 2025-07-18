# 🔐 Clerk OAuth Setup Instructions

## ✅ Current Status
Your app is now properly configured for OAuth authentication. The remaining step is configuring OAuth providers in your Clerk Dashboard.

## 🛠️ Fixed Issues
1. ✅ Added missing `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` environment variable
2. ✅ Removed malformed `\n` characters from environment variables  
3. ✅ Fixed Twitch OAuth to use Discord (Twitch not supported by Clerk)
4. ✅ Added proper error handling and fallback UI
5. ✅ Created logo placeholders (no image assets required)

## 📋 Next Steps: Configure Clerk Dashboard

### Step 1: Access Your Clerk Dashboard
1. Go to: https://dashboard.clerk.com/
2. Sign in to your account
3. Select your **Streamyyy** project

### Step 2: Enable OAuth Providers

#### 🔵 Google OAuth Setup
1. Navigate to: **User & Authentication** → **Social Connections**
2. Find **Google** and click **Configure**
3. Toggle **Enable Google** to ON
4. You'll need Google OAuth credentials:

**To get Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select your project
3. Navigate to **APIs & Services** → **Credentials** 
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://accounts.clerk.dev/v1/oauth_callback
   https://clerk.streamyyy.com/v1/oauth_callback
   ```
7. Copy **Client ID** and **Client Secret**
8. Paste them into Clerk Dashboard

#### 🟣 Discord OAuth Setup  
1. In Clerk Dashboard: **User & Authentication** → **Social Connections**
2. Find **Discord** and click **Configure**
3. Toggle **Enable Discord** to ON
4. You'll need Discord OAuth credentials:

**To get Discord OAuth credentials:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, name it "Streamyyy"
3. Go to **OAuth2** section
4. Add **Redirect URIs**:
   ```
   https://accounts.clerk.dev/v1/oauth_callback
   https://clerk.streamyyy.com/v1/oauth_callback
   ```
5. Copy **Client ID** and **Client Secret** 
6. Paste them into Clerk Dashboard

### Step 3: Configure Redirect URLs

In each OAuth provider configuration in Clerk, ensure these redirect URLs are added:

**Development:**
- `https://accounts.clerk.dev/v1/oauth_callback`
- `http://localhost:8083`
- `exp://localhost:19000`

**Production:**
- `https://clerk.streamyyy.com/v1/oauth_callback`
- `https://streamyyy.com/oauth_callback`

### Step 4: Test OAuth Integration

1. **Start your app:**
   ```bash
   npm run dev
   # or
   npx expo start
   ```

2. **Test Google OAuth:**
   - Open the app → Go to Sign In screen
   - Tap "Continue with Google" button
   - Should open Google login in browser/WebView
   - After successful login, should redirect back to app

3. **Test Discord/"Twitch" OAuth:**
   - Tap "Continue with Twitch (via Discord)" button
   - Will show explanation dialog, tap "Continue with Discord"
   - Should open Discord login
   - After successful login, should redirect back to app

## 🔧 Troubleshooting

### Common Issues:

1. **"OAuth provider not found" error**
   - ✅ Provider must be enabled in Clerk Dashboard
   - ✅ Check Client ID and Secret are correctly entered
   - ✅ Verify provider status shows as "Active"

2. **"Redirect URI mismatch"**
   - ✅ Ensure redirect URIs match exactly in both OAuth app and Clerk
   - ✅ Check for trailing slashes or typos
   - ✅ Test with development URLs first

3. **"App doesn't open after OAuth"**
   - ✅ Check device logs for redirect errors
   - ✅ Ensure app URL scheme is configured
   - ✅ Test on different device/simulator

### Debug Commands:

```bash
# Check environment variables
node scripts/clerk-helper.js check

# Start app with logging
npx expo start --clear

# View device logs (iOS)
npx react-native log-ios

# View device logs (Android)
npx react-native log-android
```

## 🎯 Success Indicators

When properly configured, you should see:
- ✅ OAuth buttons appear without errors
- ✅ Clicking buttons opens browser/WebView for authentication
- ✅ Successful login redirects back to main app
- ✅ User is logged in with OAuth provider information
- ✅ No "provider not found" or "redirect" errors

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify OAuth credentials in both provider and Clerk dashboards
3. Test OAuth flow in a web browser first
4. Check Clerk Dashboard logs for authentication attempts

**Your app is now ready for OAuth!** Once you complete the Clerk Dashboard configuration, Google and Discord/Twitch authentication will work seamlessly.