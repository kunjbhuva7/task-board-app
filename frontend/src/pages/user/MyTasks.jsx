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

// --- KANBAN COMPONENTS ---
const SortableTask = ({ task, onEdit, onDelete, canDelete, onSubmitApproval, onApprove, isAdmin }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`kanban-card priority-${task.priority}`}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.25rem'}}>
        <strong style={{fontSize:'0.95rem', color: '#0F172A', fontWeight: '700', lineHeight: '1.4'}}>{task.title}</strong>
      </div>
      <div style={{fontSize:'0.85rem', color:'#64748B', marginBottom:'1rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight: '1.5'}}>
        {task.description || <span style={{fontStyle:'italic', color:'#CBD5E1'}}>No description provided</span>}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:'#94A3B8', fontWeight: '500'}}>
          <Calendar size={14} color="#CBD5E1" /> {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
        </div>
        <div style={{display:'flex', gap:'0.35rem', alignItems: 'center'}} onPointerDown={(e) => e.stopPropagation()}>
          <button style={{background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer', padding:'4px', display:'flex', borderRadius:'4px'}} onClick={() => onEdit(task)} onMouseEnter={e => {e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'}} onMouseLeave={e => {e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'}}><Edit2 size={14}/></button>
          {canDelete && <button style={{background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer', padding:'4px', display:'flex', borderRadius:'4px'}} onClick={() => onDelete(task.id)} onMouseEnter={e => {e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'}} onMouseLeave={e => {e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'}}><Trash2 size={14}/></button>}
        </div>
      </div>
    </div>
  );
};

const DroppableColumn = ({ id, title, tasks, onEdit, onDelete, canDelete, onSubmitApproval, onApprove, isAdmin }) => {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        {title} <span className="badge badge-todo">{tasks.length}</span>
      </div>
      <div className="kanban-cards">
        <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask 
              key={task.id} 
              task={task} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              canDelete={canDelete}
              onSubmitApproval={onSubmitApproval}
              onApprove={onApprove}
              isAdmin={isAdmin}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // List view states
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'kanban', 'timeline', 'list'
  const [activeDragTask, setActiveDragTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin' || canCreateTask) fetchUsers();
  }, [user, canCreateTask]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleGroup = (status) => {
    setCollapsedGroups(prev => ({...prev, [status]: !prev[status]}));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const changeTaskStatus = async (id, newStatus) => {
    setActiveDropdown(null);
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
      fetchTasks();
    }
  };

  const onDragStart = (e) => {
    setActiveDragTask(tasks.find(t => t.id === e.active.id));
  };

  const onDragEnd = async (e) => {
    const { active, over } = e;
    setActiveDragTask(null);
    if (!over) return;

    const dragTask = tasks.find(t => t.id === active.id);
    let newStatus = over.id;

    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) newStatus = overTask.status;

    if (dragTask.status !== newStatus) {
      changeTaskStatus(dragTask.id, newStatus);
    }
  };

  const groups = [
    { id: 'todo', label: 'To-do' },
    { id: 'in_progress', label: 'On Progress' },
    { id: 'review', label: 'In Review' },
    { id: 'done', label: 'Done' }
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': case 'urgent': return { bg: '#FEF2F2', text: '#EF4444', dot: '#EF4444' };
      case 'low': return { bg: '#EFF6FF', text: '#3B82F6', dot: '#3B82F6' };
      default: return { bg: '#FFFBEB', text: '#F59E0B', dot: '#F59E0B' };
    }
  };

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', background: 'white'}}>
      {/* Header Area */}
      <div style={{ padding: '2rem 2.5rem 0 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#5266F9', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              C
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#111827', margin: 0 }}>Craftboard Project</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', border: '2px solid white', zIndex: 3 }}>AL</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: 'white', border: '2px solid white', marginLeft: '-10px', zIndex: 2 }}>DT</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F59E0B', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: 'white', border: '2px solid white', marginLeft: '-10px', zIndex: 1 }}>{user.name.charAt(0)}</div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #E5E7EB', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
              <Search size={16} /> Invite
            </button>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div onClick={() => setActiveTab('kanban')} style={{ padding: '1rem 0', color: activeTab === 'kanban' ? '#111827' : '#9CA3AF', fontWeight: activeTab === 'kanban' ? '700' : '600', cursor: 'pointer', borderBottom: activeTab === 'kanban' ? '3px solid #111827' : '3px solid transparent' }}>
              Kanban
            </div>
            <div onClick={() => setActiveTab('timeline')} style={{ padding: '1rem 0', color: activeTab === 'timeline' ? '#111827' : '#9CA3AF', fontWeight: activeTab === 'timeline' ? '700' : '600', cursor: 'pointer', borderBottom: activeTab === 'timeline' ? '3px solid #111827' : '3px solid transparent' }}>
              Timeline
            </div>
            <div onClick={() => setActiveTab('list')} style={{ padding: '1rem 0', color: activeTab === 'list' ? '#111827' : '#9CA3AF', fontWeight: activeTab === 'list' ? '700' : '600', cursor: 'pointer', borderBottom: activeTab === 'list' ? '3px solid #111827' : '3px solid transparent' }}>
              List
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Search..." style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', width: '200px' }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #E5E7EB', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
              <Filter size={16} /> Filter
            </button>
            {canCreateTask && (
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111827', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', color: 'white', cursor: 'pointer' }} onClick={() => { setEditingTask(null); setShowModal(true); }}>
                <Plus size={16} /> New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>
        ) : (
          <>
            {activeTab === 'kanban' && (
              <DndContext collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className="kanban-board" style={{ height: 'auto', paddingBottom: '2rem' }}>
                  {groups.map(g => (
                    <DroppableColumn
                      key={g.id}
                      id={g.id}
                      title={g.label}
                      tasks={tasks.filter(t => t.status === g.id)}
                      onEdit={t => { setEditingTask(t); setShowModal(true); }}
                      onDelete={handleDelete}
                      canDelete={canDeleteTask}
                      onSubmitApproval={() => {}}
                      onApprove={() => {}}
                      isAdmin={user.role === 'admin'}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeDragTask ? (
                    <div className={`kanban-card priority-${activeDragTask.priority}`} style={{opacity:0.8}}>
                      <strong>{activeDragTask.title}</strong>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF' }}>
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Timeline View</h3>
                <p>Coming soon to Craftboard!</p>
              </div>
            )}

            {activeTab === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {groups.map(group => {
                  const groupTasks = tasks.filter(t => t.status === group.id);
                  if (groupTasks.length === 0 && group.id !== 'todo' && group.id !== 'in_progress') return null;
                  const isCollapsed = collapsedGroups[group.id];

                  return (
                    <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', marginBottom: isCollapsed ? '0' : '0.5rem', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => toggleGroup(group.id)}>
                          {isCollapsed ? <ChevronRight size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
                          <span style={{ fontWeight: '700', color: '#1F2937', fontSize: '0.95rem' }}>{group.label}</span>
                          <span style={{ background: '#EEF0FF', color: '#5266F9', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{groupTasks.length}</span>
                        </div>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setEditingTask(null); setShowModal(true); }}><Plus size={18} /></button>
                      </div>

                      {!isCollapsed && groupTasks.length > 0 && (
                        <div className="table-responsive" style={{ overflow: 'visible' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                              <tr>
                                <th style={{ width: '40px', padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent' }}></th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>Task Name</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>Description</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>Estimation</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>Type</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>People</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent', color: '#9CA3AF', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>Priority</th>
                                <th style={{ width: '40px', padding: '1rem', borderBottom: '1px solid #F1F5F9', background: 'transparent' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupTasks.map(task => {
                                const pColor = getPriorityColor(task.priority);
                                return (
                                  <tr key={task.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '1rem' }}>
                                      <div style={{ width: '16px', height: '16px', border: '2px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer' }}></div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: '#1F2937' }}>{task.title}</td>
                                    <td style={{ padding: '1rem', color: '#4B5563', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description || '-'}</td>
                                    <td style={{ padding: '1rem', color: '#1F2937', fontWeight: '500' }}>
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <span style={{ background: '#F3E8FF', color: '#9333EA', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Dashboard</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', border: '1px solid white', zIndex: 2, color: '#374151', fontWeight: 'bold' }}>
                                          {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: pColor.bg, color: pColor.text, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pColor.dot }}></span>
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                      </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === task.id ? null : task.id); }}>
                                        <MoreHorizontal size={18} />
                                      </button>
                                      {activeDropdown === task.id && (
                                        <div style={{ position: 'absolute', right: '30px', top: '10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, width: '160px', textAlign: 'left', padding: '0.5rem 0' }}>
                                          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase' }}>Change Status</div>
                                          {groups.map(g => (
                                            <div key={g.id} style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', background: task.status === g.id ? '#F3F4F6' : 'transparent', color: task.status === g.id ? '#5266F9' : '#374151', fontWeight: task.status === g.id ? '600' : '400' }} onClick={() => changeTaskStatus(task.id, g.id)}>
                                              {g.label}
                                            </div>
                                          ))}
                                          <div style={{ height: '1px', background: '#E5E7EB', margin: '0.5rem 0' }}></div>
                                          <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }} onClick={() => { setActiveDropdown(null); setEditingTask(task); setShowModal(true); }}>Edit Task</div>
                                          {canDeleteTask && (
                                            <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', color: '#EF4444' }} onClick={() => { setActiveDropdown(null); handleDelete(task.id); }}>Delete Task</div>
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
