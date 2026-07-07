import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

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
      <div className="auth-bg">
        <div className="auth-gradient auth-gradient-1" />
        <div className="auth-gradient auth-gradient-2" />
        <div className="auth-gradient auth-gradient-3" />
        <div className="auth-grid-pattern" />
      </div>

      <div className="auth-card">
        <div className="auth-logo-row">
          <img src="/logo.png" alt="Helios" className="auth-logo-img" />
          <span className="auth-logo-text">Helios</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <div className="auth-input-box">
              <Mail size={18} className="auth-input-icon" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
              {!email && <span className="auth-input-label">Email address</span>}
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-box">
              <Lock size={18} className="auth-input-icon" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" aria-label="Password" />
              {!password && <span className="auth-input-label">Password</span>}
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-actions-row">
            <span className="auth-forgot" onClick={() => navigate('/forgot-password')}>Forgot password?</span>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? <span className="auth-loader" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-bottom-text">
          <Lock size={13} /> Secured with encryption & rate limiting
        </div>
      </div>
    </div>
  );
};

export default Login;
