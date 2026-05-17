import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const TaskModal = ({ task, onClose, onSave, users }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, formData);
        toast.success('Task updated successfully!');
      } else {
        await api.post('/tasks', formData);
        toast.success('New task created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: '46px',
    padding: '0 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
    outline: 'none',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    color: '#111827'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: '6px'
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="modal-content" style={{
        width: '100%', maxWidth: '550px', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', display: 'flex', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Task Title <span style={{color: '#EF4444'}}>*</span></label>
              <input type="text" required maxLength="100" style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#2563EB'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical', minHeight: '100px'}} rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#2563EB'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={inputStyle} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#2563EB'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" style={inputStyle} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#2563EB'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              {task && (
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#2563EB'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6' }}>
              <button type="button" onClick={onClose} style={{ padding: '0 1.25rem', height: '44px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ padding: '0 1.5rem', height: '44px', borderRadius: '8px', border: 'none', background: '#2563EB', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s', boxShadow: '0 1px 2px rgba(37, 99, 235, 0.1)' }} onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'} onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}>
                {loading ? <div className="spinner-fast" style={{ borderTopColor: 'white', width: '18px', height: '18px' }}></div> : (task ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
