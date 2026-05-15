import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity, User, FileText, Settings, Clock } from 'lucide-react';

const ACTION_COLORS = {
  'Create Task':  { bg:'rgba(16,185,129,0.1)',  color:'#059669', border:'rgba(16,185,129,0.2)'  },
  'Delete Task':  { bg:'rgba(239,68,68,0.1)',   color:'#DC2626', border:'rgba(239,68,68,0.2)'   },
  'Update Task':  { bg:'rgba(59,130,246,0.1)',  color:'#2563EB', border:'rgba(59,130,246,0.2)'  },
  'Create User':  { bg:'rgba(255,126,95,0.1)',  color:'#FF7E5F', border:'rgba(255,126,95,0.2)'  },
  'Delete User':  { bg:'rgba(239,68,68,0.1)',   color:'#DC2626', border:'rgba(239,68,68,0.2)'   },
  'Update User':  { bg:'rgba(245,158,11,0.1)',  color:'#D97706', border:'rgba(245,158,11,0.2)'  },
};

const TARGET_ICONS = { task: FileText, user: User, permission: Settings };

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    api.get('/activity').then(r => setActivities(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = activities.filter(a =>
    !search ||
    (a.user_name||'').toLowerCase().includes(search.toLowerCase()) ||
    a.action.toLowerCase().includes(search.toLowerCase()) ||
    (a.details||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem'}}>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem'}}>
        <div>
          <h2 style={{margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>Activity Log</h2>
          <p style={{margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem'}}>Track all actions taken across the workspace</p>
        </div>
        <div style={{position:'relative'}}>
          <input type="text" placeholder="Search activity…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{background:'rgba(255,255,255,0.7)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'10px', padding:'0.55rem 0.9rem 0.55rem 2.2rem', fontSize:'0.85rem', color:'#1E293B', outline:'none', width:220, fontFamily:'inherit'}}/>
          <Activity size={14} style={{position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#94A3B8'}}/>
        </div>
      </div>

      {/* Table */}
      <div style={{background:'rgba(255,255,255,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', overflow:'hidden'}}>
        {loading ? (
          <div style={{display:'flex', justifyContent:'center', padding:'4rem'}}>
            <div style={{width:36,height:36,border:'3px solid rgba(255,126,95,0.2)',borderTopColor:'#FF7E5F',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{padding:'4rem', textAlign:'center', color:'#94A3B8'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>📋</div>
            <div>No activity found</div>
          </div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'rgba(99,102,241,0.04)', borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                {['User','Action','Target','Details','Time'].map(h=>(
                  <th key={h} style={{padding:'0.85rem 1.1rem', textAlign:'left', fontSize:'0.71rem', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.07em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((act, i) => {
                const ac = ACTION_COLORS[act.action] || { bg:'rgba(100,116,139,0.1)', color:'#475569', border:'rgba(100,116,139,0.2)' };
                const TIcon = TARGET_ICONS[act.target_type] || FileText;
                return (
                  <tr key={act.id}
                    style={{borderBottom: i < filtered.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none', transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'0.9rem 1.1rem'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'0.6rem'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#FF7E5F,#FEB47B)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.68rem',fontWeight:'800',flexShrink:0}}>
                          {(act.user_name||'S').charAt(0).toUpperCase()}
                        </div>
                        <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.85rem'}}>{act.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td style={{padding:'0.9rem 1.1rem'}}>
                      <span style={{display:'inline-flex', alignItems:'center', background:ac.bg, color:ac.color, border:`1px solid ${ac.border}`, padding:'0.2rem 0.65rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700'}}>
                        {act.action}
                      </span>
                    </td>
                    <td style={{padding:'0.9rem 1.1rem'}}>
                      <span style={{display:'inline-flex', alignItems:'center', gap:'0.35rem', color:'#475569', fontSize:'0.82rem', textTransform:'capitalize'}}>
                        <TIcon size={13}/>{act.target_type}
                      </span>
                    </td>
                    <td style={{padding:'0.9rem 1.1rem', color:'#64748B', fontSize:'0.82rem', maxWidth:240, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                      {act.details || <span style={{color:'#CBD5E1'}}>—</span>}
                    </td>
                    <td style={{padding:'0.9rem 1.1rem'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'0.3rem', color:'#94A3B8', fontSize:'0.78rem'}}>
                        <Clock size={12}/>{new Date(act.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
