import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Shield, Check, X } from 'lucide-react';

const PERM_META = {
  can_create_task:    { label:'Create Tasks',    desc:'Can create new tasks in the workspace',          color:'#10B981' },
  can_edit_task:      { label:'Edit Tasks',      desc:'Can edit existing tasks',                        color:'#3B82F6' },
  can_delete_task:    { label:'Delete Tasks',    desc:'Can permanently delete tasks',                   color:'#EF4444' },
  can_assign_task:    { label:'Assign Tasks',    desc:'Can assign tasks to other team members',         color:'#8B5CF6' },
  can_view_all_tasks: { label:'View All Tasks',  desc:'Can see tasks from all users, not just their own', color:'#F59E0B' },
  can_manage_users:   { label:'Manage Users',    desc:'Can add, edit, and remove workspace members',   color:'#6366F1' },
};

const CARD = { background:'rgba(255,255,255,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', padding:'1.75rem' };

const Permissions = () => {
  const [users, setUsers]               = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissions, setPermissions]   = useState({ can_create_task:false, can_edit_task:false, can_delete_task:false, can_assign_task:false, can_view_all_tasks:false, can_manage_users:false });
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role !== 'admin'))).catch(() => toast.error('Failed to load users'));
  }, []);

  useEffect(() => {
    if (!selectedUserId) { setPermissions({ can_create_task:false, can_edit_task:false, can_delete_task:false, can_assign_task:false, can_view_all_tasks:false, can_manage_users:false }); return; }
    setLoading(true);
    api.get(`/permissions/${selectedUserId}`)
      .then(r => setPermissions({ can_create_task:!!r.data.can_create_task, can_edit_task:!!r.data.can_edit_task, can_delete_task:!!r.data.can_delete_task, can_assign_task:!!r.data.can_assign_task, can_view_all_tasks:!!r.data.can_view_all_tasks, can_manage_users:!!r.data.can_manage_users }))
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await api.put(`/permissions/${selectedUserId}`, permissions);
      const u = users.find(u => u.id === parseInt(selectedUserId));
      toast.success(`Permissions updated for ${u?.name || 'User'}`);
    } catch { toast.error('Failed to update permissions'); }
    finally { setSaving(false); }
  };

  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <div style={{padding:'2rem', display:'flex', flexDirection:'column', gap:'1.75rem'}}>

      {/* Header */}
      <div>
        <h2 style={{margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>Roles & Permissions</h2>
        <p style={{margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem'}}>Manage per-user permissions for workspace members</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:'1.5rem', alignItems:'start'}}>

        {/* Role Info */}
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          <div style={{...CARD, background:'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.04))', border:'1px solid rgba(99,102,241,0.15)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.85rem'}}>
              <div style={{background:'rgba(99,102,241,0.15)', padding:'0.55rem', borderRadius:'10px', color:'#6366F1', display:'flex'}}><Shield size={18}/></div>
              <h3 style={{margin:0, fontSize:'0.95rem', fontWeight:'700', color:'#4F46E5'}}>Admin Role</h3>
            </div>
            <p style={{margin:0, color:'#475569', fontSize:'0.82rem', lineHeight:1.6}}>Has full access. Can manage users, all tasks, and workspace settings without restrictions.</p>
          </div>
          <div style={{...CARD}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.85rem'}}>
              <div style={{background:'rgba(100,116,139,0.12)', padding:'0.55rem', borderRadius:'10px', color:'#64748B', display:'flex'}}><Shield size={18}/></div>
              <h3 style={{margin:0, fontSize:'0.95rem', fontWeight:'700', color:'#1E293B'}}>Member Role</h3>
            </div>
            <p style={{margin:0, color:'#475569', fontSize:'0.82rem', lineHeight:1.6}}>Base role. By default can only view and edit their own assigned tasks. Permissions can be extended below.</p>
          </div>
        </div>

        {/* Permission Editor */}
        <div style={CARD}>
          <h3 style={{margin:'0 0 1.25rem', fontSize:'1rem', fontWeight:'700', color:'#1E293B'}}>Edit User Permissions</h3>

          {/* User Select */}
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{display:'block', fontSize:'0.78rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem'}}>Select Member</label>
            <select value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}
              style={{width:'100%', background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'10px', padding:'0.65rem 0.9rem', fontSize:'0.875rem', color:'#1E293B', outline:'none', fontFamily:'inherit', cursor:'pointer'}}>
              <option value="">— Select a member —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>

          {/* Permissions Toggles */}
          {!selectedUserId ? (
            <div style={{textAlign:'center', padding:'2rem', color:'#94A3B8', fontSize:'0.875rem'}}>Select a member to manage their permissions</div>
          ) : loading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'2rem'}}>
              <div style={{width:32,height:32,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366F1',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
            </div>
          ) : (
            <>
              {selectedUser && (
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'12px', padding:'0.85rem 1rem'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',flexShrink:0}}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:'700', color:'#1E293B', fontSize:'0.875rem'}}>{selectedUser.name}</div>
                    <div style={{color:'#64748B', fontSize:'0.78rem'}}>{selectedUser.email}</div>
                  </div>
                </div>
              )}

              <div style={{display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1.5rem'}}>
                {Object.entries(PERM_META).map(([key, meta]) => (
                  <label key={key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1rem', background: permissions[key] ? `rgba(${meta.color === '#10B981' ? '16,185,129' : meta.color === '#3B82F6' ? '59,130,246' : meta.color === '#EF4444' ? '239,68,68' : meta.color === '#8B5CF6' ? '139,92,246' : meta.color === '#F59E0B' ? '245,158,11' : '99,102,241'},0.07)` : 'rgba(0,0,0,0.02)', border:`1px solid ${permissions[key] ? meta.color+'33' : 'rgba(0,0,0,0.06)'}`, borderRadius:'12px', cursor:'pointer', transition:'all 0.15s'}}>
                    <div>
                      <div style={{fontWeight:'700', color:'#1E293B', fontSize:'0.85rem'}}>{meta.label}</div>
                      <div style={{color:'#94A3B8', fontSize:'0.75rem', marginTop:'1px'}}>{meta.desc}</div>
                    </div>
                    <div onClick={()=>setPermissions(p=>({...p,[key]:!p[key]}))}
                      style={{width:44, height:24, borderRadius:'12px', background: permissions[key] ? meta.color : 'rgba(0,0,0,0.12)', transition:'all 0.2s', cursor:'pointer', display:'flex', alignItems:'center', padding:'2px', flexShrink:0, boxShadow: permissions[key] ? `0 2px 8px ${meta.color}55` : 'none'}}>
                      <div style={{width:20, height:20, borderRadius:'50%', background:'white', transition:'all 0.2s', transform: permissions[key] ? 'translateX(20px)' : 'translateX(0)', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        {permissions[key] ? <Check size={10} color={meta.color}/> : <X size={10} color="#94A3B8"/>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button onClick={handleSave} disabled={saving}
                style={{width:'100%', padding:'0.75rem', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', fontSize:'0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s', boxShadow:'0 4px 14px rgba(99,102,241,0.4)'}}>
                {saving ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/> : 'Save Permissions'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permissions;
