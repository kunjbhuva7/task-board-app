import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
  const { user, permissions } = useContext(AuthContext);

  const checkPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return !!permissions[perm];
  };

  return {
    canCreateTask: checkPermission('can_create_task'),
    canEditTask: checkPermission('can_edit_task'),
    canDeleteTask: checkPermission('can_delete_task'),
    canAssignTask: checkPermission('can_assign_task'),
    canViewAllTasks: checkPermission('can_view_all_tasks'),
    canManageUsers: checkPermission('can_manage_users'),
  };
};
