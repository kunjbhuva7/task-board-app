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
      setTimeout(() => navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left: branding panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <img src="/logo.png" alt="Logo" className="login-logo" />
            <span className="login-brand-text">Pur<span className="login-brand-p">p</span>le</span>
          </div>
          <h1 className="login-hero-text">Manage.<br/>Track.<br/><span className="login-hero-accent">Grow.</span></h1>
          <p className="login-hero-sub">Tasks, fitness, expenses — all in one beautiful workspace built for you.</p>
        </div>
        {/* Decorative gradient orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      {/* Right: form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-pw-wrap">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                <button type="button" className="login-pw-toggle" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div className="login-forgot">
              <span onClick={() => navigate('/forgot-password')}>Forgot password?</span>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Sign In'}
            </button>
          </form>

          <p className="login-footer-note">Protected by rate limiting & encryption.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
