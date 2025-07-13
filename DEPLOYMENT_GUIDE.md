# Production Deployment Guide

## 🚀 Multi-Streaming Application Deployment

This guide provides step-by-step instructions for deploying the multi-streaming application to production environments.

---

## 📋 Pre-Deployment Checklist

### Required Actions Before Deployment

- [ ] **Environment Variables Configured**
  - [ ] `EXPO_PUBLIC_TWITCH_CLIENT_ID`
  - [ ] `EXPO_PUBLIC_TWITCH_CLIENT_SECRET`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `EXPO_PUBLIC_ENVIRONMENT=production`

- [ ] **Build Process Verified**
  - [ ] TypeScript compilation successful
  - [ ] Bundle optimization completed
  - [ ] Asset compression enabled
  - [ ] Source maps generated

- [ ] **Testing Completed**
  - [ ] All integration tests passing
  - [ ] Performance benchmarks met
  - [ ] Cross-platform compatibility verified
  - [ ] Security audit completed

- [ ] **Infrastructure Ready**
  - [ ] CDN configured for asset delivery
  - [ ] SSL certificates installed
  - [ ] Load balancers configured
  - [ ] Monitoring systems active

---

## 🏗️ Platform-Specific Deployment

### Web Deployment (Expo Web)

#### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build:web

# Output location: dist/
```

#### Deployment Steps
1. **Build the application**
   ```bash
   expo export --platform web
   ```

2. **Upload to hosting provider**
   - **Vercel**: Connect GitHub repository, auto-deploy on push
   - **Netlify**: Drag and drop `dist` folder or connect repository
   - **AWS S3 + CloudFront**: Upload dist contents to S3 bucket

3. **Configure web server**
   ```nginx
   # nginx.conf example
   server {
       listen 80;
       server_name yourapp.com;
       
       location / {
           root /var/www/dist;
           try_files $uri $uri/ /index.html;
           
           # Enable gzip compression
           gzip on;
           gzip_types text/plain text/css application/json application/javascript;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

### iOS Deployment (App Store)

#### Prerequisites
- Apple Developer Account ($99/year)
- Xcode installed on macOS
- iOS certificates and provisioning profiles

#### Build Process
```bash
# Build iOS app
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### Deployment Steps
1. **Configure app.json for iOS**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.multistream",
         "buildNumber": "1.0.0",
         "supportsTablet": true,
         "requireFullScreen": false
       }
     }
   }
   ```

2. **Build and submit**
   ```bash
   # Create production build
   eas build --platform ios --profile production
   
   # Submit to App Store Connect
   eas submit --platform ios --profile production
   ```

3. **App Store Connect setup**
   - Upload app screenshots
   - Write app description
   - Set pricing and availability
   - Submit for review

### Android Deployment (Google Play)

#### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Android signing key generated

#### Build Process
```bash
# Build Android app
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

#### Deployment Steps
1. **Configure app.json for Android**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.multistream",
         "versionCode": 1,
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#000000"
         }
       }
     }
   }
   ```

2. **Generate signing key**
   ```bash
   # Generate upload key
   keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Build and submit**
   ```bash
   # Create production build
   eas build --platform android --profile production
   
   # Submit to Google Play Console
   eas submit --platform android --profile production
   ```

---

## ⚙️ Environment Configuration

### Production Environment Variables

#### Web Environment (.env.production)
```bash
# API Configuration
EXPO_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
EXPO_PUBLIC_TWITCH_CLIENT_SECRET=your_twitch_client_secret
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG_MODE=false

# Analytics
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_CRASH_REPORTING_ENABLED=true

# Performance
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
EXPO_PUBLIC_CDN_URL=https://cdn.yourapp.com

# Features
EXPO_PUBLIC_MAX_FREE_STREAMS=4
EXPO_PUBLIC_MAX_PRO_STREAMS=8
EXPO_PUBLIC_MAX_PREMIUM_STREAMS=20
```

#### Mobile Environment (EAS Secrets)
```bash
# Set EAS secrets for mobile builds
eas secret:create --scope project --name TWITCH_CLIENT_ID --value your_client_id
eas secret:create --scope project --name TWITCH_CLIENT_SECRET --value your_client_secret
eas secret:create --scope project --name SUPABASE_URL --value your_supabase_url
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_anon_key
```

### EAS Build Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "env": {
        "EXPO_PUBLIC_TWITCH_CLIENT_ID": "$TWITCH_CLIENT_ID",
        "EXPO_PUBLIC_TWITCH_CLIENT_SECRET": "$TWITCH_CLIENT_SECRET",
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Using Let's Encrypt (free SSL)
sudo certbot --nginx -d yourapp.com -d www.yourapp.com

# Or upload custom certificate
# Configure in your hosting provider's dashboard
```

### Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://static-cdn.jtvnw.net https://your-supabase-project.supabase.co;
  connect-src 'self' https://api.twitch.tv https://your-supabase-project.supabase.co wss://realtime.supabase.co;
  media-src 'self' https://player.twitch.tv;
  frame-src https://player.twitch.tv;
">
```

### API Security Headers
```javascript
// Express.js security middleware
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://static-cdn.jtvnw.net"],
      connectSrc: ["'self'", "https://api.twitch.tv", "https://your-supabase-project.supabase.co"],
    },
  },
}));
```

---

## 📊 Monitoring & Analytics

### Error Tracking Setup

#### Sentry Integration
```bash
# Install Sentry
npm install @sentry/react @sentry/expo

# Configure in App.tsx
import * as Sentry from '@sentry/expo';

Sentry.init({
  dsn: 'your_sentry_dsn',
  environment: 'production',
});
```

#### Custom Error Tracking
```typescript
// utils/errorReporting.ts
export const reportError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('Error:', error, context);
  } else {
    // Send to your error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    });
  }
};
```

### Performance Monitoring

#### Google Analytics 4
```javascript
// Install GA4
npm install @react-native-google-analytics/google-analytics

// Configure tracking
import { GoogleAnalytics } from '@react-native-google-analytics/google-analytics';

GoogleAnalytics.setMeasurementId('GA_MEASUREMENT_ID');

// Track events
GoogleAnalytics.trackEvent('stream_added', {
  stream_id: streamId,
  platform: 'twitch',
});
```

#### Custom Performance Metrics
```typescript
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  static trackRenderTime(componentName: string, renderTime: number) {
    if (renderTime > 100) { // Threshold for slow renders
      GoogleAnalytics.trackEvent('slow_render', {
        component: componentName,
        render_time: renderTime,
      });
    }
  }
  
  static trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      GoogleAnalytics.trackEvent('memory_usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      });
    }
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run linting
        run: npm run lint

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for web
        run: npm run build:web
        env:
          EXPO_PUBLIC_TWITCH_CLIENT_ID: ${{ secrets.TWITCH_CLIENT_ID }}
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./dist

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for iOS
        run: eas build --platform ios --profile production --non-interactive
      
      - name: Build for Android
        run: eas build --platform android --profile production --non-interactive
```

---

## 🚨 Rollback Procedures

### Web Rollback
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Manual rollback
git revert [commit-hash]
git push origin main
```

### Mobile Rollback
```bash
# EAS rollback (if available)
eas build:rollback --platform ios --build-id [build-id]

# App Store rollback
# Use App Store Connect to revert to previous version
# This requires manual approval and takes 24-48 hours
```

### Database Rollback
```sql
-- Supabase migration rollback
-- Create rollback migration
-- Apply through Supabase dashboard or CLI
```

---

## 📞 Support & Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
expo r -c

# Clear EAS cache
eas build:clear-cache
```

#### Environment Variable Issues
```bash
# Verify environment variables
eas secret:list

# Update secret
eas secret:delete --name SECRET_NAME
eas secret:create --name SECRET_NAME --value new_value
```

#### Bundle Size Issues
```bash
# Analyze bundle
npx expo export --dump-assetmap

# Tree shake unused imports
# Enable in metro.config.js
```

### Health Checks

#### Application Health Endpoint
```typescript
// Create /api/health endpoint
export const healthCheck = async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    services: {
      twitch: await checkTwitchAPI(),
      supabase: await checkSupabase(),
    }
  };
};
```

#### Monitoring Commands
```bash
# Check application status
curl https://yourapp.com/api/health

# Monitor logs
# Vercel: vercel logs
# Netlify: Check dashboard
# Custom server: tail -f /var/log/app.log
```

---

## 📈 Performance Optimization

### Production Optimizations

#### Bundle Optimization
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      mangle: true,
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
  resolver: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
};
```

#### Asset Optimization
```bash
# Optimize images
npm install --save-dev expo-optimize

# Run optimization
npx expo-optimize
```

#### CDN Configuration
```javascript
// Configure asset CDN
const assetPrefix = process.env.NODE_ENV === 'production' 
  ? 'https://cdn.yourapp.com' 
  : '';

export default {
  assetPrefix,
  images: {
    domains: ['cdn.yourapp.com', 'static-cdn.jtvnw.net'],
  },
};
```

---

## ✅ Post-Deployment Verification

### Deployment Checklist

#### Immediate Verification (0-1 hour)
- [ ] Application loads successfully
- [ ] All critical features functional
- [ ] No JavaScript errors in console
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] SSL certificate valid

#### 24-Hour Verification
- [ ] Performance metrics normal
- [ ] Error rates below threshold
- [ ] User analytics tracking
- [ ] Memory usage stable
- [ ] No critical user reports

#### 1-Week Verification
- [ ] Performance trends positive
- [ ] User engagement metrics healthy
- [ ] No security incidents
- [ ] Backup systems tested
- [ ] Monitoring alerts configured

### Success Metrics

#### Technical Metrics
- **Uptime**: >99.9%
- **Page Load Time**: <3 seconds
- **API Response Time**: <500ms
- **Error Rate**: <0.1%
- **Memory Usage**: Stable over time

#### Business Metrics
- **User Engagement**: Monitor active users
- **Feature Adoption**: Track multi-stream usage
- **Performance Satisfaction**: User feedback scores
- **Retention Rate**: Week-over-week user retention

---

**Deployment completed successfully! The multi-streaming application is now live and ready for users.**

For support during deployment, contact the development team or refer to the troubleshooting section above.