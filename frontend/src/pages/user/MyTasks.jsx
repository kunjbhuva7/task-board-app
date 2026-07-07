import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronRight, Trash2, Calendar, Edit2 } from 'lucide-react';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from '../../components/TaskModal';
import { io } from 'socket.io-client';

const GROUPS = [
  { id: 'todo',        label: 'To-do' },
  { id: 'in_progress', label: 'On Progress' },
  { id: 'review',      label: 'In Review' },
  { id: 'done',        label: 'Done' },
];

const pc = p => {
  if (p === 'high' || p === 'urgent') return { bg:'#FEE2E2', text:'#DC2626', dot:'#EF4444' };
  if (p === 'low') return { bg:'#DBEAFE', text:'#2563EB', dot:'#3B82F6' };
  return { bg:'#FEF3C7', text:'#D97706', dot:'#F59E0B' };
};

const KanbanCard = ({ task, onEdit, onDelete, canEdit, canDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const pColor = pc(task.priority);
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className="kanban-card-hover"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
        background: '#ffffff', borderRadius:'14px', padding:'1.2rem',
        boxShadow: isDragging ? '0 12px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)', cursor:'grab',
        border:'1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
        
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div style={{ fontWeight:'700', color:'#1E293B', fontSize:'0.95rem', lineHeight: '1.3' }}>{task.title}</div>
        <span style={{ 
          background: pColor.bg, color: pColor.text, fontSize: '0.65rem', fontWeight: '700', 
          padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
          whiteSpace: 'nowrap', marginLeft: '8px' 
        }}>{task.priority}</span>
      </div>
      
      <div style={{ fontSize:'0.85rem', color:'#64748B', marginBottom:'1.2rem', lineHeight:1.5,
        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {task.description || <span style={{ color:'#94A3B8', fontStyle:'italic' }}>No description</span>}
      </div>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #F1F5F9', paddingTop:'0.8rem' }}>
        <span style={{ fontSize:'0.75rem', color:'#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
          <Calendar size={13} color="#94A3B8" />
          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No date'}
        </span>
        <div style={{ display:'flex', gap:'6px' }} onPointerDown={e => e.stopPropagation()}>
          {canEdit && <button className="icon-btn-hover" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', cursor:'pointer', color:'#64748B', padding:'5px', display:'flex', borderRadius:'6px' }} onClick={() => onEdit(task)}><Edit2 size={13}/></button>}
          {canDelete && <button className="icon-btn-hover" style={{ background:'#FEF2F2', border:'1px solid #FEE2E2', cursor:'pointer', color:'#EF4444', padding:'5px', display:'flex', borderRadius:'6px' }} onClick={() => onDelete(task.id)}><Trash2 size={13}/></button>}
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const [tasks, setTasks]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [collapsed, setCollapsed]   = useState({});
  const [dropdown, setDropdown]     = useState(null);
  const [dropdownPos, setDropdownPos] = useState({top:0, right:0});
  const [activeTab, setActiveTab]   = useState('list');
  const [dragTask, setDragTask]     = useState(null);
  const [search, setSearch]         = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const fetchTasks = async () => {
    try { const r = await api.get('/tasks'); setTasks(r.data); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin' || canCreateTask)
      api.get('/users').then(r => setUsers(r.data)).catch(() => {});
    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', fetchTasks);
    return () => s.disconnect();
  }, [user, canCreateTask]);

  useEffect(() => {
    const close = () => setDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const changeStatus = async (id, status) => {
    setDropdown(null);
    setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
    try { await api.patch(`/tasks/${id}/status`, { status }); }
    catch { toast.error('Failed'); fetchTasks(); }
  };

  const deleteTask = async id => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Deleted'); fetchTasks(); }
    catch { toast.error('Failed to delete'); }
  };

  const onDragEnd = ({ active, over }) => {
    setDragTask(null);
    if (!over) return;
    const t = tasks.find(x => x.id === active.id);
    const ov = tasks.find(x => x.id === over.id);
    const ns = ov ? ov.status : over.id;
    if (t && t.status !== ns) {
      const curIdx = GROUPS.findIndex(g => g.id === t.status);
      const newIdx = GROUPS.findIndex(g => g.id === ns);
      if (newIdx > curIdx) {
        changeStatus(t.id, ns);
      } else {
        toast.error("Tasks can only be moved forward!");
      }
    }
  };

  const filtered = tasks.filter(t =>
    (t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description||'').toLowerCase().includes(search.toLowerCase())) &&
    (filterPriority === 'all' || t.priority === filterPriority)
  );

  const today = new Date();

  // styles
  const hdrStyle = { padding:'1.25rem 1.75rem 0', background:'transparent', borderBottom:'1px solid rgba(0,0,0,0.08)' };
  const tabSt = active => ({ padding:'0.8rem 0', cursor:'pointer', fontWeight: active?'700':'500', fontSize:'0.875rem', color: active?'#FF7E5F':'#64748B', borderBottom: active?'2px solid #FF7E5F':'2px solid transparent', transition:'all 0.2s' });
  const btnGlass = { display:'flex', alignItems:'center', gap:'0.4rem', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', padding:'0.4rem 0.9rem', borderRadius:'9px', fontWeight:'600', color:'#1E293B', cursor:'pointer', fontSize:'0.82rem' };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'transparent' }}>

      {/* ── Header ── */}
      <div style={hdrStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <h1 style={{ fontSize:'1.4rem', fontWeight:'800', color:'var(--text-primary)', margin:0, letterSpacing:'-0.3px' }}>
              Helios
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:'1.75rem' }}>
            {['kanban','timeline','list'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={tabSt(activeTab===tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', paddingBottom:'0.5rem' }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'#64748B' }}/>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding:'0.4rem 0.9rem 0.4rem 2rem', borderRadius:'8px', border:'1px solid rgba(0,0,0,0.1)', outline:'none', width:'160px', fontSize:'0.82rem', background:'rgba(255,255,255,0.7)', color:'#1E293B' }}/>
            </div>
            
            {/* Filter */}
            <div style={{ position:'relative', display:'flex', alignItems:'center', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', padding:'0.2rem 0.6rem', borderRadius:'9px' }}>
              <Filter size={13} color="#64748B" style={{marginRight:'0.3rem'}}/>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                style={{ background:'transparent', border:'none', outline:'none', color:'#1E293B', fontSize:'0.82rem', fontWeight:'600', appearance:'none', cursor:'pointer' }}>
                <option value="all" style={{color:'black'}}>All Priorities</option>
                <option value="high" style={{color:'black'}}>High</option>
                <option value="medium" style={{color:'black'}}>Medium</option>
                <option value="low" style={{color:'black'}}>Low</option>
              </select>
            </div>

            {canCreateTask && (
              <button onClick={() => { setEditingTask(null); setShowModal(true); }}
                style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'linear-gradient(135deg,#FF7E5F,#FEB47B)', border:'none', padding:'0.45rem 1rem', borderRadius:'9px', fontWeight:'700', color:'white', cursor:'pointer', fontSize:'0.82rem', boxShadow:'0 4px 12px rgba(255,126,95,0.3)', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <Plus size={13}/> New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.75rem' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div className="spinner" style={{ width:36, height:36, borderColor:'rgba(0,0,0,0.15)', borderTopcolor:'#1E293B' }}></div>
          </div>
        ) : (
          <>
            {/* KANBAN */}
            {activeTab === 'kanban' && (
              <DndContext collisionDetection={closestCorners}
                onDragStart={e => setDragTask(tasks.find(t => t.id === e.active.id))}
                onDragEnd={onDragEnd}>
                <div className="kanban-board">
                  {GROUPS.map(g => (
                    <div key={g.id} className="kanban-column">
                      <div className="kanban-column-header">
                        {g.label} <span className="badge">{filtered.filter(t=>t.status===g.id).length}</span>
                      </div>
                      <div className="kanban-cards">
                        <SortableContext id={g.id} items={filtered.filter(t=>t.status===g.id).map(t=>t.id)} strategy={verticalListSortingStrategy}>
                          {filtered.filter(t => t.status===g.id).map(task => (
                            <KanbanCard key={task.id} task={task}
                              onEdit={t => { setEditingTask(t); setShowModal(true); }}
                              onDelete={deleteTask} canEdit={canEditTask} canDelete={canDeleteTask}/>
                          ))}
                        </SortableContext>
                      </div>
                    </div>
                  ))}
                </div>
                <DragOverlay>
                  {dragTask && <div className="kanban-card" style={{ opacity:0.85 }}><strong>{dragTask.title}</strong></div>}
                </DragOverlay>
              </DndContext>
            )}

            {/* TIMELINE */}
            {activeTab === 'timeline' && (
              <div style={{ background:'rgba(0,0,0,0.02)', backdropFilter:'blur(20px)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                  <Calendar size={17} color="white"/>
                  <h3 style={{ color:'#1E293B', margin:0, fontSize:'0.95rem', fontWeight:'700' }}>
                    Timeline — {today.toLocaleString('default',{month:'long',year:'numeric'})}
                  </h3>
                </div>
                <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {filtered.filter(t => t.due_date).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)).map(task => {
                    const due = new Date(task.due_date);
                    const overdue = due < today && task.status !== 'done';
                    const daysLeft = Math.ceil((due - today)/(1000*60*60*24));
                    const col = pc(task.priority);
                    return (
                      <div key={task.id} style={{ background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'12px', padding:'0.9rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
                        <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:col.dot, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:'700', color:'#1E293B', fontSize:'0.875rem', marginBottom:'0.15rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</div>
                          <div style={{ fontSize:'0.75rem', color:'#64748B' }}>{task.description || 'No description'}</div>
                        </div>
                        <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:'0.82rem', fontWeight:'700', color: overdue?'#EF4444':'#1E293B' }}>
                            {due.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                          </div>
                          <div style={{ fontSize:'0.7rem', color: overdue?'#EF4444': daysLeft<=3?'#F59E0B':'#64748B', fontWeight:'600' }}>
                            {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft===0 ? 'Due today' : `${daysLeft}d left`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.filter(t=>!t.due_date).length > 0 && (
                    <div style={{ background:'rgba(0,0,0,0.04)', borderRadius:'10px', padding:'0.7rem 1.25rem', color:'#64748B', fontSize:'0.8rem', textAlign:'center' }}>
                      {filtered.filter(t=>!t.due_date).length} task(s) have no due date
                    </div>
                  )}
                  {filtered.length === 0 && (
                    <div style={{ padding:'2rem', textAlign:'center', color:'#64748B' }}>No tasks yet</div>
                  )}
                </div>
              </div>
            )}

            {/* LIST */}
            {activeTab === 'list' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {GROUPS.map(group => {
                  const gTasks = filtered.filter(t => t.status === group.id);
                  if (gTasks.length === 0 && group.id !== 'todo' && group.id !== 'in_progress') return null;
                  const isCol = collapsed[group.id];
                  return (
                    <div key={group.id} style={{ background:'rgba(255,255,255,0.5)', backdropFilter:'blur(20px)', borderRadius:'16px', border:'1px solid rgba(255,126,95,0.1)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                      {/* Group header */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.8rem 1.1rem', background:'rgba(255,255,255,0.7)', borderBottom: isCol?'none':'1px solid rgba(0,0,0,0.08)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer' }} onClick={() => setCollapsed(p => ({...p,[group.id]:!p[group.id]}))}>
                          {isCol ? <ChevronRight size={16} color="#64748B"/> : <ChevronDown size={16} color="#64748B"/>}
                          <span style={{ fontWeight:'700', color:'#1E293B', fontSize:'0.875rem' }}>{group.label}</span>
                          <span style={{ background:'rgba(0,0,0,0.08)', color:'#1E293B', padding:'0.1rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>{gTasks.length}</span>
                        </div>
                        {canCreateTask && (
                          <button title="Add task" onClick={() => { setEditingTask(null); setShowModal(true); }}
                            style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748B', display:'flex', padding:'3px', borderRadius:'6px' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#1E293B'; e.currentTarget.style.background='rgba(0,0,0,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color='#64748B'; e.currentTarget.style.background='transparent'; }}>
                            <Plus size={16}/>
                          </button>
                        )}
                      </div>

                      {/* Rows */}
                      {!isCol && gTasks.length > 0 && (
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                            <thead>
                              <tr>
                                <th style={{ width:36, padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent', color:'#64748B', fontWeight:'600', textTransform:'none', letterSpacing:0 }}></th>
                                <th style={{ padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent', color:'#64748B', fontWeight:'600', textTransform:'none', letterSpacing:0 }}>Task Name</th>
                                <th style={{ padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent', color:'#64748B', fontWeight:'600', textTransform:'none', letterSpacing:0 }}>Description</th>
                                <th style={{ padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent', color:'#64748B', fontWeight:'600', textTransform:'none', letterSpacing:0 }}>Due Date</th>
                                <th style={{ padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent', color:'#64748B', fontWeight:'600', textTransform:'none', letterSpacing:0 }}>Priority</th>
                                <th style={{ width:36, padding:'0.65rem 0.9rem', borderBottom:'1px solid rgba(241,245,249,0.8)', background:'transparent' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {gTasks.map(task => {
                                const col = pc(task.priority);
                                return (
                                  <tr key={task.id}
                                    onMouseEnter={e => e.currentTarget.style.background='rgba(124,111,247,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                    <td style={{ padding:'0.8rem 0.9rem' }}>
                                      <div style={{ width:15, height:15, border:'2px solid #CBD5E1', borderRadius:'4px' }}/>
                                    </td>
                                    <td style={{ padding:'0.8rem 0.9rem', fontWeight:'700', color:'#1E293B', whiteSpace:'nowrap' }}>{task.title}</td>
                                    <td style={{ padding:'0.8rem 0.9rem', color:'#64748B', maxWidth:180, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                      {task.description || <span style={{ color:'#CBD5E1' }}>—</span>}
                                    </td>
                                    <td style={{ padding:'0.8rem 0.9rem', color:'#374151', fontWeight:'600', whiteSpace:'nowrap' }}>
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : <span style={{ color:'#CBD5E1' }}>No date</span>}
                                    </td>
                                    <td style={{ padding:'0.8rem 0.9rem' }}>
                                      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', background:col.bg, color:col.text, padding:'0.2rem 0.55rem', borderRadius:'6px', fontSize:'0.72rem', fontWeight:'700' }}>
                                        <span style={{ width:6, height:6, borderRadius:'50%', background:col.dot }}/>
                                        {task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}
                                      </span>
                                    </td>
                                    <td style={{ padding:'0.8rem 0.9rem', textAlign:'right', position:'relative' }}>
                                      <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748B', display:'flex', padding:'3px', borderRadius:'6px' }}
                                        onClick={e => {
                                          e.stopPropagation();
                                          if (dropdown === task.id) { setDropdown(null); return; }
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                          setDropdown(task.id);
                                        }}>
                                        <MoreHorizontal size={16}/>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {!isCol && gTasks.length === 0 && (
                        <div style={{ padding:'1.25rem', textAlign:'center', color:'#CBD5E1', fontSize:'0.82rem' }}>
                          No tasks here yet{canCreateTask && <span style={{ color:'#FF7E5F', cursor:'pointer', marginLeft:'0.3rem' }} onClick={() => { setEditingTask(null); setShowModal(true); }}>— Add one</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed dropdown — rendered outside clipped containers */}
      {dropdown && (() => {
        const dt = tasks.find(t => t.id === dropdown);
        if (!dt) return null;
        return (
          <div style={{ position:'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex:9999, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'12px', boxShadow:'0 12px 36px rgba(0,0,0,0.15)', width:170, padding:'0.4rem 0', animation:'fadeIn 0.15s ease' }}>
            <div style={{ padding:'0.35rem 0.9rem', fontSize:'0.68rem', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Change Status</div>
            {GROUPS.filter((g, i) => i > GROUPS.findIndex(x => x.id === dt.status)).map(g => (
              <div key={g.id} onClick={() => changeStatus(dt.id, g.id)}
                style={{ padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.85rem', color:'#1E293B', fontWeight:'500' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                Move to {g.label}
              </div>
            ))}
            {GROUPS.findIndex(x => x.id === dt.status) === GROUPS.length - 1 && (
              <div style={{ padding:'0.45rem 0.9rem', fontSize:'0.8rem', color:'#94A3B8', fontStyle:'italic' }}>Already completed</div>
            )}
            {canEditTask && dt.status !== 'done' && (
              <>
                <div style={{ height:1, background:'rgba(0,0,0,0.07)', margin:'0.35rem 0' }}/>
                <div onClick={() => { setDropdown(null); setEditingTask(dt); setShowModal(true); }}
                  style={{ padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.85rem', color:'#1E293B' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  ✏️ Edit Task
                </div>
              </>
            )}
            {canDeleteTask && (
              <div onClick={() => { setDropdown(null); deleteTask(dt.id); }}
                style={{ padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.85rem', color:'#EF4444' }}
                onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                🗑️ Delete Task
              </div>
            )}
          </div>
        );
      })()}

      {showModal && (
        <TaskModal task={editingTask} users={users}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchTasks(); }}/>
      )}
    </div>
  );
};

export default MyTasks;
