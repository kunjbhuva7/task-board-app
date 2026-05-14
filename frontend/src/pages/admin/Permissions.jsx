import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Permissions = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissions, setPermissions] = useState({
    can_create_task: false,
    can_edit_task: false,
    can_delete_task: false,
    can_assign_task: false,
    can_view_all_tasks: false,
    can_manage_users: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data.filter(u => u.role !== 'admin')); // Only manage members
      } catch (err) {
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setPermissions({
        can_create_task: false, can_edit_task: false, can_delete_task: false,
        can_assign_task: false, can_view_all_tasks: false, can_manage_users: false,
      });
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/permissions/${selectedUserId}`);
        setPermissions({
          can_create_task: !!res.data.can_create_task,
          can_edit_task: !!res.data.can_edit_task,
          can_delete_task: !!res.data.can_delete_task,
          can_assign_task: !!res.data.can_assign_task,
          can_view_all_tasks: !!res.data.can_view_all_tasks,
          can_manage_users: !!res.data.can_manage_users,
        });
      } catch (err) {
        toast.error('Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [selectedUserId]);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await api.put(`/permissions/${selectedUserId}`, permissions);
      const user = users.find(u => u.id === parseInt(selectedUserId));
      toast.success(`Permissions updated for ${user?.name || 'User'}`);
    } catch (err) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPermissions(prev => ({ ...prev, [name]: checked }));
  };

  const formatKeyName = (key) => {
    return key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Roles & Permissions</h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem'}}>
        <div className="card" style={{alignSelf: 'start'}}>
          <h3 style={{marginBottom:'1.5rem', color: 'var(--text-primary)'}}>Role Definitions</h3>
          <div style={{marginBottom:'1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.1)'}}>
            <h4 style={{color: 'var(--primary-dark)', marginBottom: '0.5rem'}}>Admin</h4>
            <p className="text-secondary" style={{fontSize:'0.9rem', lineHeight: '1.5'}}>Has full access to the system. Can manage users, roles, and view all tasks without restrictions.</p>
          </div>
          <div style={{padding: '1rem', background: '#F1F5F9', borderRadius: '8px', border: '1px solid var(--border)'}}>
            <h4 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Member</h4>
            <p className="text-secondary" style={{fontSize:'0.9rem', lineHeight: '1.5'}}>Base role. Can only view and edit their own assigned tasks by default. Permissions can be customized on a per-user basis.</p>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:'1.5rem'}}>User Permissions</h3>
          <div style={{marginBottom:'2rem'}}>
            <label className="label">Select Member</label>
            <select className="input" style={{padding: '0.75rem', fontSize: '1rem'}} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">-- Select a user --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            loading ? (
              <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>
            ) : (
              <div>
                <div style={{display:'flex', flexDirection:'column', gap:'1.25rem', marginBottom:'2rem'}}>
                  {Object.keys(permissions).map(key => (
                    <label key={key} style={{display:'flex', alignItems:'center', justifyContent: 'space-between', cursor:'pointer', paddingBottom: '1rem', borderBottom: '1px solid var(--border)'}}>
                      <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>{formatKeyName(key)}</span>
                      <div className="toggle-switch">
                        <input 
                          type="checkbox" 
                          name={key}
                          checked={permissions[key]} 
                          onChange={handleCheckboxChange} 
                        />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{width:'100%', padding: '0.75rem'}}>
                  {saving ? <div className="spinner"></div> : 'Save Permissions'}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Permissions;
