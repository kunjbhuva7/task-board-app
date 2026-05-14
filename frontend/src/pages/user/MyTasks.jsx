import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronRight, Check } from 'lucide-react';
import TaskModal from '../../components/TaskModal';

const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

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
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin' || canCreateTask) fetchUsers();
  }, [user, canCreateTask]);

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

  const handleSubmitApproval = async (id) => {
    try {
      await api.put(`/tasks/${id}/submit-approval`);
      toast.success('Task submitted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to submit task');
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
            <div style={{ padding: '1rem 0', color: '#9CA3AF', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Kanban
            </div>
            <div style={{ padding: '1rem 0', color: '#9CA3AF', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Timeline
            </div>
            <div style={{ padding: '1rem 0', color: '#111827', fontWeight: '700', cursor: 'pointer', borderBottom: '3px solid #111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

      {/* List Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {groups.map(group => {
              const groupTasks = tasks.filter(t => t.status === group.id);
              if (groupTasks.length === 0 && group.id !== 'todo' && group.id !== 'in_progress') return null; // hide empty done groups to match image look, but keep todo
              const isCollapsed = collapsedGroups[group.id];

              return (
                <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Group Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', marginBottom: isCollapsed ? '0' : '0.5rem', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => toggleGroup(group.id)}>
                      {isCollapsed ? <ChevronRight size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
                      <span style={{ fontWeight: '700', color: '#1F2937', fontSize: '0.95rem' }}>{group.label}</span>
                      <span style={{ background: '#EEF0FF', color: '#5266F9', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{groupTasks.length}</span>
                    </div>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setEditingTask(null); setShowModal(true); }}><Plus size={18} /></button>
                  </div>

                  {/* Group Items Table */}
                  {!isCollapsed && groupTasks.length > 0 && (
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
                              <td style={{ padding: '1rem', color: '#4B5563', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description || '-'}</td>
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
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setEditingTask(task); setShowModal(true); }}>
                                  <MoreHorizontal size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
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
