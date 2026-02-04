// Admin utilities for Ranqly platform
// This would typically integrate with your backend admin system

const ADMIN_ADDRESSES = [
  '0x742d35Cc6634C0532925a3b8D5a0F6b2e1E8C1e', // Example admin address
  '0x8ba1f109551bD432803012645Hac136c6b8f5c7', // Example admin address
  // Add more admin addresses as needed
];

const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  JUDGE_ADMIN: 'judge_admin',
  CONTEST_ADMIN: 'contest_admin'
} as const;

type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

interface AdminBadge {
  text: string;
  color: string;
  icon: string;
}

export const AdminUtils = {
  /**
   * Check if a user address is an admin
   * @param userAddress - The user's wallet address
   * @returns boolean - True if user is an admin
   */
  isAdmin: (userAddress: string | null): boolean => {
    if (!userAddress) return false;
    return ADMIN_ADDRESSES.includes(userAddress.toLowerCase());
  },

  /**
   * Get admin role for a user
   * @param userAddress - The user's wallet address
   * @returns AdminRole | null - Admin role or null if not admin
   */
  getAdminRole: (userAddress: string | null): AdminRole | null => {
    if (!userAddress) return null;
    
    // For now, all admin addresses have judge admin role
    // In a real system, this would check against a database
    if (ADMIN_ADDRESSES.includes(userAddress.toLowerCase())) {
      return ADMIN_ROLES.JUDGE_ADMIN;
    }
    
    return null;
  },

  /**
   * Check if user has specific admin permission
   * @param userAddress - The user's wallet address
   * @param permission - The permission to check
   * @returns boolean - True if user has permission
   */
  hasPermission: (userAddress: string | null, permission: string): boolean => {
    const role = AdminUtils.getAdminRole(userAddress);
    
    if (!role) return false;
    
    // Define permission mappings
    const permissions: Record<AdminRole, string[]> = {
      [ADMIN_ROLES.SUPER_ADMIN]: ['judge', 'manage_contests', 'view_analytics', 'manage_users'],
      [ADMIN_ROLES.JUDGE_ADMIN]: ['judge'],
      [ADMIN_ROLES.CONTEST_ADMIN]: ['manage_contests']
    };
    
    return permissions[role]?.includes(permission) || false;
  },

  /**
   * Check if user can access judge console
   * @param userAddress - The user's wallet address
   * @returns boolean - True if user can judge
   */
  canJudge: (userAddress: string | null): boolean => {
    return AdminUtils.hasPermission(userAddress, 'judge');
  },

  /**
   * Get admin badge info for display
   * @param userAddress - The user's wallet address
   * @returns AdminBadge | null - Badge info or null if not admin
   */
  getAdminBadge: (userAddress: string | null): AdminBadge | null => {
    const role = AdminUtils.getAdminRole(userAddress);
    
    if (!role) return null;
    
    const badges: Record<AdminRole, AdminBadge> = {
      [ADMIN_ROLES.SUPER_ADMIN]: {
        text: 'Super Admin',
        color: 'bg-red-100 text-red-800',
        icon: '👑'
      },
      [ADMIN_ROLES.JUDGE_ADMIN]: {
        text: 'Judge Admin',
        color: 'bg-purple-100 text-purple-800',
        icon: '⚖️'
      },
      [ADMIN_ROLES.CONTEST_ADMIN]: {
        text: 'Contest Admin',
        color: 'bg-blue-100 text-blue-800',
        icon: '🏆'
      }
    };
    
    return badges[role] || null;
  }
};

export default AdminUtils;
