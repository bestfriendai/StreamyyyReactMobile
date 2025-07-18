# 🔧 OAuth Redirect URL Fix

## 🔍 **The Issue**
Your screenshot shows this error:
```
Error: The current redirect url passed in the sign in or sign up request does not match an authorized redirect URI for this instance. Review authorized redirect urls for your instance. exp://192.168.1.2:13:8083/--/oauth-native-callback
```

This means your Clerk Dashboard doesn't have the correct development redirect URLs configured.

## ✅ **The Solution**

### Step 1: Go to Clerk Dashboard
1. Visit: https://dashboard.clerk.com/
2. Select your **Streamyyy** project
3. Navigate to: **User & Authentication** → **Social Connections**

### Step 2: Configure Google OAuth Redirect URLs
1. Click on **Google** → **Configure**
2. In the **Redirect URLs** section, add these **exact URLs**:

```
exp://192.168.1.2:8083/--/oauth-native-callback
exp://192.168.1.2:13:8083/--/oauth-native-callback
exp://localhost:8083/--/oauth-native-callback
exp://localhost:19000/--/oauth-native-callback
streamyyy://oauth-native-callback
https://accounts.clerk.dev/v1/oauth_callback
https://clerk.streamyyy.com/v1/oauth_callback
```

### Step 3: Configure Discord OAuth Redirect URLs
1. Click on **Discord** → **Configure**  
2. Add the same redirect URLs as above

### Step 4: Why These URLs?

- `exp://192.168.1.2:8083/--/oauth-native-callback` - Your current development URL
- `exp://192.168.1.2:13:8083/--/oauth-native-callback` - Alternative port
- `exp://localhost:*` - For localhost development
- `streamyyy://oauth-native-callback` - Your app's custom scheme
- `https://accounts.clerk.dev/*` - Clerk's default OAuth callback
- `https://clerk.streamyyy.com/*` - Your production domain

## 🚀 **After Adding URLs**

1. **Save** the configuration in Clerk Dashboard
2. **Wait 1-2 minutes** for changes to propagate
3. **Test OAuth** again in your app
4. The Google/Discord buttons should now work!

## 🐛 **If Still Not Working**

### Check Your Development IP:
```bash
# Find your current development IP
npx expo start --clear
# Look for the IP address in the QR code URL
```

### Add Any New IP Address:
If your IP changed, add the new URL format:
```
exp://[NEW_IP]:8083/--/oauth-native-callback
exp://[NEW_IP]:19000/--/oauth-native-callback
```

## 📱 **Testing Steps**

1. **Start Expo**:
   ```bash
   npx expo start --clear
   ```

2. **Open your app** on device/simulator

3. **Try Google OAuth**:
   - Tap "Continue with Google"
   - Should open Google login
   - Should redirect back successfully

4. **Try Discord OAuth**:
   - Tap "Continue with Twitch (via Discord)"
   - Confirm the dialog
   - Should open Discord login
   - Should redirect back successfully

## ✅ **Success Indicators**

When working correctly:
- ✅ No "redirect URL" error messages
- ✅ OAuth opens in browser/WebView
- ✅ After login, automatically returns to app
- ✅ User is signed in and redirected to main screen

The fix is simple - just add those redirect URLs to your Clerk Dashboard configuration!