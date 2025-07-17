import { LinearGradient } from 'expo-linear-gradient';
import { router, useSegments } from 'expo-router';
import {
  Search,
  Bell,
  Settings,
  User,
  Menu,
  X,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Clock,
  Star,
  Grid3X3,
  Heart,
  Crown,
  Compass,
  ChevronDown,
  Filter,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { navigationService } from '@/services/NavigationService';
import {
  useGlobalStore,
  useActions,
  useTempState,
  useAppTheme,
} from '@/services/SimpleStateManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TabItem {
  name: string;
  title: string;
  icon: React.ComponentType<any>;
  activeIcon?: React.ComponentType<any>;
  requiresAuth?: boolean;
  badge?: number;
  disabled?: boolean;
}

const tabItems: TabItem[] = [
  {
    name: 'index',
    title: 'Discover',
    icon: Compass,
    requiresAuth: false,
  },
  {
    name: 'grid',
    title: 'Multi-Stream',
    icon: Grid3X3,
    requiresAuth: false,
  },
  {
    name: 'favorites',
    title: 'Favorites',
    icon: Heart,
    requiresAuth: false,
  },
  {
    name: 'subscription',
    title: 'Premium',
    icon: Crown,
    requiresAuth: false,
  },
  {
    name: 'settings',
    title: 'Settings',
    icon: Settings,
    requiresAuth: false,
  },
];

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showConnectionStatus?: boolean;
  customActions?: React.ReactNode;
  onMenuPress?: () => void;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  showConnectionStatus = true,
  customActions,
  onMenuPress,
}) => {
  const insets = useSafeAreaInsets();
  const { user, isSignedIn } = useAuth();
  const { temp } = useGlobalStore();
  const theme = useAppTheme();
  const actions = useActions();

  const [notificationCount] = useState(3); // Mock notification count

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(15, 15, 15, 0.95)', 'rgba(26, 26, 26, 0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerContent}>
        {/* Left Section */}
        <View style={styles.headerLeft}>
          {onMenuPress && (
            <TouchableOpacity style={styles.headerButton} onPress={onMenuPress}>
              <Menu size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {title && (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Center Section */}
        <View style={styles.headerCenter}>
          {showSearch && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                // Navigate to search or toggle search
                actions.setSearchQuery('');
                // Focus search input if on discover tab
                router.push('/(tabs)');
              }}
            >
              <Search size={20} color="#8B5CF6" />
              <Text style={styles.searchButtonText}>Search streams...</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.headerRight}>
          {showConnectionStatus && (
            <View style={styles.connectionStatus}>
              {temp.isConnected ? (
                <Wifi size={16} color="#10B981" />
              ) : (
                <WifiOff size={16} color="#EF4444" />
              )}
            </View>
          )}

          {showNotifications && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => Alert.alert('Notifications', 'Notifications feature coming soon!')}
            >
              <Bell size={20} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                if (isSignedIn) {
                  navigationService.navigate('/(tabs)/settings');
                } else {
                  navigationService.navigate('/(auth)/sign-in');
                }
              }}
            >
              {isSignedIn && user?.avatar ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <User size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          )}

          {customActions}
        </View>
      </View>
    </View>
  );
};

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose }) => {
  const { user, isSignedIn, signOut } = useAuth();
  const globalState = useGlobalStore();
  const actions = useActions();
  const slideX = useSharedValue(visible ? 0 : -300);

  useEffect(() => {
    slideX.value = withSpring(visible ? 0 : -300, { damping: 20 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slideX.value, [-300, 0], [0, 1]),
  }));

  const menuItems = [
    { icon: Compass, title: 'Discover', onPress: () => navigationService.navigate('/(tabs)') },
    {
      icon: Grid3X3,
      title: 'Multi-Stream',
      onPress: () => navigationService.navigate('/(tabs)/grid'),
    },
    {
      icon: Heart,
      title: 'Favorites',
      onPress: () => navigationService.navigate('/(tabs)/favorites'),
    },
    {
      icon: Crown,
      title: 'Premium',
      onPress: () => navigationService.navigate('/(tabs)/subscription'),
    },
    {
      icon: Settings,
      title: 'Settings',
      onPress: () => navigationService.navigate('/(tabs)/settings'),
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      navigationService.navigate('/(auth)/sign-in');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.menuOverlay}>
        <Animated.View style={[styles.menuBackdrop, overlayStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sideMenu, animatedStyle]}>
          <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={StyleSheet.absoluteFill} />

          {/* Header */}
          <View style={styles.menuHeader}>
            <TouchableOpacity style={styles.menuCloseButton} onPress={onClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.menuProfile}>
              {isSignedIn ? (
                <>
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.menuUserName}>{user?.name || 'User'}</Text>
                    <Text style={styles.menuUserEmail}>{user?.email}</Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.signInPrompt}
                  onPress={() => {
                    onClose();
                    navigationService.navigate('/(auth)/sign-in');
                  }}
                >
                  <User size={24} color="#8B5CF6" />
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
              >
                <item.icon size={20} color="#8B5CF6" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.menuDivider} />

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoTitle}>Streamyyy</Text>
              <Text style={styles.appInfoVersion}>Version {globalState.app.version}</Text>
              <Text style={styles.appInfoBuild}>Build {globalState.app.buildNumber}</Text>
            </View>

            {/* Sign Out */}
            {isSignedIn && (
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface EnhancedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const EnhancedTabBar: React.FC<EnhancedTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const globalState = useGlobalStore();
  const theme = useAppTheme();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(15, 15, 15, 0.95)', 'rgba(26, 26, 26, 0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tabItem = tabItems.find(item => item.name === route.name);

        if (!tabItem) {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const IconComponent = tabItem.icon;
        const iconColor = isFocused ? theme.primaryColor : '#666';
        const textColor = isFocused ? theme.primaryColor : '#666';

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            disabled={tabItem.disabled}
          >
            <View style={styles.tabIconContainer}>
              <IconComponent size={24} color={iconColor} />
              {tabItem.badge && tabItem.badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {tabItem.badge > 9 ? '9+' : tabItem.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: textColor }]}>{tabItem.title}</Text>
            {isFocused && (
              <View style={[styles.tabIndicator, { backgroundColor: theme.primaryColor }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export interface EnhancedAppLayoutProps {
  children: React.ReactNode;
  headerProps?: Partial<HeaderProps>;
  showHeader?: boolean;
  showTabBar?: boolean;
}

export const EnhancedAppLayout: React.FC<EnhancedAppLayoutProps> = ({
  children,
  headerProps = {},
  showHeader = true,
  showTabBar = true,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const segments = useSegments();
  const theme = useAppTheme();
  const { temp } = useGlobalStore();

  // Auto-hide header/tabbar in certain conditions
  const shouldShowHeader = showHeader && !temp.pipMode;
  const shouldShowTabBar = showTabBar && !temp.pipMode;

  // Generate dynamic title based on current route
  const getCurrentTitle = () => {
    const currentTab = segments[segments.length - 1];
    const tabItem = tabItems.find(item => item.name === currentTab);
    return tabItem?.title || 'Streamyyy';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background */}
      <LinearGradient colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      {shouldShowHeader && (
        <Header
          title={getCurrentTitle()}
          onMenuPress={() => setMenuVisible(true)}
          {...headerProps}
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Custom Tab Bar */}
      {shouldShowTabBar && (
        <EnhancedTabBar
          state={{ routes: tabItems.map(item => ({ name: item.name, key: item.name })), index: 0 }}
          descriptors={{}}
          navigation={{
            navigate: (name: string) => router.push(`/(tabs)/${name === 'index' ? '' : name}`),
          }}
        />
      )}

      {/* Side Menu */}
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Offline Indicator */}
      {!temp.isConnected && (
        <View style={styles.offlineIndicator}>
          <WifiOff size={16} color="#fff" />
          <Text style={styles.offlineText}>No Internet Connection</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginLeft: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 200,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  connectionStatus: {
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    minHeight: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 2,
    borderRadius: 1,
  },
  // Side Menu Styles
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenu: {
    width: 280,
    backgroundColor: '#1a1a1a',
    height: '100%',
  },
  menuHeader: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuCloseButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 20,
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuAvatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  menuUserName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 4,
  },
  menuUserEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  appInfoVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  appInfoBuild: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  offlineIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1001,
  },
  offlineText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});

export default EnhancedAppLayout;
