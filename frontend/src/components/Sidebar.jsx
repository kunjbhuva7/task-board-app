import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { LayoutDashboard, Users, Shield, List, Activity, User, LogOut, CheckSquare } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { canViewAllTasks } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <CheckSquare style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}} />
        TaskBoard
      </div>
      
      <div className="sidebar-nav">
        {user.role === 'admin' ? (
          <>
            <NavLink to="/admin/dashboard" className="sidebar-item">
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/admin/users" className="sidebar-item">
              <Users size={20} /> Manage Users
            </NavLink>
            <NavLink to="/admin/permissions" className="sidebar-item">
              <Shield size={20} /> Permissions
            </NavLink>
            <NavLink to="/admin/tasks" className="sidebar-item">
              <List size={20} /> All Tasks
            </NavLink>
            <NavLink to="/admin/activity" className="sidebar-item">
              <Activity size={20} /> Activity Log
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/user/dashboard" className="sidebar-item">
              <LayoutDashboard size={20} /> My Dashboard
            </NavLink>
            <NavLink to="/user/tasks" className="sidebar-item">
              <List size={20} /> My Tasks
            </NavLink>
            {canViewAllTasks && (
              <NavLink to="/user/all-tasks" className="sidebar-item">
                <List size={20} /> All Tasks
              </NavLink>
            )}
            <NavLink to="/user/profile" className="sidebar-item">
              <User size={20} /> Profile
            </NavLink>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn" style={{width: '100%', border: 'none', background: 'transparent', color: 'white', justifyContent: 'flex-start', padding: '0'}} onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
