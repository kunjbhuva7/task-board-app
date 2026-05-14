import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
      toast.success('Welcome back!', { 
        style: { borderRadius: '12px', background: '#1E293B', color: '#fff' },
        icon: '👋'
      });
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials', { 
        style: { borderRadius: '12px', background: '#BE123C', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top right, #3B82F6, #1E3A8A, #0F172A)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative Circles */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '30%', height: '30%', background: 'rgba(30, 58, 138, 0.4)', borderRadius: '50%', filter: 'blur(100px)' }}></div>

      <div className="glass-login" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '3rem 2.5rem', 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'linear-gradient(135deg, #60A5FA, #2563EB)', 
            padding: '1.25rem', 
            borderRadius: '20px', 
            marginBottom: '1.5rem',
            boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
          }}>
            <ShieldCheck size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            TaskBoard <span style={{ color: '#60A5FA' }}>Pro</span>
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem' }}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input 
                type="email" 
                required 
                className="login-input-premium"
                placeholder="name@company.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', fontWeight: '600' }}>Password</label>
              <a href="#" style={{ color: '#60A5FA', fontSize: '0.8125rem', textDecoration: 'none' }}>Forgot?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="login-input-premium"
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  padding: '0'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn-premium"
            disabled={loading}
          >
            {loading ? <div className="spinner-fast" style={{ width: '22px', height: '22px' }}></div> : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>
            New here? <span style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: '600' }}>Contact Admin</span>
          </p>
        </div>
      </div>

      <style>{`
        .login-input-premium {
          width: 100%;
          height: 54px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 0 1rem 0 3rem;
          color: white;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .login-input-premium:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .login-btn-premium {
          width: 100%;
          height: 54px;
          background: #2563EB;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .login-btn-premium:hover {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        .login-btn-premium:active {
          transform: translateY(0);
        }
        .login-btn-premium:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default Login;
