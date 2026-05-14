import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    if (user.role === 'admin') navigate('/admin/dashboard');
    else navigate('/user/dashboard');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Logged in successfully');
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#F8FAFC', 
      fontFamily: "'Inter', sans-serif",
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2.5rem', 
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: '#EFF6FF', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1rem'
          }}>
            <Lock size={30} color="#2563EB" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.5rem' }}>Welcome back</h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="email" 
                required 
                className="login-input" 
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  paddingLeft: '2.5rem', 
                  borderRadius: '10px', 
                  border: '1px solid #E2E8F0',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
                placeholder="name@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="login-input" 
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  paddingLeft: '2.5rem', 
                  paddingRight: '2.5rem',
                  borderRadius: '10px', 
                  border: '1px solid #E2E8F0',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#94A3B8' 
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              height: '48px', 
              fontSize: '1rem', 
              borderRadius: '10px', 
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }} 
            disabled={loading}
          >
            {loading ? <div className="spinner spinner-fast"></div> : 'Login'}
          </button>
        </form>
      </div>

      <style>{`
        .login-input:focus {
          border-color: #2563EB !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Login;
