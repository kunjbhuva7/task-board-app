import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail]   = useState('');
  const [name, setName]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid invite link.'); setVerifying(false); return; }
    api.get(`/auth/verify-token/${token}`)
      .then(r => setEmail(r.data.email))
      .catch(err => setError(err.response?.data?.message || 'Invalid or expired link'))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/set-password', { token, name, password });
      toast.success('Account created! You can now log in.');
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.errors) err.response.data.errors.forEach(e => toast.error(e.msg));
      else toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inp = {
    width:'100%', height:'46px', padding:'0 14px', borderRadius:'12px',
    outline:'none', fontSize:'0.9rem',
    background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.1)',
    color:'#1E293B', transition:'all 0.2s',
  };
  const lbl = { display:'block', fontSize:'0.82rem', fontWeight:'700', color:'#334155', marginBottom:'6px' };

  if (verifying) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <div className="spinner" style={{ width:36, height:36, borderColor:'rgba(0,0,0,0.15)', borderTopcolor:'#1E293B' }}/>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <div style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(24px)', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.9)', padding:'2.5rem', textAlign:'center', maxWidth:'380px' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⚠️</div>
        <h3 style={{ color:'#1E293B', marginBottom:'0.75rem' }}>Link Invalid</h3>
        <p style={{ color:'#64748B', fontSize:'0.875rem', marginBottom:'1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/login')} className="btn" style={{ background:'white', color:'#6366F1', fontWeight:'700', padding:'0.6rem 1.5rem' }}>
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', padding:'1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'440px', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.9)', boxShadow:'0 24px 64px rgba(0,0,0,0.08)', padding:'3rem 2.5rem' }}>
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', marginBottom:'1.5rem' }}>
          <div style={{ width:'44px', height:'44px', background:'white', borderRadius:'12px', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'900', fontSize:'20px', color:'#6366F1', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>C</div>
          <span style={{ fontSize:'1.4rem', fontWeight:'800', color:'#1E293B' }}>Craftboard</span>
        </div>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:'800', color:'#1E293B', margin:'0 0 0.4rem' }}>Setup Your Account</h2>
          <p style={{ color:'#64748B', fontSize:'0.85rem', margin:0 }}>Set your name and password to get started</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={lbl}>Email</label>
            <input type="email" readOnly value={email} style={{ ...inp, opacity:0.7, cursor:'not-allowed' }}/>
          </div>
          <div>
            <label style={lbl}>Full Name</label>
            <input type="text" required placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} style={inp}
              onFocus={e => { e.target.style.background='rgba(255,255,255,0.9)'; e.target.style.borderColor='#6366F1'; }}
              onBlur={e => { e.target.style.background='rgba(255,255,255,0.8)'; e.target.style.borderColor='rgba(0,0,0,0.1)'; }}/>
          </div>
          <div>
            <label style={lbl}>Password</label>
            <input type="password" required placeholder="Min 8 chars, 1 number, 1 symbol" value={password} onChange={e => setPassword(e.target.value)} style={inp}
              onFocus={e => { e.target.style.background='rgba(255,255,255,0.9)'; e.target.style.borderColor='#6366F1'; }}
              onBlur={e => { e.target.style.background='rgba(255,255,255,0.8)'; e.target.style.borderColor='rgba(0,0,0,0.1)'; }}/>
          </div>
          <div>
            <label style={lbl}>Confirm Password</label>
            <input type="password" required placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inp}
              onFocus={e => { e.target.style.background='rgba(255,255,255,0.9)'; e.target.style.borderColor='#6366F1'; }}
              onBlur={e => { e.target.style.background='rgba(255,255,255,0.8)'; e.target.style.borderColor='rgba(0,0,0,0.1)'; }}/>
          </div>

          <button type="submit" disabled={loading} style={{ width:'100%', height:'48px', fontSize:'0.95rem', fontWeight:'700', borderRadius:'12px', background:'white', color:'#6366F1', border:'none', cursor: loading?'not-allowed':'pointer', display:'flex', justifyContent:'center', alignItems:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', marginTop:'0.4rem', transition:'all 0.2s' }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
            {loading ? <div className="spinner" style={{ borderColor:'rgba(99,102,241,0.3)', borderTopColor:'#6366F1' }}/> : 'Complete Setup →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
