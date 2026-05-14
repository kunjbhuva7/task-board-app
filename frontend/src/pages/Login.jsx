import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success('Logged in successfully', { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed', { style: { borderRadius: '10px', background: '#DC2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Centered Login Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <Lock size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please enter your details to login.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label" style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  required 
                  className="input" 
                  style={{ paddingLeft: '2.5rem', height: '48px', fontSize: '1rem', borderRadius: '10px' }} 
                  placeholder="name@example.com"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>
            
            <div>
              <label className="label" style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="input" 
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', height: '48px', fontSize: '1rem', borderRadius: '10px' }} 
                  placeholder="••••••••"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: '48px', fontSize: '1rem', marginTop: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s' }} 
              disabled={loading}
            >
              {loading ? <div className="spinner spinner-fast"></div> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
