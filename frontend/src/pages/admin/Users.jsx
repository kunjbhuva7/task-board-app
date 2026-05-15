import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Trash2, Mail, Copy, Power } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  
  // Custom delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // Filter out the current admin from the list so they can't delete themselves
      setUsers(res.data.filter(u => u.id !== currentUser.id && u.role !== 'admin'));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/users', formData);
      toast.success('User created successfully');
      
      if (res.data.previewUrl) {
        toast((t) => (
          <span>
            Test email sent! <a href={res.data.previewUrl} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline'}}>View Email</a>
          </span>
        ), { duration: 10000 });
      } else if (!res.data.emailSent && res.data.inviteLink) {
        toast('Email failed. Invite link: ' + res.data.inviteLink, { icon: '⚠️', duration: 10000 });
      }

      setShowModal(false);
      setFormData({ name: '', email: '', role: 'member' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/resend-invite`);
      toast.success('Invite resent successfully');
      
      if (res.data.previewUrl) {
        toast((t) => (
          <span>
            Test email sent! <a href={res.data.previewUrl} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline'}}>View Email</a>
          </span>
        ), { duration: 10000 });
      } else if (!res.data.emailSent && res.data.inviteLink) {
        toast('Email failed. Invite link: ' + res.data.inviteLink, { icon: '⚠️', duration: 10000 });
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invite');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await api.put(`/users/${userId}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = (userId) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/set-password?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Manage Users</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add New User</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Invite Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign:'center'}}><div className="spinner spinner-primary" style={{margin:'0 auto'}}></div></td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span style={{textTransform:'capitalize'}}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-done' : 'badge-todo'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {u.invite_token ? (
                    <span className="badge badge-review">Pending</span>
                  ) : (
                    <span className="badge badge-done">Joined</span>
                  )}
                </td>
                <td>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    {u.invite_token && (
                      <>
                        <button className="btn btn-secondary" style={{padding:'0.25rem 0.5rem'}} onClick={() => handleResendInvite(u.id)} title="Resend Invite"><Mail size={16}/></button>
                        <button className="btn btn-secondary" style={{padding:'0.25rem 0.5rem'}} onClick={() => copyInviteLink(u.invite_token)} title="Copy Invite Link"><Copy size={16}/></button>
                      </>
                    )}
                    <button className="btn btn-secondary" style={{padding:'0.25rem 0.5rem'}} onClick={() => handleToggleActive(u.id)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                      <Power size={16} color={u.is_active ? 'var(--danger)' : 'var(--success)'} />
                    </button>
                    <button className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}} onClick={() => confirmDelete(u.id)} title="Delete"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan="6" style={{textAlign:'center'}} className="text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)}>
          <div className="modal-content" style={{maxWidth: '450px', padding: '2.5rem', borderRadius: '16px'}}>
            <h3 style={{marginBottom:'2rem', fontSize: '1.25rem', color: '#F8FAFC', fontWeight: '700'}}>Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{marginBottom:'1.5rem'}}>
                <label className="label" style={{marginBottom: '0.5rem', color: '#475569', fontWeight: '600'}}>Email Address</label>
                <input type="email" required className="input" placeholder="e.g. name@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.95rem'}} />
              </div>
              <div style={{marginBottom:'2rem'}}>
                <label className="label" style={{marginBottom: '0.5rem', color: '#475569', fontWeight: '600'}}>Role</label>
                <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.95rem'}}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:'1rem'}}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{background: 'white', color: '#475569', border: '1px solid #E2E8F0', padding: '0.6rem 1.2rem', fontWeight: '600'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{background: '#F8FAFC', color:'#1E293B', padding: '0.6rem 1.2rem', fontWeight: '600', border: 'none'}}>
                  {submitting ? <div className="spinner"></div> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setDeleteModalOpen(false)}>
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center'}}>
            <h3 style={{marginBottom:'1rem'}}>Delete User</h3>
            <p style={{marginBottom: '2rem', color: 'var(--text-secondary)'}}>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div style={{display:'flex', justifyContent:'center', gap:'1rem'}}>
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={executeDelete}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
