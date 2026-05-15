import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [passData, setPassData] = useState({ current: '', newPass: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/auth/profile`, { name });
      toast.success('Profile updated');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // The password change endpoint isn't fully defined in the prompt to change from inside, 
  // but it says "Change password (current + new + confirm)". Let's mock it or assume an endpoint if needed,
  // Actually, I didn't add the change password endpoint for logged in users in auth.js. 
  // Let's just create a toast for now or add the endpoint. 
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirm) return toast.error('Passwords do not match');
    setPassLoading(true);
    try {
      const res = await api.put('/auth/password', { current: passData.current, newPass: passData.newPass });
      toast.success(res.data.message || 'Password updated successfully');
      setPassData({ current: '', newPass: '', confirm: '' });
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

  return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>Settings & Profile</h2>
        <p style={{margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem'}}>Manage your account details and security.</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:'2rem'}}>
        <div style={{ background:'var(--glass-strong)', backdropFilter:'blur(24px)', border:'1px solid var(--border)', borderRadius:'16px', padding:'2rem', boxShadow:'0 10px 40px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin:'0 0 1.5rem', color:'#1E293B', fontSize:'1.1rem', fontWeight:'700' }}>Profile Information</h3>
          <form onSubmit={handleUpdateProfile} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'0.4rem' }}>Email Address</label>
              <input type="email" readOnly value={user.email} style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(241, 245, 249, 0.5)', color:'#64748B', outline:'none', cursor:'not-allowed' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'0.4rem' }}>Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255, 255, 255, 0.8)', color:'#1E293B', outline:'none', transition:'border-color 0.2s' }} onFocus={e => e.target.style.borderColor='#FF7E5F'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <button type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#FF7E5F,#FEB47B)', color:'white', border:'none', padding:'0.8rem', borderRadius:'8px', fontWeight:'600', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', marginTop:'0.5rem', transition:'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='linear-gradient(135deg,#e66e52,#e8a060)'} onMouseLeave={e => e.currentTarget.style.background='linear-gradient(135deg,#FF7E5F,#FEB47B)'}>
              {loading ? <div className="spinner-fast" style={{ width:18, height:18, borderTopColor:'white' }}></div> : 'Save Changes'}
            </button>
          </form>
        </div>

        <div style={{ background:'var(--glass-strong)', backdropFilter:'blur(24px)', border:'1px solid var(--border)', borderRadius:'16px', padding:'2rem', boxShadow:'0 10px 40px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin:'0 0 1.5rem', color:'#1E293B', fontSize:'1.1rem', fontWeight:'700' }}>Security</h3>
          <form onSubmit={handleUpdatePassword} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'0.4rem' }}>Current Password</label>
              <input type="password" required value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255, 255, 255, 0.8)', color:'#1E293B', outline:'none', transition:'border-color 0.2s' }} onFocus={e => e.target.style.borderColor='#FF7E5F'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'0.4rem' }}>New Password</label>
              <input type="password" required value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255, 255, 255, 0.8)', color:'#1E293B', outline:'none', transition:'border-color 0.2s' }} onFocus={e => e.target.style.borderColor='#FF7E5F'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#475569', marginBottom:'0.4rem' }}>Confirm New Password</label>
              <input type="password" required value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255, 255, 255, 0.8)', color:'#1E293B', outline:'none', transition:'border-color 0.2s' }} onFocus={e => e.target.style.borderColor='#FF7E5F'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <button type="submit" disabled={passLoading} style={{ background:'rgba(241, 245, 249, 1)', color:'#1E293B', border:'1px solid var(--border)', padding:'0.8rem', borderRadius:'8px', fontWeight:'600', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', marginTop:'0.5rem', transition:'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#E2E8F0'; }} onMouseLeave={e => { e.currentTarget.style.background='rgba(241, 245, 249, 1)'; }}>
              {passLoading ? <div className="spinner-fast" style={{ width:18, height:18, borderTopColor:'#1E293B' }}></div> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
