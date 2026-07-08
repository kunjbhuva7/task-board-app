import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [passData, setPassData] = useState({ current: '', newPass: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [emailNotif, setEmailNotif] = useState(user?.email_notifications !== 0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(prev => prev || user.name || '');
      setEmailNotif(user.email_notifications !== 0);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/auth/profile`, { name });
      toast.success('Profile updated');
      fetchUser();
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirm) return toast.error('Passwords do not match');
    setPassLoading(true);
    try {
      const res = await api.put('/auth/password', { current: passData.current, newPass: passData.newPass });
      toast.success(res.data.message || 'Password updated successfully');
      setPassData({ current: '', newPass: '', confirm: '' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      if (err.response?.data?.errors) {
        toast.error(err.response.data.errors[0].msg);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setPassLoading(false);
    }
  };

  const handleToggleNotif = async () => {
    const next = !emailNotif;
    setEmailNotif(next);
    setNotifLoading(true);
    try {
      await api.put('/auth/notification-preferences', { email_notifications: next });
      toast.success(next ? 'Email notifications enabled' : 'Email notifications disabled');
      fetchUser();
    } catch (err) {
      setEmailNotif(!next);
      toast.error('Failed to update preference');
    } finally {
      setNotifLoading(false);
    }
  };

  const memberSince = user?.created_at
    ? new Date((user.created_at || '').replace(' ', 'T')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member';

  // Password strength
  const pwv = passData.newPass;
  const checks = {
    len: pwv.length >= 8,
    num: /\d/.test(pwv),
    upper: /[A-Z]/.test(pwv),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwv),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#E2E8F0', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  const cardStyle = {
    background: 'var(--glass-strong)', backdropFilter: 'blur(24px)',
    border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.04)'
  };
  const cardTitle = { margin: '0 0 1.25rem', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: '700' };
  const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' };
  const inputStyle = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)',
    background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', transition: 'border-color 0.2s'
  };
  const primaryBtn = {
    background: '#0F172A', color: 'white', border: 'none',
    padding: '0.8rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.25rem', transition: 'all 0.2s'
  };
  const eyeBtn = {
    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
    background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '7px',
    cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '700', padding: '5px 9px'
  };

  // Plain render helper (NOT a component) so inputs keep focus while typing
  const pwField = (label, field) => (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[field] ? 'text' : 'password'} required value={passData[field]}
          onChange={e => setPassData(prev => ({ ...prev, [field]: e.target.value }))}
          style={{ ...inputStyle, paddingRight: '64px' }}
          onFocus={e => e.target.style.borderColor = '#FF7E5F'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="button" style={eyeBtn} onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}>
          {show[field] ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>Settings & Profile</h2>
        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage your account details and security.</p>
      </div>

      <div className="settings-grid">
        {/* LEFT COLUMN */}
        <div className="settings-col">
          {/* Profile Information */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>Profile Information</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" readOnly value={user.email}
                  style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={lbl}>Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#FF7E5F'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <button type="submit" disabled={loading} style={primaryBtn}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', animationDuration: '0.4s' }}></div> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['Role', <span key="r" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#FF7E5F', background: 'rgba(255,126,95,0.12)', padding: '0.25rem 0.7rem', borderRadius: '999px' }}>● {roleLabel}</span>],
                ['Status', <span key="s" style={{ fontSize: '0.78rem', fontWeight: '700', color: user?.is_active ? '#10B981' : '#EF4444', background: user?.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', padding: '0.25rem 0.7rem', borderRadius: '999px' }}>{user?.is_active ? 'Active' : 'Inactive'}</span>],
                ['Member since', <span key="m" style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.88rem' }}>{memberSince}</span>],
                ['User ID', <span key="i" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.88rem' }}>#{user?.id}</span>],
              ].map(([k, v], idx, arr) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{k}</span>
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="settings-col">
          {/* Security */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>Security</h3>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {pwField('Current Password', 'current')}
              {pwField('New Password', 'newPass')}

              {pwv.length > 0 && (
                <div style={{ marginTop: '-0.4rem' }}>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '0.4rem' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: '5px', borderRadius: '999px', background: i <= strength ? strengthColors[strength] : '#E2E8F0', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: strengthColors[strength] }}>{strengthLabels[strength]} password</span>
                </div>
              )}

              {pwField('Confirm New Password', 'confirm')}

              <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: 0, lineHeight: 1.5 }}>
                Must be 8+ characters with an uppercase letter, a number, and a special character.
              </p>
              <button type="submit" disabled={passLoading} style={primaryBtn}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {passLoading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', animationDuration: '0.4s' }}></div> : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Notifications */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>Notifications</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Email Notifications</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                  Receive email alerts for expenses and important activity
                </div>
              </div>
              <div
                role="switch"
                aria-checked={emailNotif}
                onClick={() => { if (!notifLoading) handleToggleNotif(); }}
                style={{
                  width: 50, height: 28, borderRadius: 999, cursor: notifLoading ? 'wait' : 'pointer', flexShrink: 0,
                  background: emailNotif ? 'linear-gradient(135deg,#FF7E5F,#FEB47B)' : '#CBD5E1',
                  position: 'relative', transition: 'background 0.25s', opacity: notifLoading ? 0.7 : 1
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: emailNotif ? 25 : 3, width: 22, height: 22,
                  borderRadius: '50%', background: 'white', transition: 'left 0.25s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
