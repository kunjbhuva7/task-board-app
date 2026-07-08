import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import { Menu } from 'lucide-react';

import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Permissions from './pages/admin/Permissions';
import AdminAllTasks from './pages/admin/AllTasks';
import ActivityLog from './pages/admin/ActivityLog';
import Expenses from './pages/admin/Expenses';

import UserDashboard from './pages/user/Dashboard';
import MyTasks from './pages/user/MyTasks';
import UserAllTasks from './pages/user/AllTasks';
import Profile from './pages/user/Profile';
import Projects from './pages/Projects';
import Reminders from './pages/user/Reminders';
import GymTracker from './pages/gym/GymTracker';
import OfficeExpenses from './pages/user/OfficeExpenses';

import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children, requiredPerm }) => {
  const { user, permissions, loading } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" style={{ width:40, height:40, margin:'0 auto', borderColor:'rgba(255,255,255,0.3)', borderTopColor:'white' }}></div>
          <p style={{ color:'rgba(255,255,255,0.8)', marginTop:'1rem', fontWeight:'600', fontSize:'0.9rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (requiredPerm) {
    const hasPerm = user.role === 'admin' || permissions?.is_super_admin || permissions?.[requiredPerm];
    if (!hasPerm) return <Navigate to="/user/dashboard" />;
  }

  return (
    <div className={`app-container ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Sidebar setMobileOpen={setMobileOpen} />
      
      <div className="main-content">
        {/* Mobile Topbar */}
        <div className="mobile-topbar">
          <button className="mobile-menu-toggle-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ fontSize:'1.2rem', fontWeight:'800', color:'var(--text-primary)', letterSpacing:'-0.3px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Helios
            </span>
          </div>
          
          <div style={{ width: 24 }} /> {/* Empty placeholder for flex alignment */}
        </div>

        <div className="page-content" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
          {children}
        </div>
      </div>

      {/* Responsive mobile backdrop overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay-mobile" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#0F172A', color: '#fff', borderRadius: '12px', padding: '12px 18px', fontSize: '0.88rem', fontWeight: 600, boxShadow: '0 12px 36px rgba(15,23,42,0.25)' }, success: { iconTheme: { primary: '#10B981', secondary: '#fff' } }, error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } } }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin/Manager Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredPerm="can_view_analytics"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredPerm="can_view_users"><Users /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute requiredPerm="can_manage_roles"><Permissions /></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute requiredPerm="can_manage_tasks"><AdminAllTasks /></ProtectedRoute>} />
        <Route path="/admin/activity" element={<ProtectedRoute requiredPerm="is_super_admin"><ActivityLog /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute requiredPerm="is_super_admin"><Expenses /></ProtectedRoute>} />
        
        <Route path="/projects" element={<ProtectedRoute requiredPerm="can_view_projects"><Projects /></ProtectedRoute>} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
        <Route path="/user/all-tasks" element={<ProtectedRoute><UserAllTasks /></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/user/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
        <Route path="/user/gym" element={<ProtectedRoute><GymTracker /></ProtectedRoute>} />
        <Route path="/user/office-expenses" element={<ProtectedRoute><OfficeExpenses /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
