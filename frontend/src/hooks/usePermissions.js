import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
  const { user, permissions } = useContext(AuthContext);

  const checkPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (permissions?.is_super_admin) return true;
    return !!permissions?.[perm];
  };

  const isReadOnly = () => {
    if (!user) return true;
    if (user.role === 'admin') return false;
    if (permissions?.is_super_admin) return false;
    return !!permissions?.is_read_only;
  };

  return {
    canCreateTask: checkPermission('can_create_task'),
    canEditTask: checkPermission('can_edit_task'),
    canDeleteTask: checkPermission('can_delete_task'),
    canViewAllTasks: checkPermission('can_view_all_tasks'),
    canManageUsers: checkPermission('can_manage_users'),
    canViewUsers: checkPermission('can_view_users'),
    canCreateUsers: checkPermission('can_create_users'),
    canEditUsers: checkPermission('can_edit_users'),
    canDeleteUsers: checkPermission('can_delete_users'),
    canManageRoles: checkPermission('can_manage_roles'),
    canManageTasks: checkPermission('can_manage_tasks'),
    canApproveRequests: checkPermission('can_approve_requests'),
    canViewAnalytics: checkPermission('can_view_analytics'),
    canManageEvents: checkPermission('can_manage_events'),
    canManageNotifications: checkPermission('can_manage_notifications'),
    canManageSettings: checkPermission('can_manage_settings'),
    canViewReports: checkPermission('can_view_reports'),
    canExportData: checkPermission('can_export_data'),
    isSuperAdmin: checkPermission('is_super_admin'),
    isReadOnly: isReadOnly(),
    checkPermission,
  };
};
