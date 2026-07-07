import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send reset link');
    } finally {
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
          <img src="/logo.png" alt="Purple" className="auth-logo-img" />
          <span className="auth-logo-text">Pur<span className="auth-logo-accent">p</span>le</span>
        </div>

        {sent ? (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. Expires in 1 hour.
            </p>
            <div className="auth-form">
              <button onClick={() => navigate('/login')} className="auth-submit-btn" style={{ width: '100%' }}>Back to Login</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send a reset link</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <div className="auth-input-box">
                  <Mail size={18} className="auth-input-icon" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
                  {!email && <span className="auth-input-label">Email address</span>}
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? <span className="auth-loader" /> : 'Send reset link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span onClick={() => navigate('/login')} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ArrowLeft size={14} /> Back to login
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
