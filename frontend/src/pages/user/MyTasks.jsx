import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import TaskModal from '../../components/TaskModal';

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
          {task.approval_status === 'pending' && !isAdmin && (
            <button className="btn btn-primary" style={{padding:'0.2rem 0.6rem', fontSize: '0.7rem', borderRadius: '4px', height: '24px', fontWeight: '600'}} onClick={() => onSubmitApproval(task.id)}>Submit</button>
          )}
          {task.approval_status === 'submitted' && isAdmin && (
            <button className="btn btn-success" style={{padding:'0.2rem 0.6rem', fontSize: '0.7rem', borderRadius: '4px', height: '24px', fontWeight: '600', backgroundColor: '#10B981', color: 'white'}} onClick={() => onApprove(task.id)}>Approve</button>
          )}
          {task.approval_status === 'submitted' && !isAdmin && (
            <span className="badge" style={{fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706'}}>In Review</span>
          )}
          {task.approval_status === 'approved' && (
            <span className="badge" style={{fontSize: '0.65rem', background: '#D1FAE5', color: '#059669'}}>Approved</span>
          )}
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

const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { canCreateTask, canEditTask, canDeleteTask } = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

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
      // It's okay if not admin
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin' || canCreateTask) fetchUsers();
  }, [user, canCreateTask]);

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
      toast.success('Task submitted for approval');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to submit task');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/tasks/${id}/approve`);
      toast.success('Task approved!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to approve task');
    }
  };

  const columns = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done'
  };

  const getTaskById = (id) => tasks.find(t => t.id === id);

  const onDragStart = (e) => {
    setActiveTask(getTaskById(e.active.id));
  };

  const onDragEnd = async (e) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeTask = getTaskById(active.id);
    let newStatus = over.id;

    // if over a task, get the task's status
    const overTask = getTaskById(over.id);
    if (overTask) newStatus = overTask.status;

    if (activeTask.status !== newStatus) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: newStatus } : t));
      try {
        await api.patch(`/tasks/${activeTask.id}/status`, { status: newStatus });
      } catch (err) {
        toast.error('Failed to update status');
        fetchTasks(); // revert
      }
    }
  };

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <div className="page-header">
        <h2>My Tasks</h2>
        {canCreateTask && (
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowModal(true); }}>
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>
      ) : (
        <DndContext collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {Object.entries(columns).map(([colId, colTitle]) => (
              <DroppableColumn
                key={colId}
                id={colId}
                title={colTitle}
                tasks={tasks.filter(t => t.status === colId)}
                onEdit={t => { setEditingTask(t); setShowModal(true); }}
                onDelete={handleDelete}
                canDelete={canDeleteTask}
                onSubmitApproval={handleSubmitApproval}
                onApprove={handleApprove}
                isAdmin={user.role === 'admin'}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className={`kanban-card priority-${activeTask.priority}`} style={{opacity:0.8}}>
                <strong>{activeTask.title}</strong>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

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
