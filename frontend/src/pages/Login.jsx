import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      setTimeout(() => navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'), 600);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-gradient auth-gradient-1" />
        <div className="auth-gradient auth-gradient-2" />
        <div className="auth-gradient auth-gradient-3" />
        <div className="auth-grid-pattern" />
      </div>

      {/* Glassmorphic card */}
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-row">
          <img src="/logo.png" alt="Purple" className="auth-logo-img" />
          <span className="auth-logo-text">Pur<span className="auth-logo-accent">p</span>le</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Access your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-pw-box">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div className="auth-actions-row">
            <span className="auth-forgot" onClick={() => navigate('/forgot-password')}>Forgot password?</span>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? <span className="auth-loader" /> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
