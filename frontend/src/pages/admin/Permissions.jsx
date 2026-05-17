import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Shield, CheckSquare, Square, Search, Save, AlertCircle } from 'lucide-react';

const PERM_CATEGORIES = {
  global: {
    label: 'Global Modifiers',
    items: [
      { key: 'is_super_admin', label: 'Super Admin Access', desc: 'Grants full system access unconditionally' },
      { key: 'is_read_only', label: 'Read-Only Access', desc: 'Prevents all modifications globally' }
    ]
  },
  users: {
    label: 'Users & Roles',
    items: [
      { key: 'can_view_users', label: 'View Users', desc: 'Can view the user directory' },
      { key: 'can_create_users', label: 'Create Users', desc: 'Can invite or create new users' },
      { key: 'can_edit_users', label: 'Edit Users', desc: 'Can edit user details' },
      { key: 'can_delete_users', label: 'Delete Users', desc: 'Can remove users from workspace' },
      { key: 'can_manage_roles', label: 'Manage Roles', desc: 'Can change user roles' },
      { key: 'can_manage_users', label: 'Manage Users (Legacy)', desc: 'Full user management' },
    ]
  },
  tasks: {
    label: 'Task & Project Management',
    items: [
      { key: 'can_view_all_tasks', label: 'View All Tasks', desc: 'See tasks from all users' },
      { key: 'can_create_task', label: 'Create Tasks', desc: 'Create new tasks' },
      { key: 'can_edit_task', label: 'Edit Tasks', desc: 'Modify existing tasks' },
      { key: 'can_delete_task', label: 'Delete Tasks', desc: 'Permanently remove tasks' },
      { key: 'can_manage_tasks', label: 'Manage Tasks', desc: 'Super override over all tasks' },
      { key: 'can_approve_requests', label: 'Approve Requests', desc: 'Approve task status changes' },
      { key: 'can_view_projects', label: 'View Projects', desc: 'Access the projects page' },
      { key: 'can_manage_projects', label: 'Manage Projects', desc: 'Create, edit, and delete projects' },
    ]
  },
  admin: {
    label: 'Admin & System',
    items: [
      { key: 'can_view_analytics', label: 'View Analytics', desc: 'Access dashboard metrics' },
      { key: 'can_view_reports', label: 'View Reports', desc: 'Generate and view reports' },
      { key: 'can_export_data', label: 'Export Data', desc: 'Export system data' },
      { key: 'can_manage_settings', label: 'Manage Settings', desc: 'Modify workspace settings' },
      { key: 'can_manage_events', label: 'Manage Calendar', desc: 'Create and edit calendar events' },
      { key: 'can_manage_notifications', label: 'Manage Notifications', desc: 'Configure alert settings' },
    ]
  }
};

const ALL_KEYS = Object.values(PERM_CATEGORIES).flatMap(cat => cat.items.map(i => i.key));

const TEMPLATES = {
  admin: ALL_KEYS.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  manager: Object.fromEntries(ALL_KEYS.map(key => [key, [
    'can_view_all_tasks', 'can_create_task', 'can_edit_task', 'can_approve_requests',
    'can_view_users', 'can_view_analytics', 'can_manage_events'
  ].includes(key)])),
  editor: Object.fromEntries(ALL_KEYS.map(key => [key, [
    'can_view_all_tasks', 'can_create_task', 'can_edit_task', 'can_manage_events'
  ].includes(key)])),
  viewer: Object.fromEntries(ALL_KEYS.map(key => [key, [
    'can_view_all_tasks', 'can_view_users', 'is_read_only'
  ].includes(key)])),
};

const CARD = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  padding: '2rem'
};

const Permissions = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissions, setPermissions] = useState(Object.fromEntries(ALL_KEYS.map(k => [k, false])));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role !== 'admin'))).catch(() => toast.error('Failed to load users'));
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setPermissions(Object.fromEntries(ALL_KEYS.map(k => [k, false])));
      return;
    }
    setLoading(true);
    api.get(`/permissions/${selectedUserId}`)
      .then(r => {
        const perms = {};
        ALL_KEYS.forEach(k => perms[k] = !!r.data[k]);
        setPermissions(perms);
      })
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await api.put(`/permissions/${selectedUserId}`, permissions);
      const u = users.find(u => u.id === parseInt(selectedUserId));
      toast.success(`Permissions updated successfully for ${u?.name || 'User'}!`);
    } catch { toast.error('Failed to update permissions'); }
    finally { setSaving(false); }
  };

  const applyTemplate = (templateName) => {
    setPermissions(TEMPLATES[templateName]);
    toast.success(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template applied! Don't forget to save.`);
  };

  const toggleAll = (val) => {
    setPermissions(Object.fromEntries(ALL_KEYS.map(k => [k, val])));
  };

  const togglePerm = (key) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  const filteredCategories = Object.entries(PERM_CATEGORIES).map(([catKey, cat]) => {
    return {
      ...cat,
      items: cat.items.filter(item => item.label.toLowerCase().includes(search.toLowerCase()) || item.desc.toLowerCase().includes(search.toLowerCase()))
    };
  }).filter(cat => cat.items.length > 0);

  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header */}
      <div style={{ marginTop: '2rem', padding: '0 2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em' }}>Roles & Permissions</h2>
        <p style={{ margin: '0.4rem 0 0', color: '#64748B', fontSize: '0.95rem' }}>Fine-tune system access and capabilities for your workspace members.</p>
      </div>

      <div style={{ padding: '0 2rem', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Panel - Selection & Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={CARD}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#FF7E5F" /> Edit User Permissions
            </h3>
            
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Select Member</label>
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
              style={{ width: '100%', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1E293B', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
              onFocus={e => e.target.style.borderColor = '#FF7E5F'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
              <option value="">— Choose a user —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
        </div>

        {/* Right Panel - Checkboxes */}
        <div style={CARD}>
          {!selectedUserId ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94A3B8' }}>
              <Shield size={48} color="rgba(255,126,95,0.3)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Please select a user from the left panel to edit permissions.</p>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(255,126,95,0.2)', borderTopColor: '#FF7E5F', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1rem' }}>
                <div style={{ position: 'relative', width: '250px' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Search permissions..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '0.5rem 1rem 0.5rem 2.2rem', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleAll(true)} style={{ background: 'transparent', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Select All</button>
                  <button onClick={() => toggleAll(false)} style={{ background: 'transparent', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Deselect All</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {filteredCategories.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,126,95,0.2)', paddingBottom: '0.4rem', display: 'inline-block', width: 'max-content' }}>
                      {cat.label}
                    </h4>
                    {cat.items.map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', group: 'true' }}>
                        <div onClick={() => togglePerm(item.key)} style={{ display: 'flex', marginTop: '2px' }}>
                          {permissions[item.key] ? 
                            <CheckSquare size={18} color="#FF7E5F" fill="rgba(255,126,95,0.1)" /> : 
                            <Square size={18} color="#CBD5E1" />
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '700', color: permissions[item.key] ? '#1E293B' : '#475569', transition: 'color 0.1s' }}>{item.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              {filteredCategories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.9rem' }}>No permissions match your search.</div>
              )}

              <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', color: 'white', border: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(255,126,95,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { if(!saving) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {saving ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} /> : <><Save size={18} /> Save Settings</>}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permissions;
