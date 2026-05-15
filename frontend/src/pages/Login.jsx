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
      toast.success('Welcome back!');
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
      display: 'flex', minHeight: '100vh',
      alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Inter', sans-serif",
      // Beautiful light gradient (peach/orange -> light blue -> white)
      background: 'linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 50%, #F1F5F9 100%)'
    }}>
      {/* Light Glass Card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
        padding: '3rem 2.5rem',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', marginBottom:'2rem' }}>
          <div style={{
            width:'48px', height:'48px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius:'14px',
            display:'flex', justifyContent:'center', alignItems:'center',
            fontWeight:'900', fontSize:'22px', color:'white',
            boxShadow:'0 4px 16px rgba(99,102,241,0.3)'
          }}>C</div>
          <span style={{ fontSize:'1.5rem', fontWeight:'800', color:'#1E293B', letterSpacing:'-0.5px' }}>Craftboard</span>
        </div>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.6rem', fontWeight:'800', color:'#1E293B', margin:'0 0 0.4rem', letterSpacing:'-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ color:'#64748B', fontSize:'0.9rem', margin:0 }}>
            Sign in to manage your tasks
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:'700', color:'#334155', marginBottom:'6px', letterSpacing:'0.02em' }}>
              Email Address
            </label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                width:'100%', height:'46px', padding:'0 14px',
                borderRadius:'12px', outline:'none', fontSize:'0.9rem',
                background:'rgba(255,255,255,0.9)',
                border:'1px solid rgba(0,0,0,0.08)',
                color:'#1E293B',
                transition:'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor='#6366F1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(0,0,0,0.08)'; e.target.style.boxShadow='none'; }}
            />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:'700', color:'#334155', marginBottom:'6px', letterSpacing:'0.02em' }}>
              Password
            </label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              style={{
                width:'100%', height:'46px', padding:'0 14px',
                borderRadius:'12px', outline:'none', fontSize:'0.9rem',
                background:'rgba(255,255,255,0.9)',
                border:'1px solid rgba(0,0,0,0.08)',
                color:'#1E293B',
                transition:'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor='#6366F1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(0,0,0,0.08)'; e.target.style.boxShadow='none'; }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width:'100%', height:'48px',
              fontSize:'0.95rem', fontWeight:'700',
              borderRadius:'12px',
              background: loading ? 'rgba(99,102,241,0.7)' : '#6366F1',
              color:'white', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', justifyContent:'center', alignItems:'center',
              boxShadow:'0 4px 16px rgba(99,102,241,0.3)',
              transition:'all 0.2s', marginTop:'0.4rem',
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
          >
            {loading
              ? <div className="spinner" style={{ borderColor:'rgba(255,255,255,0.3)', borderTopColor:'white' }}></div>
              : 'Sign In'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
