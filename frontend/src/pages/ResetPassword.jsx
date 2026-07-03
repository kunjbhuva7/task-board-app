import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

// Defined at module level (NOT inside the component) so its subtree is not
// remounted on every keystroke — that would make inputs lose focus.
const Shell = ({ children }) => (
  <div style={{
    display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
    padding: '1.5rem', fontFamily: "'Inter', sans-serif",
    backgroundColor: '#FAF9F6', position: 'relative', overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
    }} />
    <div style={{
      position: 'absolute', top: '-10%', right: '-5%', width: '800px', height: '800px',
      background: 'radial-gradient(circle, rgba(255, 183, 130, 0.25) 0%, rgba(255,255,255,0) 70%)',
      filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none'
    }} />
    <div style={{
      position: 'absolute', bottom: '-20%', left: '-10%', width: '900px', height: '900px',
      background: 'radial-gradient(circle, rgba(130, 224, 255, 0.25) 0%, rgba(255,255,255,0) 70%)',
      filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none'
    }} />
    <div style={{
      position: 'absolute', top: '20%', left: '15%', width: '600px', height: '600px',
      background: 'radial-gradient(circle, rgba(255, 236, 179, 0.3) 0%, rgba(255,255,255,0) 70%)',
      filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none'
    }} />
    <div style={{
      position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px',
      background: 'transparent', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
      borderRadius: '24px', border: '1px solid rgba(255,255,255,0.9)',
      boxShadow: '0 24px 64px rgba(239, 130, 80, 0.08)', padding: '3rem 2.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Pur<span style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>p</span>le
        </span>
      </div>
      {children}
    </div>
  </div>
);

const inp = {
  width: '100%', height: '46px', padding: '0 14px', borderRadius: '12px',
  outline: 'none', fontSize: '0.9rem',
  background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)',
  color: '#1E293B', transition: 'all 0.2s',
};
const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px', letterSpacing: '0.02em' };

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid reset link.'); setVerifying(false); return; }
    api.get(`/auth/verify-reset-token/${token}`)
      .then(r => setEmail(r.data.email))
      .catch(err => setError(err.response?.data?.message || 'Invalid or expired link'))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset! You can now log in.');
      await new Promise(resolve => setTimeout(resolve, 2500));
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.errors) err.response.data.errors.forEach(er => toast.error(er.msg));
      else toast.error(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (verifying) return (
    <Shell>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#FF7E5F', animationDuration: '0.5s' }} />
      </div>
    </Shell>
  );

  if (error) return (
    <Shell>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ color: '#1E293B', margin: '0 0 0.5rem', fontSize: '1.3rem' }}>Link Invalid</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{error}</p>
        <button
          onClick={() => navigate('/forgot-password')}
          style={{
            width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: '700', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,126,95,0.3)',
          }}
        >
          Request a new link
        </button>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', margin: '0 0 0.4rem', letterSpacing: '-0.5px' }}>Set a new password</h2>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={lbl}>Email</label>
          <input type="email" readOnly value={email} style={{ ...inp, opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
        <div>
          <label style={lbl}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: '64px' }}
              onFocus={e => { e.target.style.borderColor = '#FF7E5F'; e.target.style.boxShadow = '0 0 0 3px rgba(255,126,95,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none'; }} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.78rem', fontWeight: '700' }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label style={lbl}>Confirm New Password</label>
          <input type={showPw ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)} style={inp}
            onFocus={e => { e.target.style.borderColor = '#FF7E5F'; e.target.style.boxShadow = '0 0 0 3px rgba(255,126,95,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none'; }} />
        </div>

        <p style={{ color: '#94A3B8', fontSize: '0.75rem', margin: '0', lineHeight: 1.5 }}>
          Must be 8+ characters with an uppercase letter, a number, and a special character.
        </p>

        <button type="submit" disabled={loading} style={{
          width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: '700', borderRadius: '12px',
          background: loading ? 'rgba(255,126,95,0.7)' : 'linear-gradient(135deg, #FF7E5F, #FEB47B)',
          color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 4px 16px rgba(255,126,95,0.3)', marginTop: '0.4rem', transition: 'all 0.2s',
        }}>
          {loading ? <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', animationDuration: '0.4s' }} /> : 'Reset Password'}
        </button>
      </form>
    </Shell>
  );
};

export default ResetPassword;
