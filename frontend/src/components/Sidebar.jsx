import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Bell, Calendar, Settings, FolderKanban, Shield, Users, Activity, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { canViewAllTasks } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleComingSoon = (feature) => {
    toast.success(`${feature} is coming soon in the next update!`, { icon: '🚀' });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.75rem', borderRadius: '12px', width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '32px', height: '32px', background: '#111827', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
          </div>
        </div>
      </div>
      
      <div className="sidebar-nav">
        <div className="sidebar-section-title">MAIN MENU</div>
        <div className="sidebar-item" onClick={() => handleComingSoon('Search')} style={{cursor: 'pointer'}}>
          <Search size={18} /> Search
        </div>
        <div className="sidebar-item" onClick={() => handleComingSoon('Notifications')} style={{cursor: 'pointer'}}>
          <Bell size={18} /> Notification
        </div>
        <div className="sidebar-item" onClick={() => handleComingSoon('Calendar')} style={{cursor: 'pointer'}}>
          <Calendar size={18} /> Calendar
        </div>
        <NavLink to="/user/profile" className="sidebar-item">
          <Settings size={18} /> Settings
        </NavLink>

        <div className="sidebar-section-title">MY PAGES</div>
        {user.role === 'admin' ? (
          <>
            <NavLink to="/admin/dashboard" className="sidebar-item">
              <FolderKanban size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/tasks" className="sidebar-item">
              <FolderKanban size={18} /> All Tasks
            </NavLink>
            <NavLink to="/admin/users" className="sidebar-item">
              <Users size={18} /> Manage Users
            </NavLink>
            <NavLink to="/admin/permissions" className="sidebar-item">
              <Shield size={18} /> Permissions
            </NavLink>
            <NavLink to="/admin/activity" className="sidebar-item">
              <Activity size={18} /> Activity Log
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/user/dashboard" className="sidebar-item">
              <FolderKanban size={18} /> My Dashboard
            </NavLink>
            <NavLink to="/user/tasks" className="sidebar-item">
              <FolderKanban size={18} /> Craftboard Project
            </NavLink>
            {canViewAllTasks && (
              <NavLink to="/user/all-tasks" className="sidebar-item">
                <FolderKanban size={18} /> All Tasks
              </NavLink>
            )}
          </>
        )}
      </div>

      <div className="sidebar-footer" style={{ padding: '1.5rem', borderTop: 'none' }}>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#6B7280', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='#F3F4F6'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
