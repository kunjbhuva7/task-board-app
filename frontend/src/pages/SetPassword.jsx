import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-token/${token}`);
        setEmail(res.data.email);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired token');
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/set-password', { token, password });
      toast.success('Password set successfully. You can now login.');
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(errItem => toast.error(errItem.msg));
      } else {
        toast.error(err.response?.data?.message || 'Failed to set password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><div className="spinner spinner-primary"></div></div>;
  }

  if (error) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', background:'var(--bg-main)'}}>
        <div className="card" style={{textAlign:'center', padding:'2rem'}}>
          <h3 style={{color:'var(--danger)', marginBottom:'1rem'}}>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{marginTop:'1rem'}}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', background:'var(--bg-main)'}}>
      <div className="card" style={{width:'100%', maxWidth:'400px'}}>
        <h2 style={{textAlign:'center', marginBottom:'1.5rem'}}>Set Your Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label className="label">Email</label>
            <input type="email" readOnly className="input" value={email} style={{background:'#F1F5F9'}} />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label className="label">New Password</label>
            <input type="password" required className="input" value={password} onChange={e=>setPassword(e.target.value)} />

          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label className="label">Confirm Password</label>
            <input type="password" required className="input" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
