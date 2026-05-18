import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Trash2, Mail, Copy, Power, UserPlus, Users as UsersIcon } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.filter(u => u.id !== currentUser.id && u.role !== 'admin'));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/users', formData);
      toast.success('User created & invite sent!');
      if (res.data.previewUrl) {
        toast((t) => (
          <span>Test email! <a href={res.data.previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF7E5F', fontWeight: 'bold' }}>View</a></span>
        ), { duration: 10000 });
      } else if (!res.data.emailSent && res.data.inviteLink) {
        toast('Email failed. Link: ' + res.data.inviteLink, { icon: '⚠️', duration: 10000 });
      }
      setShowModal(false);
      setFormData({ email: '', role: 'member' });
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
      toast.success('Invite resent!');
      if (res.data.previewUrl) {
        toast((t) => (
          <span>Email preview: <a href={res.data.previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF7E5F', fontWeight: 'bold' }}>View</a></span>
        ), { duration: 10000 });
      }
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend'); }
  };

  const handleToggleActive = async (userId) => {
    try {
      await api.put(`/users/${userId}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const confirmDelete = (userId) => { setUserToDelete(userId); setDeleteModalOpen(true); };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
    finally { setDeleteModalOpen(false); setUserToDelete(null); }
  };

  const copyInviteLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/set-password?token=${token}`);
    toast.success('Invite link copied!');
  };

  const inputSt = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    border: '1px solid rgba(226,232,240,0.8)', background: 'white',
    color: '#0F172A', outline: 'none', fontSize: '0.9rem', transition: 'border-color 0.2s'
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#0F172A' }}>Manage Users</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.875rem' }}>
            {users.length} member{users.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #FF7E5F, #FF7E5F)', color: 'white',
            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px',
            fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,126,95,0.4)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,126,95,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,126,95,0.4)'; }}>
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226,232,240,0.6)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,126,95,0.15)', borderTopColor: '#FF7E5F', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <UsersIcon size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>No users yet. Add your first team member.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,126,95,0.04)', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Invite Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}
                  style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(226,232,240,0.5)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,126,95,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Name */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FF7E5F,#FEB47B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>{u.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.875rem' }}>{u.email}</td>

                  {/* Role */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ background: 'rgba(255,126,95,0.08)', color: '#FF7E5F', border: '1px solid rgba(255,126,95,0.2)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                      color: u.is_active ? '#059669' : '#DC2626',
                      border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                      padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700'
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Invite Status */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {u.invite_token ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245,158,11,0.1)', color: '#D97706', border: '1px solid rgba(245,158,11,0.25)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                        Pending
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                        Joined
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {u.invite_token && (
                        <>
                          <button title="Resend Invite" onClick={() => handleResendInvite(u.id)}
                            style={{ background: 'rgba(255,126,95,0.08)', border: '1px solid rgba(255,126,95,0.2)', color: '#FF7E5F', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,126,95,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,126,95,0.08)'}>
                            <Mail size={15} />
                          </button>
                          <button title="Copy Invite Link" onClick={() => copyInviteLink(u.invite_token)}
                            style={{ background: 'rgba(255,126,95,0.08)', border: '1px solid rgba(255,126,95,0.2)', color: '#FF7E5F', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,126,95,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,126,95,0.08)'}>
                            <Copy size={15} />
                          </button>
                        </>
                      )}
                      <button title={u.is_active ? 'Deactivate User' : 'Activate User'} onClick={() => handleToggleActive(u.id)}
                        style={{
                          background: u.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                          border: `1px solid ${u.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                          color: u.is_active ? '#DC2626' : '#059669',
                          borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <Power size={15} />
                      </button>
                      <button title="Delete User" onClick={() => confirmDelete(u.id)}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add User Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ width: '100%', maxWidth: '460px', background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid rgba(226,232,240,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' }}>Add New User</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>An invite email will be sent automatically.</p>
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Email Address *</label>
                  <input type="email" required placeholder="" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={inputSt}
                    onFocus={e => e.target.style.borderColor = '#FF7E5F'}
                    onBlur={e => e.target.style.borderColor = 'rgba(226,232,240,0.8)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{ ...inputSt, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
                    onFocus={e => e.target.style.borderColor = '#FF7E5F'}
                    onBlur={e => e.target.style.borderColor = 'rgba(226,232,240,0.8)'}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226,232,240,0.6)', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(226,232,240,0.8)', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#FF7E5F,#FEB47B)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {submitting ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} /> : <><UserPlus size={16} /> Create & Invite</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setDeleteModalOpen(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Trash2 size={24} color="#DC2626" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A', fontSize: '1.15rem', fontWeight: '800' }}>Delete User?</h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.6 }}>This action is permanent and cannot be undone. The user and all their data will be removed.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteModalOpen(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(226,232,240,0.8)', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancel
              </button>
              <button onClick={executeDelete}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#DC2626', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
