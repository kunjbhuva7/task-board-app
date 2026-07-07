import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid invite link.'); setVerifying(false); return; }
    api.get(`/auth/verify-token/${token}`)
      .then(r => setEmail(r.data.email))
      .catch(err => setError(err.response?.data?.message || 'Invalid or expired link'))
      .finally(() => setVerifying(false));
  }, [token]);

  // Password strength
  const checks = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    num: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  const strengthColors = ['#E2E8F0', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (strength < 4) { toast.error('Please meet all password requirements'); return; }
    setLoading(true);
    try {
      await api.post('/auth/set-password', { token, name, password });
      toast.success('Account setup complete!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      if (err.response?.data?.errors) err.response.data.errors.forEach(e => toast.error(e.msg));
      else toast.error(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (verifying) return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-gradient auth-gradient-1" /><div className="auth-gradient auth-gradient-2" /><div className="auth-gradient auth-gradient-3" /></div>
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="auth-loader" /></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-gradient auth-gradient-1" /><div className="auth-gradient auth-gradient-2" /><div className="auth-gradient auth-gradient-3" /></div>
      <div className="auth-card">
        <div className="auth-logo-row"><img src="/logo.png" alt="Helios" className="auth-logo-img" /><span className="auth-logo-text">Helios</span></div>
        <h1 className="auth-title">Link Invalid</h1>
        <p className="auth-subtitle">{error}</p>
        <div className="auth-form"><button onClick={() => navigate('/login')} className="auth-submit-btn" style={{ width: '100%' }}>Back to Login</button></div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-gradient auth-gradient-1" /><div className="auth-gradient auth-gradient-2" /><div className="auth-gradient auth-gradient-3" /></div>
      <div className="auth-card">
        <div className="auth-logo-row"><img src="/logo.png" alt="Helios" className="auth-logo-img" /><span className="auth-logo-text">Helios</span></div>
        <h1 className="auth-title">Setup Your Account</h1>
        <p className="auth-subtitle">Set your name and password to get started</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <div className="auth-input-box" style={{ opacity: 0.7 }}>
              <Mail size={18} className="auth-input-icon" />
              <input type="email" readOnly value={email} style={{ cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-box">
              <User size={18} className="auth-input-icon" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} aria-label="Full Name" />
              {!name && <span className="auth-input-label">Full Name</span>}
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-box">
              <Lock size={18} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} aria-label="Password" />
              {!password && <span className="auth-input-label">Password</span>}
              <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          {/* Password strength — minimal visual only */}
          {password.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= strength ? strengthColors[strength] : '#E2E8F0', transition: 'background 0.25s' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: strengthColors[strength], minWidth: 40 }}>{strengthLabels[strength]}</span>
            </div>
          )}

          <div className="auth-input-group">
            <div className="auth-input-box">
              <Lock size={18} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)} aria-label="Confirm Password" />
              {!confirm && <span className="auth-input-label">Confirm Password</span>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn" style={{ width: '100%' }}>
            {loading ? <span className="auth-loader" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
