import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Clock, CheckCircle, ListTodo } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/my-stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Good morning, {user.name} 👋</h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#E2E8F0', padding:'1rem', borderRadius:'8px', color:'#475569'}}><ListTodo size={24}/></div>
          <div>
            <div className="label">To Do</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.counts.todo || 0}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#DBEAFE', padding:'1rem', borderRadius:'8px', color:'#1D4ED8'}}><Clock size={24}/></div>
          <div>
            <div className="label">In Progress</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.counts.inProgress || 0}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#DCFCE7', padding:'1rem', borderRadius:'8px', color:'#15803D'}}><CheckCircle size={24}/></div>
          <div>
            <div className="label">Done</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.counts.done || 0}</div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
        <div className="card">
          <h3 style={{marginBottom:'1rem', color:'var(--danger)'}}>Due Today</h3>
          {stats?.dueToday.length === 0 ? (
            <p className="text-muted">No tasks due today.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {stats?.dueToday.map(task => (
                <div key={task.id} style={{padding:'0.75rem', border:'1px solid var(--border)', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'500'}}>{task.title}</span>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{marginBottom:'1rem'}}>Recently Updated</h3>
          {stats?.recentlyUpdated.length === 0 ? (
            <p className="text-muted">No recently updated tasks.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {stats?.recentlyUpdated.map(task => (
                <div key={task.id} style={{padding:'0.75rem', border:'1px solid var(--border)', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'500'}}>{task.title}</span>
                  <span className="text-muted" style={{fontSize:'0.875rem'}}>{new Date(task.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
