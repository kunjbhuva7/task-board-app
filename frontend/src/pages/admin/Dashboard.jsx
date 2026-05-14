import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, CheckCircle, Clock, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>;
  }

  const statusColors = {
    todo: '#94A3B8',
    in_progress: '#2563EB',
    review: '#D97706',
    done: '#16A34A'
  };

  const chartData = stats?.tasksByStatus.map(t => ({
    name: t.status.replace('_', ' ').toUpperCase(),
    count: t.count,
    fill: statusColors[t.status] || '#2563EB'
  }));

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'var(--primary-light)', padding:'1rem', borderRadius:'8px', color:'var(--primary)'}}><Users size={24}/></div>
          <div>
            <div className="label">Total Users</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.totalUsers || 0}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#DBEAFE', padding:'1rem', borderRadius:'8px', color:'#1D4ED8'}}><Clock size={24}/></div>
          <div>
            <div className="label">Active Tasks</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.activeTasks || 0}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#DCFCE7', padding:'1rem', borderRadius:'8px', color:'#15803D'}}><CheckCircle size={24}/></div>
          <div>
            <div className="label">Completed (Week)</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.tasksCompletedThisWeek || 0}</div>
          </div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'#FEF3C7', padding:'1rem', borderRadius:'8px', color:'#B45309'}}><Send size={24}/></div>
          <div>
            <div className="label">Pending Invites</div>
            <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.pendingInvites || 0}</div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem'}}>
        <div className="card">
          <h3 style={{marginBottom:'1rem'}}>Tasks by Status</h3>
          <div style={{height:'300px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:'1rem'}}>Recent Activity</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {stats?.recentActivity?.map(act => (
              <div key={act.id} style={{borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem'}}>
                <div style={{fontWeight:'500'}}>{act.user_name || 'System'} <span style={{fontWeight:'normal', color:'var(--text-secondary)'}}>{act.action}</span></div>
                <div style={{fontSize:'0.875rem', color:'var(--text-muted)'}}>{act.details}</div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>{new Date(act.created_at).toLocaleString()}</div>
              </div>
            ))}
            {!stats?.recentActivity?.length && <div className="text-muted">No recent activity</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
