import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Crown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Download,
  Upload,
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  TextInput,
  Modal,
  Switch,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { enterpriseAuthService, EnterpriseUser, Role } from '@/services/enterpriseAuthService';
import { ModernTheme } from '@/theme/modernTheme';

interface UserManagementProps {
  organizationId: string;
  currentUser: EnterpriseUser;
}

interface UserFilters {
  role?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'suspended';
  subscriptionTier?: string;
  searchQuery?: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ organizationId, currentUser }) => {
  // State management
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnterpriseUser[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingUser, setEditingUser] = useState<EnterpriseUser | null>(null);
  const [newUser, setNewUser] = useState<Partial<EnterpriseUser>>({});

  // Load users and roles
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        enterpriseAuthService.getEnterpriseUsers(organizationId),
        enterpriseAuthService.getRoles(organizationId),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...users];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department);
    }

    if (filters.status) {
      filtered = filtered.filter(user => {
        if (filters.status === 'active') {
          return user.isActive;
        }
        if (filters.status === 'inactive') {
          return !user.isActive;
        }
        return false;
      });
    }

    if (filters.subscriptionTier) {
      filtered = filtered.filter(user => user.subscription_tier === filters.subscriptionTier);
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle user actions
  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.role) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const userData = {
        ...newUser,
        organizationId,
        isActive: true,
        permissions: [],
        subscription_tier: 'free' as const,
        subscription_status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdUser = await enterpriseAuthService.createEnterpriseUser(userData);
      setUsers(prev => [...prev, createdUser]);
      setNewUser({});
      setShowUserModal(false);
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<EnterpriseUser>) => {
    try {
      const updatedUser = await enterpriseAuthService.updateUserRole(
        userId,
        updates.role || '',
        currentUser.id
      );
      setUsers(prev => prev.map(user => (user.id === userId ? updatedUser : user)));
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      Alert.alert('Error', 'Failed to update user. Please try again.');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await enterpriseAuthService.suspendUser(userId, 'Suspended by admin', currentUser.id);
      setUsers(prev =>
        prev.map(user => (user.id === userId ? { ...user, isActive: false } : user))
      );
      Alert.alert('Success', 'User suspended successfully');
    } catch (error) {
      console.error('❌ Failed to suspend user:', error);
      Alert.alert('Error', 'Failed to suspend user. Please try again.');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) {
      Alert.alert('Error', 'Please select users first');
      return;
    }

    const userIds = Array.from(selectedUsers);
    const actionText =
      action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete';

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionText} ${userIds.length} user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // Handle bulk actions (implementation depends on API)
              for (const userId of userIds) {
                if (action === 'activate' || action === 'deactivate') {
                  await handleUpdateUser(userId, { isActive: action === 'activate' });
                } else if (action === 'delete') {
                  // Delete user logic
                }
              }
              setSelectedUsers(new Set());
              setShowBulkActions(false);
              Alert.alert('Success', `Users ${actionText}d successfully`);
            } catch (error) {
              console.error(`❌ Failed to ${actionText} users:`, error);
              Alert.alert('Error', `Failed to ${actionText} users. Please try again.`);
            }
          },
        },
      ]
    );
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Get role display name
  const getRoleDisplayName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  // Get departments
  const getDepartments = (): string[] => {
    const departments = new Set<string>();
    users.forEach(user => {
      if (user.department) {
        departments.add(user.department);
      }
    });
    return Array.from(departments);
  };

  // Render user item
  const renderUserItem = ({ item: user }: { item: EnterpriseUser }) => {
    const isSelected = selectedUsers.has(user.id);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[styles.userItem, isSelected && styles.userItemSelected]}
      >
        <LinearGradient colors={ModernTheme.colors.gradients.card} style={styles.userItemGradient}>
          <TouchableOpacity
            style={styles.userItemContent}
            onPress={() => toggleUserSelection(user.id)}
            onLongPress={() => setEditingUser(user)}
          >
            {/* Selection indicator */}
            <View style={styles.selectionIndicator}>
              {isSelected ? (
                <CheckCircle size={20} color={ModernTheme.colors.primary[500]} />
              ) : (
                <View style={styles.selectionCircle} />
              )}
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.userMeta}>
                <View style={styles.userMetaItem}>
                  <Shield size={12} color={ModernTheme.colors.text.secondary} />
                  <Text style={styles.userMetaText}>{getRoleDisplayName(user.role)}</Text>
                </View>
                {user.department && (
                  <View style={styles.userMetaItem}>
                    <Building size={12} color={ModernTheme.colors.text.secondary} />
                    <Text style={styles.userMetaText}>{user.department}</Text>
                  </View>
                )}
                <View style={styles.userMetaItem}>
                  <Calendar size={12} color={ModernTheme.colors.text.secondary} />
                  <Text style={styles.userMetaText}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.userStatus}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: user.isActive
                        ? ModernTheme.colors.success[500]
                        : ModernTheme.colors.error[500],
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{user.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
                <View
                  style={[styles.tierBadge, { backgroundColor: ModernTheme.colors.primary[500] }]}
                >
                  <Text style={styles.tierText}>{user.subscription_tier}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.userActions} onPress={() => setEditingUser(user)}>
              <MoreVertical size={16} color={ModernTheme.colors.text.secondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </LinearGradient>
      </MotiView>
    );
  };

  // Render filters modal
  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <XCircle size={24} color={ModernTheme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersList}>
            {/* Role filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Role</Text>
              <View style={styles.filterOptions}>
                {roles.map(role => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.filterOption,
                      filters.role === role.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, role: role.id }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.role === role.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Department filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Department</Text>
              <View style={styles.filterOptions}>
                {getDepartments().map(dept => (
                  <TouchableOpacity
                    key={dept}
                    style={[
                      styles.filterOption,
                      filters.department === dept && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, department: dept }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.department === dept && styles.filterOptionTextActive,
                      ]}
                    >
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ].map(status => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.filterOption,
                      filters.status === status.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: status.value as any }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.status === status.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={() => setFilters({})}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <LinearGradient
                colors={ModernTheme.colors.gradients.primary}
                style={styles.applyFiltersGradient}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render user creation modal
  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowUserModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New User</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <XCircle size={24} color={ModernTheme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newUser.name || ''}
                onChangeText={text => setNewUser(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
                placeholderTextColor={ModernTheme.colors.text.secondary}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newUser.email || ''}
                onChangeText={text => setNewUser(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={ModernTheme.colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role *</Text>
              <View style={styles.roleSelector}>
                {roles.map(role => (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.roleOption, newUser.role === role.id && styles.roleOptionActive]}
                    onPress={() => setNewUser(prev => ({ ...prev, role: role.id }))}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        newUser.role === role.id && styles.roleOptionTextActive,
                      ]}
                    >
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Department</Text>
              <TextInput
                style={styles.fieldInput}
                value={newUser.department || ''}
                onChangeText={text => setNewUser(prev => ({ ...prev, department: text }))}
                placeholder="Enter department"
                placeholderTextColor={ModernTheme.colors.text.secondary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowUserModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
              <LinearGradient
                colors={ModernTheme.colors.gradients.primary}
                style={styles.createButtonGradient}
              >
                <Text style={styles.createButtonText}>Create User</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} of {users.length} users
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowFilters(true)}>
            <Filter size={20} color={ModernTheme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowUserModal(true)}>
            <Plus size={20} color={ModernTheme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={ModernTheme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={ModernTheme.colors.text.secondary}
            value={filters.searchQuery || ''}
            onChangeText={text => setFilters(prev => ({ ...prev, searchQuery: text }))}
          />
        </View>
      </View>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.bulkActions}
          >
            <LinearGradient
              colors={ModernTheme.colors.gradients.primary}
              style={styles.bulkActionsGradient}
            >
              <Text style={styles.bulkActionsText}>{selectedUsers.size} user(s) selected</Text>
              <View style={styles.bulkActionsButtons}>
                <TouchableOpacity
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('activate')}
                >
                  <UserCheck size={16} color={ModernTheme.colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('deactivate')}
                >
                  <UserX size={16} color={ModernTheme.colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('delete')}
                >
                  <Trash2 size={16} color={ModernTheme.colors.error[500]} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Users list */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.usersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ModernTheme.colors.primary[500]]}
            tintColor={ModernTheme.colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color={ModernTheme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading users...' : 'No users found'}
            </Text>
          </View>
        }
      />

      {/* Modals */}
      {renderFiltersModal()}
      {renderUserModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: ModernTheme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.lg,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: ModernTheme.spacing.sm,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
  },
  bulkActions: {
    marginHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.md,
  },
  bulkActionsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  },
  bulkActionsText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  bulkActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersList: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.xl,
  },
  userItem: {
    marginBottom: ModernTheme.spacing.sm,
  },
  userItemSelected: {
    transform: [{ scale: 0.98 }],
  },
  userItemGradient: {
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  },
  selectionIndicator: {
    marginRight: ModernTheme.spacing.md,
  },
  selectionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ModernTheme.colors.text.secondary,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ModernTheme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernTheme.spacing.md,
  },
  userAvatarText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  userEmail: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.sm,
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  userMetaText: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
  },
  userStatus: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  statusText: {
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
  },
  tierBadge: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  tierText: {
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    textTransform: 'capitalize',
  },
  userActions: {
    padding: ModernTheme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ModernTheme.spacing.xxl,
  },
  emptyStateText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    padding: ModernTheme.spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.lg,
  },
  modalTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  filtersList: {
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: ModernTheme.spacing.lg,
  },
  filterLabel: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
  },
  filterOption: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  filterOptionText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  filterOptionTextActive: {
    color: ModernTheme.colors.text.primary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    marginTop: ModernTheme.spacing.lg,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  applyFiltersButton: {
    flex: 1,
  },
  applyFiltersGradient: {
    paddingVertical: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  formContent: {
    maxHeight: 400,
  },
  formField: {
    marginBottom: ModernTheme.spacing.lg,
  },
  fieldLabel: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.sm,
  },
  fieldInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
  },
  roleOption: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleOptionActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  roleOptionText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  roleOptionTextActive: {
    color: ModernTheme.colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    marginTop: ModernTheme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  createButton: {
    flex: 1,
  },
  createButtonGradient: {
    paddingVertical: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
});

export default UserManagement;
