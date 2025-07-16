import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalStore } from '@/services/SimpleStateManager';
import { navigationService } from '@/services/NavigationService';
import { logDebug, logError } from '@/utils/errorHandler';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Crown, AlertTriangle, Wifi, WifiOff } from 'lucide-react-native';

export interface RouteConfig {
  path: string;
  requiresAuth?: boolean;
  requiresSubscription?: 'pro' | 'premium';
  permissions?: string[];
  redirectTo?: string;
  allowGuest?: boolean;
  customValidator?: () => boolean | Promise<boolean>;
}

export interface RouteGuardProps {
  children: React.ReactNode;
  config?: RouteConfig;
}

// Route configurations
const routeConfigs: RouteConfig[] = [
  {
    path: '/(auth)',
    requiresAuth: false,
    allowGuest: true,
  },
  {
    path: '/(tabs)',
    requiresAuth: false,
    allowGuest: true,
  },
  {
    path: '/(tabs)/favorites',
    requiresAuth: false,
    allowGuest: true,
  },
  {
    path: '/(tabs)/grid',
    requiresAuth: false,
    allowGuest: true,
  },
  {
    path: '/(tabs)/settings',
    requiresAuth: false,
    allowGuest: true,
  },
  {
    path: '/(tabs)/subscription',
    requiresAuth: false,
    allowGuest: true,
  },
  // Future premium features
  {
    path: '/premium',
    requiresAuth: true,
    requiresSubscription: 'pro',
    redirectTo: '/(tabs)/subscription',
  },
  {
    path: '/admin',
    requiresAuth: true,
    permissions: ['admin'],
    redirectTo: '/(tabs)',
  },
];

const LoadingScreen: React.FC<{ message?: string; icon?: React.ReactNode }> = ({ 
  message = 'Loading...', 
  icon 
}) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#0f0f0f' 
  }}>
    <LinearGradient
      colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    />
    
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      {icon || <ActivityIndicator size="large" color="#8B5CF6" />}
      <Text style={{
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        marginTop: 16,
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </View>
  </View>
);

const AccessDeniedScreen: React.FC<{
  reason: string;
  icon: React.ReactNode;
  action?: () => void;
  actionText?: string;
}> = ({ reason, icon, action, actionText }) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 24,
  }}>
    <LinearGradient
      colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    />
    
    <View style={{ alignItems: 'center' }}>
      {icon}
      <Text style={{
        color: '#fff',
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
      }}>
        Access Restricted
      </Text>
      <Text style={{
        color: '#999',
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
      }}>
        {reason}
      </Text>
      
      {action && actionText && (
        <TouchableOpacity
          onPress={action}
          style={{
            backgroundColor: '#8B5CF6',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Inter-SemiBold',
          }}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, config }) => {
  const segments = useSegments();
  const { user, isLoading: authLoading, isSignedIn, isGuestMode } = useAuth();
  const globalState = useGlobalStore();
  const { temp } = globalState;
  
  const [isValidating, setIsValidating] = useState(true);
  const [accessDenied, setAccessDenied] = useState<{
    reason: string;
    icon: React.ReactNode;
    action?: () => void;
    actionText?: string;
  } | null>(null);

  // Get current route configuration
  const currentPath = `/${segments.join('/')}`;
  const routeConfig = config || routeConfigs.find(r => currentPath.startsWith(r.path));

  useEffect(() => {
    validateAccess();
  }, [segments, isSignedIn, isGuestMode, user, authLoading, temp.isConnected]);

  const validateAccess = async () => {
    try {
      setIsValidating(true);
      setAccessDenied(null);

      // Wait for auth to be loaded
      if (authLoading) {
        return;
      }

      logDebug('Validating route access', { 
        path: currentPath, 
        isSignedIn, 
        isGuestMode,
        config: routeConfig 
      });

      // No route config means public access
      if (!routeConfig) {
        setIsValidating(false);
        return;
      }

      // Check network connectivity for online-only features
      if (!temp.isConnected && routeConfig.requiresAuth) {
        setAccessDenied({
          reason: 'This feature requires an internet connection. Please check your network and try again.',
          icon: <WifiOff size={64} color="#EF4444" />,
          action: () => {
            // Retry validation
            validateAccess();
          },
          actionText: 'Retry',
        });
        setIsValidating(false);
        return;
      }

      // Check authentication requirement
      if (routeConfig.requiresAuth && !isSignedIn) {
        if (routeConfig.allowGuest && isGuestMode) {
          // Guest mode is allowed for this route
        } else {
          // Redirect to sign-in
          navigationService.navigateWithAuth(routeConfig.redirectTo || '/(auth)/sign-in');
          setIsValidating(false);
          return;
        }
      }

      // Check subscription requirement
      if (routeConfig.requiresSubscription && user) {
        const userTier = user.subscription?.tier || 'free';
        const requiredTier = routeConfig.requiresSubscription;
        
        const tierHierarchy = { free: 0, pro: 1, premium: 2 };
        
        if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
          setAccessDenied({
            reason: `This feature requires a ${requiredTier} subscription. Upgrade to access premium features.`,
            icon: <Crown size={64} color="#F59E0B" />,
            action: () => {
              navigationService.navigate('/(tabs)/subscription');
            },
            actionText: 'Upgrade Now',
          });
          setIsValidating(false);
          return;
        }
      }

      // Check permissions
      if (routeConfig.permissions && routeConfig.permissions.length > 0) {
        const userPermissions = user?.permissions || [];
        const hasPermission = routeConfig.permissions.some(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasPermission) {
          setAccessDenied({
            reason: 'You don\'t have permission to access this area. Contact support if you believe this is an error.',
            icon: <Lock size={64} color="#EF4444" />,
          });
          setIsValidating(false);
          return;
        }
      }

      // Custom validation
      if (routeConfig.customValidator) {
        try {
          const isValid = await routeConfig.customValidator();
          if (!isValid) {
            setAccessDenied({
              reason: 'Access validation failed. Please try again later.',
              icon: <AlertTriangle size={64} color="#F59E0B" />,
            });
            setIsValidating(false);
            return;
          }
        } catch (error) {
          logError('Custom route validation failed', error);
          setAccessDenied({
            reason: 'Unable to validate access at this time. Please try again.',
            icon: <AlertTriangle size={64} color="#EF4444" />,
            action: () => validateAccess(),
            actionText: 'Try Again',
          });
          setIsValidating(false);
          return;
        }
      }

      // All checks passed
      setIsValidating(false);
      
    } catch (error) {
      logError('Route validation error', error);
      setAccessDenied({
        reason: 'An error occurred while validating access. Please try again.',
        icon: <AlertTriangle size={64} color="#EF4444" />,
        action: () => validateAccess(),
        actionText: 'Try Again',
      });
      setIsValidating(false);
    }
  };

  // Show loading screen while validating
  if (isValidating || authLoading) {
    let loadingMessage = 'Loading...';
    let loadingIcon;

    if (authLoading) {
      loadingMessage = 'Authenticating...';
      loadingIcon = <Lock size={32} color="#8B5CF6" />;
    } else if (!temp.isConnected) {
      loadingMessage = 'Connecting...';
      loadingIcon = <WifiOff size={32} color="#F59E0B" />;
    }

    return <LoadingScreen message={loadingMessage} icon={loadingIcon} />;
  }

  // Show access denied screen
  if (accessDenied) {
    return <AccessDeniedScreen {...accessDenied} />;
  }

  // Render protected content
  return <>{children}</>;
};

// Hook for checking route permissions
export const useRoutePermissions = () => {
  const { user, isSignedIn, isGuestMode } = useAuth();
  const { temp } = useGlobalStore();

  const checkAccess = (config: RouteConfig): boolean => {
    // Check network connectivity
    if (!temp.isConnected && config.requiresAuth) {
      return false;
    }

    // Check authentication
    if (config.requiresAuth && !isSignedIn) {
      return config.allowGuest && isGuestMode;
    }

    // Check subscription
    if (config.requiresSubscription && user) {
      const userTier = user.subscription?.tier || 'free';
      const requiredTier = config.requiresSubscription;
      const tierHierarchy = { free: 0, pro: 1, premium: 2 };
      
      return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
    }

    // Check permissions
    if (config.permissions && config.permissions.length > 0) {
      const userPermissions = user?.permissions || [];
      return config.permissions.some(permission => 
        userPermissions.includes(permission)
      );
    }

    return true;
  };

  const getAccessInfo = (path: string) => {
    const config = routeConfigs.find(r => path.startsWith(r.path));
    return {
      hasAccess: config ? checkAccess(config) : true,
      config,
      requiresAuth: config?.requiresAuth || false,
      requiresSubscription: config?.requiresSubscription,
      allowGuest: config?.allowGuest || false,
    };
  };

  return {
    checkAccess,
    getAccessInfo,
    isOnline: temp.isConnected,
    userTier: user?.subscription?.tier || 'free',
  };
};

export default RouteGuard;