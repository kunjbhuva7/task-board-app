import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Permissions from './pages/admin/Permissions';
import AdminAllTasks from './pages/admin/AllTasks';
import ActivityLog from './pages/admin/ActivityLog';

import UserDashboard from './pages/user/Dashboard';
import MyTasks from './pages/user/MyTasks';
import UserAllTasks from './pages/user/AllTasks';
import Profile from './pages/user/Profile';

import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useContext(AuthContext);

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
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/user/dashboard" />;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-content" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><Users /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute requireAdmin={true}><Permissions /></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute requireAdmin={true}><AdminAllTasks /></ProtectedRoute>} />
        <Route path="/admin/activity" element={<ProtectedRoute requireAdmin={true}><ActivityLog /></ProtectedRoute>} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
        <Route path="/user/all-tasks" element={<ProtectedRoute><UserAllTasks /></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
