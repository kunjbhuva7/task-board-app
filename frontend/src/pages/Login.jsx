import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      background: '#F9FAFB', 
      fontFamily: "'Inter', sans-serif",
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.5rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '520px', 
        padding: '3.5rem 3rem', 
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB'
      }}>
        {/* Logo Section */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: '#2563EB', 
            borderRadius: '6px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>T</div>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>TaskBoard</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#111827', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>Sign in to your account</h2>
          <p style={{ color: '#4B5563', fontSize: '16px' }}>
            Enter your details to manage your tasks
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Email address<span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="email" 
              required 
              style={{ 
                width: '100%', 
                height: '46px', 
                padding: '0 14px', 
                borderRadius: '8px', 
                border: '1px solid #D1D5DB',
                outline: 'none',
                fontSize: '16px',
                transition: 'all 0.2s',
                background: '#fff'
              }} 
              className="login-input-field"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Password<span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input 
              type="password" 
              required 
              style={{ 
                width: '100%', 
                height: '46px', 
                padding: '0 14px', 
                borderRadius: '8px', 
                border: '1px solid #D1D5DB',
                outline: 'none',
                fontSize: '16px',
                transition: 'all 0.2s',
                background: '#fff'
              }} 
              className="login-input-field"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="remember" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="remember" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>Remember me</label>
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              height: '48px', 
              fontSize: '16px', 
              fontWeight: '600',
              borderRadius: '8px', 
              background: '#2563EB',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'background 0.2s',
              marginTop: '0.5rem'
            }} 
            disabled={loading}
          >
            {loading ? <div className="spinner-fast" style={{ borderTopColor: 'white' }}></div> : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: '#2563EB', cursor: 'pointer', fontWeight: '500' }}>Forgot your password?</span>
          </div>
        </form>
      </div>

      <style>{`
        .login-input-field:focus {
          border-color: #2563EB !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Login;
