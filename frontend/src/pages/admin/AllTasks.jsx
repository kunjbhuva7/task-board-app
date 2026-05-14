import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canDeleteTask, canEditTask } = usePermissions();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchTasks();
  }, []);

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

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h2>All Tasks</h2>
      </div>

      <div className="card" style={{marginBottom:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:'200px'}}>
          <input type="text" className="input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              {canDeleteTask && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign:'center'}}><div className="spinner spinner-primary" style={{margin:'0 auto'}}></div></td></tr>
            ) : filteredTasks.map(t => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                <td><span className={`badge`} style={{textTransform:'capitalize'}}>{t.priority}</span></td>
                <td>{t.assignee_name || <span className="text-muted">Unassigned</span>}</td>
                <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                {canDeleteTask && (
                  <td>
                    <button className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}} onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
            {!loading && filteredTasks.length === 0 && (
              <tr><td colSpan="6" style={{textAlign:'center'}} className="text-muted">No tasks found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTasks;
