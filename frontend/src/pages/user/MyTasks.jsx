import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronRight, Edit2, Trash2, Calendar } from 'lucide-react';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from '../../components/TaskModal';
import { io } from 'socket.io-client';

// --- KANBAN CARD ---
const SortableTask = ({ task, onEdit, onDelete, canEdit, canDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`kanban-card priority-${task.priority}`}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.25rem'}}>
        <strong style={{fontSize:'0.95rem', color:'#0F172A', fontWeight:'700', lineHeight:'1.4'}}>{task.title}</strong>
      </div>
      <div style={{fontSize:'0.85rem', color:'#64748B', marginBottom:'1rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:'1.5'}}>
        {task.description || <span style={{fontStyle:'italic', color:'#CBD5E1'}}>No description</span>}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #F1F5F9', paddingTop:'0.75rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:'#94A3B8', fontWeight:'500'}}>
          <Calendar size={14} color="#CBD5E1" />
          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : 'No date'}
        </div>
        <div style={{display:'flex', gap:'0.35rem', alignItems:'center'}} onPointerDown={e => e.stopPropagation()}>
          {canEdit && (
            <button style={{background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer', padding:'4px', display:'flex', borderRadius:'4px'}}
              onClick={() => onEdit(task)}
              onMouseEnter={e => { e.currentTarget.style.color='#2563EB'; e.currentTarget.style.background='#EFF6FF'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#94A3B8'; e.currentTarget.style.background='transparent'; }}>
              <Edit2 size={14}/>
            </button>
          )}
          {canDelete && (
            <button style={{background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer', padding:'4px', display:'flex', borderRadius:'4px'}}
              onClick={() => onDelete(task.id)}
              onMouseEnter={e => { e.currentTarget.style.color='#EF4444'; e.currentTarget.style.background='#FEF2F2'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#94A3B8'; e.currentTarget.style.background='transparent'; }}>
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DroppableColumn = ({ id, title, tasks, onEdit, onDelete, canEdit, canDelete }) => (
  <div className="kanban-column">
    <div className="kanban-column-header">
      {title} <span className="badge badge-todo">{tasks.length}</span>
    </div>
    <div className="kanban-cards">
      <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <SortableTask key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
        ))}
      </SortableContext>
    </div>
  </div>
);

// --- MAIN ---
const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const [tasks, setTasks]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [activeDropdown, setActiveDropdown]   = useState(null);
  const [activeTab, setActiveTab]   = useState('list');
  const [activeDragTask, setActiveDragTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try { const res = await api.get('/users'); setUsers(res.data); } catch {}
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin' || canCreateTask) fetchUsers();
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.on('tasks_updated', fetchTasks);
    return () => socket.disconnect();
  }, [user, canCreateTask]);

  useEffect(() => {
    const close = () => setActiveDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggleGroup = id => setCollapsedGroups(p => ({ ...p, [id]: !p[id] }));

  const handleDelete = async id => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Task deleted'); fetchTasks(); }
    catch { toast.error('Failed to delete task'); }
  };

  const changeTaskStatus = async (id, status) => {
    setActiveDropdown(null);
    setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
    try { await api.patch(`/tasks/${id}/status`, { status }); toast.success('Status updated'); }
    catch { toast.error('Failed to update status'); fetchTasks(); }
  };

  const onDragEnd = async ({ active, over }) => {
    setActiveDragTask(null);
    if (!over) return;
    const drag = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    const newStatus = overTask ? overTask.status : over.id;
    if (drag && drag.status !== newStatus) changeTaskStatus(drag.id, newStatus);
  };

  const groups = [
    { id: 'todo',        label: 'To-do' },
    { id: 'in_progress', label: 'On Progress' },
    { id: 'review',      label: 'In Review' },
    { id: 'done',        label: 'Done' },
  ];

  const getPriorityColor = p => {
    if (p === 'high' || p === 'urgent') return { bg:'#FEF2F2', text:'#EF4444', dot:'#EF4444' };
    if (p === 'low') return { bg:'#EFF6FF', text:'#3B82F6', dot:'#3B82F6' };
    return { bg:'#FFFBEB', text:'#F59E0B', dot:'#F59E0B' };
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabStyle = active => ({
    padding: '1rem 0',
    color: active ? '#111827' : '#9CA3AF',
    fontWeight: active ? '700' : '600',
    cursor: 'pointer',
    borderBottom: active ? '3px solid #111827' : '3px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'linear-gradient(135deg, #f8fafc 0%, #eff6ff 60%, #faf5ff 100%)' }}>

      {/* ── Header ── */}
      <div style={{ padding:'2rem 2.5rem 0 2.5rem', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)', borderBottom:'1px solid #F1F5F9' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,#5266F9,#7C3AED)', borderRadius:'10px', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'bold', fontSize:'1.2rem' }}>C</div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:'800', color:'#111827', margin:0, letterSpacing:'-0.5px' }}>Craftboard Project</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ display:'flex' }}>
              {[user.name.charAt(0).toUpperCase()].map((l, i) => (
                <div key={i} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#5266F9', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'12px', color:'white', border:'2px solid white', fontWeight:'bold' }}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:'2rem' }}>
            {['kanban', 'timeline', 'list'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', paddingBottom:'0.5rem' }}>
            <div style={{ position:'relative' }}>
              <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding:'0.5rem 1rem 0.5rem 2.2rem', borderRadius:'8px', border:'1px solid #E5E7EB', outline:'none', width:'180px', fontSize:'0.875rem', background:'white' }}
              />
            </div>
            <button style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'white', border:'1px solid #E5E7EB', padding:'0.5rem 1rem', borderRadius:'8px', fontWeight:'600', color:'#374151', cursor:'pointer', fontSize:'0.875rem' }}>
              <Filter size={15} /> Filter
            </button>
            {canCreateTask && (
              <button
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg,#111827,#374151)', border:'none', padding:'0.5rem 1.1rem', borderRadius:'8px', fontWeight:'600', color:'white', cursor:'pointer', fontSize:'0.875rem', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}
                onClick={() => { setEditingTask(null); setShowModal(true); }}>
                <Plus size={15} /> New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'2rem 2.5rem' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : (
          <>
            {/* KANBAN */}
            {activeTab === 'kanban' && (
              <DndContext collisionDetection={closestCorners} onDragStart={e => setActiveDragTask(tasks.find(t => t.id === e.active.id))} onDragEnd={onDragEnd}>
                <div className="kanban-board" style={{ height:'auto', paddingBottom:'2rem' }}>
                  {groups.map(g => (
                    <DroppableColumn
                      key={g.id} id={g.id} title={g.label}
                      tasks={filteredTasks.filter(t => t.status === g.id)}
                      onEdit={t => { setEditingTask(t); setShowModal(true); }}
                      onDelete={handleDelete}
                      canEdit={canEditTask}
                      canDelete={canDeleteTask}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeDragTask ? (
                    <div className={`kanban-card priority-${activeDragTask.priority}`} style={{ opacity:0.85, boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }}>
                      <strong>{activeDragTask.title}</strong>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* TIMELINE */}
            {activeTab === 'timeline' && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'300px', color:'#94A3B8', background:'white', borderRadius:'16px', border:'1px solid #F1F5F9' }}>
                <Calendar size={48} style={{ marginBottom:'1rem', opacity:0.4 }} />
                <h3 style={{ color:'#64748B', marginBottom:'0.5rem' }}>Timeline View</h3>
                <p style={{ fontSize:'0.875rem' }}>Coming soon to Craftboard!</p>
              </div>
            )}

            {/* LIST */}
            {activeTab === 'list' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                {groups.map(group => {
                  const groupTasks = filteredTasks.filter(t => t.status === group.id);
                  if (groupTasks.length === 0 && group.id !== 'todo' && group.id !== 'in_progress') return null;
                  const isCollapsed = collapsedGroups[group.id];

                  return (
                    <div key={group.id} style={{ background:'white', borderRadius:'12px', border:'1px solid #F1F5F9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                      {/* Group Header */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.9rem 1.25rem', background:'#FAFAFA', borderBottom: isCollapsed ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }} onClick={() => toggleGroup(group.id)}>
                          {isCollapsed
                            ? <ChevronRight size={17} color="#9CA3AF" />
                            : <ChevronDown size={17} color="#9CA3AF" />
                          }
                          <span style={{ fontWeight:'700', color:'#1F2937', fontSize:'0.9rem' }}>{group.label}</span>
                          <span style={{ background:'#EEF0FF', color:'#5266F9', padding:'0.1rem 0.5rem', borderRadius:'6px', fontSize:'0.72rem', fontWeight:'700' }}>{groupTasks.length}</span>
                        </div>
                        {/* Only show + if user can create tasks */}
                        {canCreateTask && (
                          <button
                            title="Add task"
                            style={{ background:'transparent', border:'none', cursor:'pointer', color:'#CBD5E1', display:'flex', padding:'4px', borderRadius:'6px', transition:'all 0.2s' }}
                            onClick={() => { setEditingTask(null); setShowModal(true); }}
                            onMouseEnter={e => { e.currentTarget.style.color='#5266F9'; e.currentTarget.style.background='#EEF0FF'; }}
                            onMouseLeave={e => { e.currentTarget.style.color='#CBD5E1'; e.currentTarget.style.background='transparent'; }}>
                            <Plus size={17} />
                          </button>
                        )}
                      </div>

                      {/* Group Rows */}
                      {!isCollapsed && groupTasks.length > 0 && (
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                            <thead>
                              <tr>
                                <th style={{ width:'40px', padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent' }}></th>
                                <th style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent', color:'#9CA3AF', fontWeight:'600', textTransform:'none', letterSpacing:'0', fontSize:'0.8rem' }}>Task Name</th>
                                <th style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent', color:'#9CA3AF', fontWeight:'600', textTransform:'none', letterSpacing:'0', fontSize:'0.8rem' }}>Description</th>
                                <th style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent', color:'#9CA3AF', fontWeight:'600', textTransform:'none', letterSpacing:'0', fontSize:'0.8rem' }}>Due Date</th>
                                <th style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent', color:'#9CA3AF', fontWeight:'600', textTransform:'none', letterSpacing:'0', fontSize:'0.8rem' }}>Assigned</th>
                                <th style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent', color:'#9CA3AF', fontWeight:'600', textTransform:'none', letterSpacing:'0', fontSize:'0.8rem' }}>Priority</th>
                                <th style={{ width:'40px', padding:'0.75rem 1rem', borderBottom:'1px solid #F1F5F9', background:'transparent' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupTasks.map(task => {
                                const pc = getPriorityColor(task.priority);
                                return (
                                  <tr key={task.id} style={{ borderBottom:'1px solid #F9FAFB', transition:'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background='#FAFBFF'}
                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                    <td style={{ padding:'0.9rem 1rem' }}>
                                      <div style={{ width:'16px', height:'16px', border:'2px solid #E5E7EB', borderRadius:'4px', cursor:'pointer' }}></div>
                                    </td>
                                    <td style={{ padding:'0.9rem 1rem', fontWeight:'600', color:'#1F2937', whiteSpace:'nowrap' }}>{task.title}</td>
                                    <td style={{ padding:'0.9rem 1rem', color:'#6B7280', maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                      {task.description || <span style={{ color:'#D1D5DB', fontStyle:'italic' }}>—</span>}
                                    </td>
                                    <td style={{ padding:'0.9rem 1rem', color:'#374151', fontWeight:'500', whiteSpace:'nowrap' }}>
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : <span style={{ color:'#D1D5DB' }}>No date</span>}
                                    </td>
                                    <td style={{ padding:'0.9rem 1rem' }}>
                                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#5266F9,#7C3AED)', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'11px', color:'white', fontWeight:'700' }}>
                                        {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?'}
                                      </div>
                                    </td>
                                    <td style={{ padding:'0.9rem 1rem' }}>
                                      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', background:pc.bg, color:pc.text, padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'600' }}>
                                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:pc.dot, flexShrink:0 }}></span>
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                      </span>
                                    </td>
                                    <td style={{ padding:'0.9rem 1rem', textAlign:'right', position:'relative' }}>
                                      <button
                                        style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', padding:'4px', borderRadius:'6px' }}
                                        onClick={e => { e.stopPropagation(); setActiveDropdown(activeDropdown === task.id ? null : task.id); }}>
                                        <MoreHorizontal size={17} />
                                      </button>
                                      {activeDropdown === task.id && (
                                        <div style={{ position:'absolute', right:'30px', top:'8px', background:'white', border:'1px solid #E5E7EB', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:99, width:'170px', textAlign:'left', padding:'0.4rem 0', animation:'fadeIn 0.1s ease' }}>
                                          <div style={{ padding:'0.4rem 1rem', fontSize:'0.7rem', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em' }}>Change Status</div>
                                          {groups.map(g => (
                                            <div key={g.id}
                                              style={{ padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.875rem', background:task.status === g.id ? '#F5F3FF' : 'transparent', color:task.status === g.id ? '#5266F9' : '#374151', fontWeight:task.status === g.id ? '600' : '400', transition:'background 0.15s' }}
                                              onMouseEnter={e => { if (task.status !== g.id) e.currentTarget.style.background='#F9FAFB'; }}
                                              onMouseLeave={e => { if (task.status !== g.id) e.currentTarget.style.background='transparent'; }}
                                              onClick={() => changeTaskStatus(task.id, g.id)}>
                                              {g.label}
                                            </div>
                                          ))}
                                          {/* Only show Edit if user has edit permission */}
                                          {canEditTask && (
                                            <>
                                              <div style={{ height:'1px', background:'#F1F5F9', margin:'0.4rem 0' }}></div>
                                              <div
                                                style={{ padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.875rem', color:'#374151', transition:'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                                onClick={() => { setActiveDropdown(null); setEditingTask(task); setShowModal(true); }}>
                                                ✏️ Edit Task
                                              </div>
                                            </>
                                          )}
                                          {canDeleteTask && (
                                            <div
                                              style={{ padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.875rem', color:'#EF4444', transition:'background 0.15s' }}
                                              onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                                              onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                              onClick={() => { setActiveDropdown(null); handleDelete(task.id); }}>
                                              🗑️ Delete Task
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Empty state */}
                      {!isCollapsed && groupTasks.length === 0 && (
                        <div style={{ padding:'1.5rem', textAlign:'center', color:'#CBD5E1', fontSize:'0.875rem' }}>
                          No tasks here yet
                          {canCreateTask && <span style={{ color:'#5266F9', cursor:'pointer', marginLeft:'0.3rem' }} onClick={() => { setEditingTask(null); setShowModal(true); }}>— Add one</span>}
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

      {showModal && (
        <TaskModal
          task={editingTask}
          users={users}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchTasks(); }}
        />
      )}
    </div>
  );
};

export default MyTasks;
