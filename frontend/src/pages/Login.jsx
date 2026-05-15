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
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Glass Card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        padding: '3rem 2.5rem',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', marginBottom:'2rem' }}>
          <div style={{
            width:'48px', height:'48px',
            background: 'white',
            borderRadius:'14px',
            display:'flex', justifyContent:'center', alignItems:'center',
            fontWeight:'900', fontSize:'22px', color:'#6366F1',
            boxShadow:'0 4px 16px rgba(0,0,0,0.15)'
          }}>C</div>
          <span style={{ fontSize:'1.5rem', fontWeight:'800', color:'white', letterSpacing:'-0.5px' }}>Craftboard</span>
        </div>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.6rem', fontWeight:'800', color:'white', margin:'0 0 0.4rem', letterSpacing:'-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', margin:0 }}>
            Sign in to manage your tasks
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:'700', color:'rgba(255,255,255,0.85)', marginBottom:'6px', letterSpacing:'0.02em' }}>
              Email Address
            </label>
            <input
              type="email" required
              placeholder="admin@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                width:'100%', height:'46px', padding:'0 14px',
                borderRadius:'12px', outline:'none', fontSize:'0.9rem',
                background:'rgba(255,255,255,0.2)',
                border:'1px solid rgba(255,255,255,0.35)',
                color:'white', backdropFilter:'blur(8px)',
                transition:'all 0.2s',
              }}
              onFocus={e => { e.target.style.background='rgba(255,255,255,0.28)'; e.target.style.borderColor='rgba(255,255,255,0.7)'; }}
              onBlur={e => { e.target.style.background='rgba(255,255,255,0.2)'; e.target.style.borderColor='rgba(255,255,255,0.35)'; }}
            />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'0.82rem', fontWeight:'700', color:'rgba(255,255,255,0.85)', marginBottom:'6px', letterSpacing:'0.02em' }}>
              Password
            </label>
            <input
              type="password" required
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{
                width:'100%', height:'46px', padding:'0 14px',
                borderRadius:'12px', outline:'none', fontSize:'0.9rem',
                background:'rgba(255,255,255,0.2)',
                border:'1px solid rgba(255,255,255,0.35)',
                color:'white', backdropFilter:'blur(8px)',
                transition:'all 0.2s',
              }}
              onFocus={e => { e.target.style.background='rgba(255,255,255,0.28)'; e.target.style.borderColor='rgba(255,255,255,0.7)'; }}
              onBlur={e => { e.target.style.background='rgba(255,255,255,0.2)'; e.target.style.borderColor='rgba(255,255,255,0.35)'; }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width:'100%', height:'48px',
              fontSize:'0.95rem', fontWeight:'700',
              borderRadius:'12px',
              background: loading ? 'rgba(255,255,255,0.5)' : 'white',
              color:'#6366F1', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', justifyContent:'center', alignItems:'center',
              boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
              transition:'all 0.2s', marginTop:'0.4rem',
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
          >
            {loading
              ? <div className="spinner" style={{ borderColor:'rgba(99,102,241,0.3)', borderTopColor:'#6366F1' }}></div>
              : 'Sign In →'
            }
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.5rem', color:'rgba(255,255,255,0.55)', fontSize:'0.8rem' }}>
          Admin credentials provided by your manager
        </p>
      </div>

      {/* Floating orbs for depth */}
      <div style={{ position:'fixed', top:'15%', right:'20%', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'20%', left:'15%', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
    </div>
  );
};

export default Login;
