import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { Search, Filter, Trash2, CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';

const PRIORITY_STYLES = {
  low:    { bg:'rgba(59,130,246,0.1)',  color:'#2563EB', border:'rgba(59,130,246,0.2)'  },
  medium: { bg:'rgba(245,158,11,0.1)', color:'#D97706', border:'rgba(245,158,11,0.2)'  },
  high:   { bg:'rgba(239,68,68,0.1)',  color:'#DC2626', border:'rgba(239,68,68,0.2)'   },
  urgent: { bg:'rgba(220,38,38,0.15)', color:'#B91C1C', border:'rgba(220,38,38,0.3)'   },
};

const STATUS_STYLES = {
  todo:        { bg:'rgba(100,116,139,0.1)', color:'#475569', border:'rgba(100,116,139,0.2)', icon: Circle      },
  in_progress: { bg:'rgba(59,130,246,0.1)',  color:'#2563EB', border:'rgba(59,130,246,0.2)',  icon: Clock       },
  review:      { bg:'rgba(249,115,22,0.1)',  color:'#C2410C', border:'rgba(249,115,22,0.2)',  icon: AlertCircle },
  done:        { bg:'rgba(16,185,129,0.1)',  color:'#059669', border:'rgba(16,185,129,0.2)',  icon: CheckCircle },
};

const AllTasks = () => {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const { canDeleteTask }           = usePermissions();
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch]                 = useState('');

  const fetchTasks = async () => {
    try { const res = await api.get('/tasks'); setTasks(res.data); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Task deleted'); fetchTasks(); }
    catch { toast.error('Failed to delete task'); }
  };

  const filtered = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sel = { background:'rgba(255,255,255,0.7)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'10px', padding:'0.55rem 0.85rem', fontSize:'0.85rem', color:'#1E293B', outline:'none', cursor:'pointer', fontFamily:'inherit' };

  return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem', minHeight:'100%' }}>

      {/* ── Page Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B' }}>All Tasks</h2>
          <p style={{ margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem' }}>
            Manage and monitor all tasks across the workspace
          </p>
        </div>
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'12px', padding:'0.6rem 1.1rem', fontSize:'0.85rem', fontWeight:'700', color:'#6366F1' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ background:'rgba(255,255,255,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', padding:'1.1rem 1.25rem', display:'flex', gap:'0.85rem', alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:'200px', position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}/>
          <input
            type="text" placeholder="Search tasks..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...sel, width:'100%', paddingLeft:'2.1rem' }}
          />
        </div>
        <select style={sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select style={sel} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {(search || filterStatus || filterPriority) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#DC2626', borderRadius:'10px', padding:'0.55rem 0.85rem', fontSize:'0.82rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background:'rgba(255,255,255,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div style={{ width:36, height:36, border:'3px solid rgba(99,102,241,0.2)', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin 0.9s linear infinite' }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'4rem', textAlign:'center', color:'#94A3B8', fontSize:'0.9rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📋</div>
            No tasks found
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'rgba(99,102,241,0.04)', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                {['Title','Status','Priority','Assigned To','Due Date', canDeleteTask && 'Actions'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding:'0.85rem 1.1rem', textAlign:'left', fontSize:'0.71rem', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const ss = STATUS_STYLES[t.status] || STATUS_STYLES.todo;
                const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium;
                const SIcon = ss.icon;
                return (
                  <tr key={t.id}
                    style={{ borderBottom: i < filtered.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'0.9rem 1.1rem', fontWeight:'600', color:'#1E293B', fontSize:'0.875rem', maxWidth:220, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {t.title}
                    </td>
                    <td style={{ padding:'0.9rem 1.1rem' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, padding:'0.22rem 0.65rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700' }}>
                        <SIcon size={11}/>{t.status.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ padding:'0.9rem 1.1rem' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', background:ps.bg, color:ps.color, border:`1px solid ${ps.border}`, padding:'0.22rem 0.65rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', textTransform:'capitalize' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:ps.color, flexShrink:0 }}/>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding:'0.9rem 1.1rem', color:'#475569', fontSize:'0.875rem' }}>
                      {t.assignee_name ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.68rem', fontWeight:'800', flexShrink:0 }}>
                            {t.assignee_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize:'0.875rem', color:'#1E293B', fontWeight:'500' }}>{t.assignee_name}</span>
                        </div>
                      ) : (
                        <span style={{ color:'#94A3B8', fontSize:'0.82rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding:'0.9rem 1.1rem', color:'#475569', fontSize:'0.875rem', whiteSpace:'nowrap' }}>
                      {t.due_date ? (
                        <span style={{ fontWeight:'600', color: new Date(t.due_date) < new Date() && t.status !== 'done' ? '#EF4444' : '#374151' }}>
                          {new Date(t.due_date).toLocaleDateString('en-GB')}
                        </span>
                      ) : <span style={{ color:'#CBD5E1' }}>—</span>}
                    </td>
                    {canDeleteTask && (
                      <td style={{ padding:'0.9rem 1.1rem' }}>
                        <button onClick={() => handleDelete(t.id)}
                          style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', background:'rgba(239,68,68,0.08)', color:'#DC2626', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'0.35rem 0.75rem', fontSize:'0.8rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; }}>
                          <Trash2 size={13}/> Delete
                        </button>
                      </td>
                    )}
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

export default AllTasks;
